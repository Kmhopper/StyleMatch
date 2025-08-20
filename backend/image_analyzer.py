from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch

# Last inn den pre-trente CLIP-modellen
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def analyze_image(image_path):
    """
    Analyserer et bilde og returnerer dets funksjoner som en vektor.
    """
    try:
        # Åpne og prosesser bildet
        image = Image.open(image_path)
        inputs = processor(images=image, return_tensors="pt")
        
        # Hent funksjoner fra modellen
        with torch.no_grad():
            image_features = model.get_image_features(**inputs)
        
        # Normaliser funksjonene
        normalized_features = image_features / image_features.norm(p=2, dim=-1, keepdim=True)
        return normalized_features
    except Exception as e:
        print(f"Feil ved bildeanalyse: {e}")
        return None

if __name__ == "__main__":
    # Test med et bilde
    image_path = "C:/Users/marcu/React-prosjekt/backend/test_image.jpg"
    features = analyze_image(image_path)
    
    if features is not None:
        print("Bildeanalyse fullført.")
        print("Funksjoner (vektor):", features)
    else:
        print("Bildeanalyse mislyktes.")
