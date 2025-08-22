from fastapi import FastAPI, UploadFile
from fastapi.responses import JSONResponse
import torch
import mysql.connector
import json
from PIL import Image
from torchvision.models.detection import maskrcnn_resnet50_fpn
import torchvision.transforms as T
from transformers import CLIPProcessor, CLIPModel
from fastapi import File
import os
from dotenv import load_dotenv

# Laster miljøvariabler fra .env-filen
load_dotenv()

# Konfigurerer tilkobling til MySQL-databasen
db = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "root"),
    "database": os.getenv("DB_NAME", "clothing_data")
}

# Liste over tabeller som inneholder produktdata
TABLES = ["hm_products", "weekday_products", "zara_products", "follestad_products"]

# Oppretter FastAPI-applikasjonen
app = FastAPI()

class ClothingSegmenter:
    def __init__(self):
        # Initialiserer Mask R-CNN-modellen for klessegmentering
        self.model = maskrcnn_resnet50_fpn(weights="DEFAULT")
        self.model.eval()
        self.transform = T.Compose([T.ToTensor()])  # Transformerer bilder til tensorer

    def segment_clothing(self, image, device):
        #Segmenterer bildet og returnerer den beskjærte delen med klær
        image_tensor = self.transform(image).unsqueeze(0).to(device)
        with torch.no_grad():
            predictions = self.model(image_tensor)

        # Hvis det finnes segmenteringsbokser, beskjær bildet
        if len(predictions[0]['boxes']) > 0:
            box = predictions[0]['boxes'][0].cpu().numpy().astype(int)
            cropped_image = image.crop((box[0], box[1], box[2], box[3]))
            return cropped_image    
        else:
            return None

# Initialiserer CLIP-modellen for bildeegenskaper
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def get_image_features(image):
    #Genererer normaliserte bildeegenskaper ved hjelp av CLIP-modellen
    inputs = clip_processor(images=image, return_tensors="pt")
    with torch.no_grad():
        features = clip_model.get_image_features(**inputs)
    return features / features.norm(p=2, dim=-1, keepdim=True)

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    # Velger riktig enhet (GPU eller CPU)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    segmenter = ClothingSegmenter()

    try:
        # Åpner og konverterer bildet til RGB-format
        image = Image.open(file.file).convert("RGB")
        cropped_image = segmenter.segment_clothing(image, device)

        # Returnerer feil hvis ingen klær ble funnet
        if cropped_image is None:
            return JSONResponse(content={"error": "Ingen klær funnet i bildet."}, status_code=400)

        # Genererer egenskapsvektor for det segmenterte bildet
        user_vector = get_image_features(cropped_image).squeeze()

        # Kobler til databasen for å hente produktdata
        conn = mysql.connector.connect(**db)
        cursor = conn.cursor(dictionary=True)

        similar_products = []

        # Itererer gjennom alle tabeller for å finne lignende produkter
        for table in TABLES:
            cursor.execute(f"SELECT id, name, price, image_url, feature_vector FROM {table}")
            products = cursor.fetchall()

            for product in products:
                # Hopper over produkter uten egenskapsvektor
                if product["feature_vector"] is None:
                    continue

                # Laster produktets egenskapsvektor fra JSON-format
                product_vector = torch.tensor(json.loads(product["feature_vector"]))
                if user_vector.shape != product_vector.shape:
                    print(f"Dimensjonsfeil mellom vektorer: user_vector: {user_vector.shape}, product_vector: {product_vector.shape}")
                    continue

                # Beregner kosinuslikhet mellom brukerens vektor og produktets vektor
                similarity = torch.nn.functional.cosine_similarity(user_vector, product_vector, dim=0)

                # Legger til produktet i listen over lignende produkter
                similar_products.append({
                    "id": product["id"],
                    "name": product["name"],
                    "price": product["price"],
                    "image_url": product["image_url"],
                    "similarity": similarity.item(),
                })

        # Sorterer produktene etter likhet i synkende rekkefølge
        similar_products = sorted(similar_products, key=lambda x: x["similarity"], reverse=True)
        return {"features": user_vector.tolist()}

    except Exception as e:
        # Returnerer feil hvis noe går galt
        return JSONResponse(content={"error": str(e)}, status_code=500)
