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

# ------------------------------------------------------------
# Miljø og databaseoppsett
# ------------------------------------------------------------

# Laster miljøvariabler fra .env-filen (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
load_dotenv()

# Konfigurerer tilkobling til MySQL-databasen
# Merk: dette er en enkel tilkobling per request-bruk; i produksjon er connection pool anbefalt.
db = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "root"),
    "database": os.getenv("DB_NAME", "clothing_data")
}

# Liste over tabeller som inneholder produktdata (søkes i hver av disse)
TABLES = ["hm_products", "weekday_products", "zara_products", "follestad_products"]

# Oppretter FastAPI-applikasjonen
app = FastAPI()

# ------------------------------------------------------------
# Segmentering (Mask R-CNN): finn og beskjær klær i brukerbildet
# ------------------------------------------------------------

class ClothingSegmenter:
    """Wrapper rundt Mask R-CNN som finner en boks med klær og returnerer beskåret bilde."""
    def __init__(self):
        # Initialiserer Mask R-CNN-modellen for klessegmentering
        # Kjøres på CPU som standard i denne koden; vil du bruke GPU: .to('cuda')
        self.model = maskrcnn_resnet50_fpn(weights="DEFAULT")
        self.model.eval()
        self.transform = T.Compose([T.ToTensor()])  # PIL → Tensor

    def segment_clothing(self, image, device):
        """Segmenterer bildet og returnerer den beskjærte delen med klær (eller None hvis ingen funn)."""
        image_tensor = self.transform(image).unsqueeze(0).to(device)
        with torch.no_grad():
            predictions = self.model(image_tensor)

        # Hvis det finnes segmenteringsbokser, beskjær bildet med første boks
        # (Alternativ: velg største boks eller høyest score.)
        if len(predictions[0]['boxes']) > 0:
            box = predictions[0]['boxes'][0].cpu().numpy().astype(int)
            cropped_image = image.crop((box[0], box[1], box[2], box[3]))
            return cropped_image    
        else:
            return None

# ------------------------------------------------------------
# CLIP: bilde → vektor
# ------------------------------------------------------------

# Initialiserer CLIP-modellen for bildeegenskaper (må matche prosessor)
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def get_image_features(image):
    """Genererer L2-normaliserte bildeegenskaper ved hjelp av CLIP-modellen (shape: (1, D))."""
    inputs = clip_processor(images=image, return_tensors="pt")
    with torch.no_grad():
        features = clip_model.get_image_features(**inputs)
    # Normaliser for å kunne bruke cosine-likhet direkte
    return features / features.norm(p=2, dim=-1, keepdim=True)

# ------------------------------------------------------------
# Endepunkt: /analyze
# Flyt:
#  1) Motta bilde (multipart/form-data)
#  2) Segmenter (crop) klær fra bildet
#  3) Lag CLIP-vektor for det beskårne bildet
#  4) (Valgfritt) slå opp produkter og beregne likhet — i denne koden returneres bare brukerens vektor
# ------------------------------------------------------------

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    # Velger riktig enhet (GPU hvis tilgjengelig, ellers CPU)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    segmenter = ClothingSegmenter()

    try:
        # Åpner og konverterer bildet til RGB-format
        image = Image.open(file.file).convert("RGB")

        # Segmenter og beskjær ut klesområde
        cropped_image = segmenter.segment_clothing(image, device)

        # Returnerer feil hvis ingen klær ble funnet
        if cropped_image is None:
            return JSONResponse(content={"error": "Ingen klær funnet i bildet."}, status_code=400)

        # Genererer egenskapsvektor for det segmenterte bildet
        # .squeeze() → gjør om fra (1, D) til (D,) for enklere JSON-serialisering
        user_vector = get_image_features(cropped_image).squeeze()

        # Hvis du også vil beregne likheter her:
        #  - Koble til DB
        #  - Hent feature_vector fra hver tabell
        #  - Beregn cosine-likhet og returner topp N
        # Nedenfor ligger grunnlaget for dette (kobling + loop), men funksjonen returnerer kun vektoren.

        # Kobler til databasen (ikke brukt til matching her, men klart hvis du vil utvide)
        conn = mysql.connector.connect(**db)
        cursor = conn.cursor(dictionary=True)

        similar_products = []  # beholdes tom i denne implementasjonen

        # Itererer gjennom alle tabeller for å evt. hente produkter (her brukes ikke resultatet videre)
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
                    # Dimensjonsmismatch → hopp over (kan skje hvis ulike CLIP-varianter er brukt)
                    print(f"Dimensjonsfeil mellom vektorer: user_vector: {user_vector.shape}, product_vector: {product_vector.shape}")
                    continue

                # Her kunne du beregnet kosinuslikhet og bygget opp 'similar_products'
                # similarity = torch.nn.functional.cosine_similarity(user_vector, product_vector, dim=0)
                # similar_products.append({...})

        # Sortering/returnering av liknende produkter er utelatt her.
        # I stedet returneres kun feature-vektoren (som backend/Express bruker videre).
        return {"features": user_vector.tolist()}

    except Exception as e:
        # Returnerer feil hvis noe går galt i segmentering/CLIP/IO
        return JSONResponse(content={"error": str(e)}, status_code=500)
