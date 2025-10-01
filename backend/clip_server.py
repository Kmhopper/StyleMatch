# app/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import torch
from PIL import Image
import torchvision.transforms as T
from torchvision.models.detection import maskrcnn_resnet50_fpn
from transformers import CLIPProcessor, CLIPModel

app = FastAPI()

# ---------- Oppstart: last modeller én gang ----------
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

MASKRCNN_SCORE_THRESH = 0.7
mask_model = maskrcnn_resnet50_fpn(weights="DEFAULT").to(DEVICE).eval()
to_tensor = T.ToTensor()

clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(DEVICE).eval()
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# ---------- Hjelpefunksjoner ----------
def crop_best_box(image_pil: Image.Image):
    with torch.inference_mode():
        img = to_tensor(image_pil).unsqueeze(0).to(DEVICE)
        out = mask_model(img)[0]
    boxes = out.get("boxes", [])
    scores = out.get("scores", [])
    if boxes is None or len(boxes) == 0:
        return None
    # velg beste boks over terskel
    best = None
    best_score = -1.0
    for b, s in zip(boxes, scores):
        s = float(s.item())
        if s > MASKRCNN_SCORE_THRESH and s > best_score:
            best = b
            best_score = s
    if best is None:
        return None
    x1, y1, x2, y2 = [int(v) for v in best.to("cpu").tolist()]
    return image_pil.crop((x1, y1, x2, y2))

def clip_image_embedding(image_pil: Image.Image):
    with torch.inference_mode():
        inputs = clip_processor(images=image_pil, return_tensors="pt").to(DEVICE)
        feats = clip_model.get_image_features(**inputs)
        feats = feats / feats.norm(p=2, dim=-1, keepdim=True)  # L2-normaliser
    return feats.squeeze(0).to("cpu")  # (D,)

# ---------- Responsmodeller ----------
class AnalyzeResponse(BaseModel):
    features: list[float]

class ErrorResponse(BaseModel):
    error: str

# ---------- Endepunkt ----------
@app.post("/analyze", response_model=AnalyzeResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def analyze(file: UploadFile = File(...)):
    try:
        image = Image.open(file.file).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Ugyldig bildefil.")

    cropped = crop_best_box(image)
    if cropped is None:
        raise HTTPException(status_code=400, detail="Ingen klær funnet i bildet.")

    emb = clip_image_embedding(cropped)  # torch.Tensor (D,)
    return AnalyzeResponse(features=emb.tolist())
