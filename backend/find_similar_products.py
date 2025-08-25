import os
import json
import torch
import mysql.connector
from PIL import Image
from decimal import Decimal
from torchvision.models.detection import maskrcnn_resnet50_fpn
import torchvision.transforms as T
from transformers import CLIPProcessor, CLIPModel
from dotenv import load_dotenv

# ------------------------------------------------------------
# Konfig & oppsett
# ------------------------------------------------------------

# Last inn .env-variabler (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
load_dotenv()

# Databasekonfigurasjon (enkelt-tilkobling)
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
}

# Hvilke butikktabeller vi søker i (UNION i praksis)
TABLES = ["hm_products", "weekday_products", "zara_products", "follestad_products"]

# ------------------------------------------------------------
# Segmentering (Mask R-CNN) – beskjær klær fra brukerbilde
# ------------------------------------------------------------

class ClothingSegmenter:
    """Wrapper rundt Mask R-CNN for å finne en kle-boks og croppe bildet."""
    def __init__(self):
        # OBS: modellen lastes på CPU her. Hvis du vil bruke GPU:
        # self.model = maskrcnn_resnet50_fpn(weights="DEFAULT").to('cuda')
        self.model = maskrcnn_resnet50_fpn(weights="DEFAULT")
        self.model.eval()
        self.transform = T.Compose([T.ToTensor()])

    def segment_clothing(self, image, device):
        """
        Segmenterer og returnerer et beskåret PIL-bilde basert på første funn.
        Fallback: returner None hvis ingen bokser ble funnet.
        """
        image_tensor = self.transform(image).unsqueeze(0).to(device)
        with torch.no_grad():
            predictions = self.model(image_tensor)  # kjører på CPU med nåværende kode

        if len(predictions[0]['boxes']) > 0:
            # NB: tar "første" boks. Alternativt kan du velge den største/med høyest score.
            box = predictions[0]['boxes'][0].cpu().numpy().astype(int)
            cropped_image = image.crop((box[0], box[1], box[2], box[3]))
            return cropped_image
        else:
            return None

# ------------------------------------------------------------
# CLIP – bilde-encoding
# ------------------------------------------------------------

# Last inn CLIP-modellen og prosessoren (må matche)
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def get_image_features(image):
    """Kjør bildet gjennom CLIP og returner L2-normalisert vektor (shape: (1, D))."""
    inputs = clip_processor(images=image, return_tensors="pt")
    with torch.no_grad():
        features = clip_model.get_image_features(**inputs)  # (1, D)
    # Normaliser slik at cosine-likhet kan brukes direkte
    return features / features.norm(p=2, dim=-1, keepdim=True)

# ------------------------------------------------------------
# Diverse hjelpere
# ------------------------------------------------------------

def decimal_default(obj):
    """Konverter Decimal → float ved JSON-serialisering (for priser fra MySQL)."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

# ------------------------------------------------------------
# Hovedfunksjon: finn lignende produkter mot DB
# ------------------------------------------------------------

def find_similar_products(image_path):
    """
    1) Segmentér brukerbildet (crop klær)
    2) Hent CLIP-vektor for det beskårne bildet
    3) Slå opp alle produkter med lagret vektor fra hver tabell
    4) Beregn cosine-likhet og returner topp 10

    Forventer at kolonnen 'feature_vector' i DB er lagret som JSON-lista (f.eks. "[0.1, 0.2, ...]").
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    segmenter = ClothingSegmenter()
    
    try:
        # Åpne bildet og segmentér (beskjær) klærne
        image = Image.open(image_path).convert("RGB")
        cropped_image = segmenter.segment_clothing(image, device)
        
        if cropped_image is None:
            return {"error": "Ingen klær funnet i bildet."}
        
        # Hent (1, D)-vektor for brukerbildet (normalisert)
        user_vector = get_image_features(cropped_image)  # shape: (1, D)

        # Koble til DB (enkelt-tilkobling; vurder connection pool i prod)
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        similar_products = []

        # NB: her henter vi ALLE rader fra hver tabell og scorer i Python.
        # For store datamengder bør du vurdere ANN/vektorindeks eller filtrere på kategori først.
        for table in TABLES:
            cursor.execute(f"SELECT id, name, price, image_url, feature_vector FROM {table}")
            products = cursor.fetchall()

            for product in products:
                if product["feature_vector"] is None:
                    continue

                # Parse lagret JSON → tensor
                product_vector = torch.tensor(json.loads(product["feature_vector"]))
                # OBS/TODO: sørg for at dimensjoner matcher; ev. user_vector = user_vector.squeeze(0)
                # Her brukes dim=0; hvis product_vector er (D,) og user_vector (1,D), vil PyTorch broadcast'e.
                similarity = torch.nn.functional.cosine_similarity(user_vector, product_vector, dim=0)

                similar_products.append({
                    "id": product["id"],
                    "name": product["name"],
                    "price": product["price"],
                    "image_url": product["image_url"],
                    "similarity": similarity.item(),
                })

        # Sorter synkende på likhet og ta topp 10
        similar_products = sorted(similar_products, key=lambda x: x["similarity"], reverse=True)
        return similar_products[:10]

    except mysql.connector.Error as e:
        # Databasefeil (forbindelse, spørring, osv.)
        return {"error": f"Databasefeil: {str(e)}"}
    finally:
        # OBS: kan kaste hvis 'conn' ikke ble opprettet. Sjekk at variablene finnes.
        try:
            if conn.is_connected():
                cursor.close()
                conn.close()
        except Exception:
            pass

# ------------------------------------------------------------
# CLI-test: kjør "python fila.py path/til/bilde.jpg"
# ------------------------------------------------------------

if __name__ == "__main__":
    import sys
    image_path = sys.argv[1]
    results = find_similar_products(image_path)
    print(json.dumps(results, default=decimal_default))
