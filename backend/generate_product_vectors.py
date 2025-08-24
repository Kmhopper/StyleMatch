# backend/generate_product_vectors.py
import os, io, json, re, argparse, time
import requests
import mysql.connector
from PIL import Image, UnidentifiedImageError
from concurrent.futures import ThreadPoolExecutor, as_completed

import torch
from transformers import CLIPProcessor, CLIPModel
from dotenv import load_dotenv

# ---------------------- Konfig ------------------------------------
load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "root"),
    "database": os.getenv("DB_NAME", "clothing_data"),
}

TABLES = ["hm_products", "weekday_products", "zara_products", "follestad_products"]

# FART: slå AV segmentering for produkter (Mask R-CNN er flaskehals)
USE_SEGMENT = False  # sett True hvis du vil croppe klær før CLIP
BATCH_SIZE = 64      # øk/lav avh. av VRAM (16–128 typisk)
NUM_WORKERS = 16     # samtidige nedlastinger
COMMIT_EVERY = 800   # bulk-commit hver N rader

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[INFO] Device: {device}")

# Last CLIP én gang
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
clip_model.eval()
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Segmenter-lazy (kun hvis brukt)
_segmenter = None
def get_segmenter():
    global _segmenter
    if _segmenter is None:
        import torchvision.transforms as T
        from torchvision.models.detection import maskrcnn_resnet50_fpn
        _segmenter = {
            "model": maskrcnn_resnet50_fpn(weights="DEFAULT").to(device).eval(),
            "to_tensor": T.Compose([T.ToTensor()])
        }
    return _segmenter

# ---------------------- Hjelpere -----------------------------------
def download_image(session: requests.Session, url: str) -> Image.Image | None:
    try:
        r = session.get(url, stream=True, timeout=20)
        r.raise_for_status()
        return Image.open(io.BytesIO(r.content)).convert("RGB")
    except Exception as e:
        return None

@torch.inference_mode()
def images_to_clip_vectors(pil_images: list[Image.Image]) -> torch.Tensor:
    """
    Tar en liste PIL-bilder -> (B, D) normaliserte CLIP-vektorer (på CPU).
    """
    if len(pil_images) == 0:
        return torch.empty((0, clip_model.config.projection_dim))
    with torch.cuda.amp.autocast(enabled=(device.type == "cuda")):
        inputs = clip_processor(images=pil_images, return_tensors="pt", padding=True)
        inputs = {k: v.to(device) for k, v in inputs.items()}
        feats = clip_model.get_image_features(**inputs)
        feats = feats / feats.norm(p=2, dim=-1, keepdim=True)
    return feats.detach().cpu()

def segment_crop(img: Image.Image) -> Image.Image:
    """
    Enkelt crop med Mask R-CNN (tar største boks). Brukes bare hvis USE_SEGMENT = True.
    """
    seg = get_segmenter()
    model, to_tensor = seg["model"], seg["to_tensor"]
    with torch.inference_mode():
        t = to_tensor(img).unsqueeze(0).to(device)
        preds = model(t)
    boxes = preds[0].get("boxes")
    if boxes is None or len(boxes) == 0:
        return img  # fallback: fullbilde
    boxes_cpu = boxes.detach().cpu()
    areas = (boxes_cpu[:, 2]-boxes_cpu[:, 0]) * (boxes_cpu[:, 3]-boxes_cpu[:, 1])
    i = int(torch.argmax(areas))
    x1, y1, x2, y2 = boxes_cpu[i].int().tolist()
    pad = 8
    x1 = max(x1 - pad, 0); y1 = max(y1 - pad, 0)
    x2 = min(x2 + pad, img.width); y2 = min(y2 + pad, img.height)
    return img.crop((x1, y1, x2, y2))

def prepare_images_parallel(rows: list[tuple[int, str]]) -> list[tuple[int, Image.Image]]:
    """
    Paralleliser kun NEDLASTING (lett). Segmentering gjøres sekvensielt (tung).
    rows: [(id, image_url), ...]
    return: [(id, pil_img), ...] (filtrert for None)
    """
    out: list[tuple[int, Image.Image]] = []
    session = requests.Session()
    with ThreadPoolExecutor(max_workers=NUM_WORKERS) as pool:
        futs = {pool.submit(download_image, session, url): (pid, url) for pid, url in rows}
        for fut in as_completed(futs):
            pid, url = futs[fut]
            img = fut.result()
            if img is None:
                continue
            out.append((pid, img))
    # valgfri segmentering (sekvensielt for stabilitet)
    if USE_SEGMENT:
        segged: list[tuple[int, Image.Image]] = []
        for pid, img in out:
            try:
                segged.append((pid, segment_crop(img)))
            except Exception:
                segged.append((pid, img))
        return segged
    return out

def regenerate_feature_vectors(process_all: bool = False):
    """
    process_all=False: bare rows der feature_vector IS NULL (raskest)
    process_all=True : full refresh
    """
    conn = None
    total_updated = 0
    started = time.time()
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        for table in TABLES:
            print(f"\n[INFO] Tabell: {table}")
            # plukk bare de som trenger embedding – raskest i praksis
            if not process_all:
                sel = f"SELECT id, image_url FROM {table} WHERE feature_vector IS NULL AND image_url IS NOT NULL AND image_url <> ''"
            else:
                sel = f"SELECT id, image_url FROM {table} WHERE image_url IS NOT NULL AND image_url <> ''"
            cursor.execute(sel)
            rows = cursor.fetchall()
            print(f"[INFO] Rader å prosessere: {len(rows)}")
            if not rows:
                continue

            # 1) Parallell nedlasting (rask)
            id_url = [(r["id"], r["image_url"]) for r in rows]
            prepared = prepare_images_parallel(id_url)
            print(f"[INFO] Nedlastet: {len(prepared)}")

            # 2) CLIP i batcher + bulk-commit
            update_sql = f"UPDATE {table} SET feature_vector = %s WHERE id = %s"
            buffer = []
            done = 0
            for i in range(0, len(prepared), BATCH_SIZE):
                batch = prepared[i:i+BATCH_SIZE]
                pids, imgs = zip(*batch)
                vecs = images_to_clip_vectors(list(imgs))  # (B, D)
                for pid, vec in zip(pids, vecs):
                    buffer.append((json.dumps(vec.tolist()), pid))
                    done += 1
                if len(buffer) >= COMMIT_EVERY:
                    cursor.executemany(update_sql, buffer)
                    conn.commit()
                    total_updated += len(buffer)
                    buffer.clear()
                    print(f"  [OK] {done}/{len(prepared)} i {table}")

            if buffer:
                cursor.executemany(update_sql, buffer)
                conn.commit()
                total_updated += len(buffer)
                print(f"  [OK] {done}/{len(prepared)} i {table}")

    except mysql.connector.Error as e:
        print(f"[DB] Feil: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()
    print(f"\n[FULLFØRT] Oppdatert {total_updated} rader på {time.time()-started:.1f}s")

# ---------------------- CLI ---------------------------------------
if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Regenerer CLIP-vektorer for produkter")
    ap.add_argument("--all", action="store_true", help="Prosesser ALLE rader (ikke bare NULL)")
    args = ap.parse_args()
    regenerate_feature_vectors(process_all=args.all)
