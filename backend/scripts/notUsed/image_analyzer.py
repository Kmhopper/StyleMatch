from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch

# Last inn forhåndstrent CLIP (bilde-encoder). 
# Modellen og prosessoren må matche (vit-base-patch32).
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def analyze_image(image_path):
    """
    Beregn en CLIP-bildevektor for filen på 'image_path'.

    Steps:
      1) Åpne bilde (PIL) og pakk det til riktig tensor-format via CLIPProcessor
      2) Kjør gjennom CLIP image-encoder med no_grad (ingen backprop)
      3) L2-normaliser vektoren (slik at cosine-likhet kan brukes direkte)

    Args:
        image_path (str): Absolutt/relativ bane til bildefil (png/jpg/webp, osv.)

    Returns:
        torch.Tensor: Normalisert vektor med shape (1, D) på CPU (typisk D=512),
                      eller None ved feil.
    """
    try:
        # Åpne bilde fra disk. (PIL håndterer de fleste formater)
        image = Image.open(image_path)

        # Gjør om til batchet input-tensorer for CLIP (inkluderer resize/normalisering)
        inputs = processor(images=image, return_tensors="pt")

        # Inference uten gradienter (raskere/lavere minne)
        with torch.no_grad():
            image_features = model.get_image_features(**inputs)  # shape: (1, D)

        # L2-normaliser vektoren → ‖x‖2 = 1 (bra for cosine-similarity)
        normalized_features = image_features / image_features.norm(p=2, dim=-1, keepdim=True)

        return normalized_features

    except Exception as e:
        # Fang opp alt (fil finnes ikke, korrupt bilde, osv.) og returner None
        print(f"Feil ved bildeanalyse: {e}")
        return None

if __name__ == "__main__":
    # Enkel manuell test: bytt til en gyldig bildebane på din maskin
    image_path = "C:/Users/marcu/React-prosjekt/backend/test_image.jpg"
    features = analyze_image(image_path)

    if features is not None:
        print("Bildeanalyse fullført.")
        print("Funksjoner (vektor):", features)  # tensor med shape (1, D)
    else:
        print("Bildeanalyse mislyktes.")
