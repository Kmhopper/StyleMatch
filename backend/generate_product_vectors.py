import os
import torch
import requests
import json
import mysql.connector
from PIL import Image
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

# Last inn CLIP-modellen
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def regenerate_feature_vectors():
    """
    Regenererer funksjonsvektorer for alle produkter i databasen.
    """
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        tables = ["hm_products", "weekday_products", "zara_products", "follestad_products"]

        for table in tables:
            print(f"Oppdaterer funksjonsvektorer for {table}...")
            cursor.execute(f"SELECT id, image_url FROM {table}")
            products = cursor.fetchall()

            for product in products:
                try:
                    # Last ned bildet og generer funksjonsvektor
                    response = requests.get(product['image_url'], stream=True)
                    response.raise_for_status()
                    image = Image.open(response.raw).convert("RGB")
                    
                    # Resizer bildet til CLIP-modellens forventning (224x224)
                    image = image.resize((224, 224))
                    inputs = processor(images=image, return_tensors="pt")
                    with torch.no_grad():
                        features = model.get_image_features(**inputs)
                    
                    # Normaliser funksjonsvektoren
                    normalized_features = features / features.norm(p=2, dim=-1, keepdim=True)
                    feature_vector_json = json.dumps(normalized_features.squeeze().tolist())

                    # Oppdater databasen
                    cursor.execute(
                        f"UPDATE {table} SET feature_vector = %s WHERE id = %s",
                        (feature_vector_json, product['id'])
                    )
                    conn.commit()
                    print(f"Oppdatert produkt ID {product['id']} i {table}.")
                except Exception as e:
                    print(f"Feil ved behandling av produkt ID {product['id']} i {table}: {e}")
    
    except mysql.connector.Error as e:
        print(f"Databasefeil: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    regenerate_feature_vectors()
