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

# Last inn .env-variabler
load_dotenv()

# Databasekonfigurasjon
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
}

TABLES = ["hm_products", "weekday_products", "zara_products", "follestad_products"]

# Last inn Mask R-CNN modellen
class ClothingSegmenter:
    def __init__(self):
        self.model = maskrcnn_resnet50_fpn(weights="DEFAULT")
        self.model.eval()
        self.transform = T.Compose([T.ToTensor()])

    def segment_clothing(self, image, device):
        """Segmenterer bildet og returnerer den beskjærte delen med klær"""
        image_tensor = self.transform(image).unsqueeze(0).to(device)
        with torch.no_grad():
            predictions = self.model(image_tensor)

        if len(predictions[0]['boxes']) > 0:
            box = predictions[0]['boxes'][0].cpu().numpy().astype(int)
            cropped_image = image.crop((box[0], box[1], box[2], box[3]))
            return cropped_image
        else:
            return None

# Last inn CLIP-modellen
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def get_image_features(image):
    """Hent funksjonsvektor for et beskåret bilde ved hjelp av CLIP"""
    inputs = clip_processor(images=image, return_tensors="pt")
    with torch.no_grad():
        features = clip_model.get_image_features(**inputs)
    return features / features.norm(p=2, dim=-1, keepdim=True)

def decimal_default(obj):
    """Konverter Decimal-objekter til float for JSON-serialisering."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def find_similar_products(image_path):
    """Segmenter bildet, hent funksjonsvektor og finn lignende produkter i databasen."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    segmenter = ClothingSegmenter()
    
    try:
        image = Image.open(image_path).convert("RGB")
        cropped_image = segmenter.segment_clothing(image, device)
        
        if cropped_image is None:
            return {"error": "Ingen klær funnet i bildet."}
        
        user_vector = get_image_features(cropped_image)

        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        similar_products = []

        for table in TABLES:
            cursor.execute(f"SELECT id, name, price, image_url, feature_vector FROM {table}")
            products = cursor.fetchall()

            for product in products:
                if product["feature_vector"] is None:
                    continue

                product_vector = torch.tensor(json.loads(product["feature_vector"]))
                similarity = torch.nn.functional.cosine_similarity(user_vector, product_vector, dim=0)

                similar_products.append({
                    "id": product["id"],
                    "name": product["name"],
                    "price": product["price"],
                    "image_url": product["image_url"],
                    "similarity": similarity.item(),
                })

        similar_products = sorted(similar_products, key=lambda x: x["similarity"], reverse=True)
        return similar_products[:10]

    except mysql.connector.Error as e:
        return {"error": f"Databasefeil: {str(e)}"}
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    import sys
    image_path = sys.argv[1]
    results = find_similar_products(image_path)
    print(json.dumps(results, default=decimal_default))
