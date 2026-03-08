import tshirtImg from "../images/categories-pack/t-skjorte.webp";
import genserImg from "../images/categories-pack/genser.webp";
import hoodieImg from "../images/categories-pack/hoodie.webp";
import skjorteImg from "../images/categories-pack/skjorte.webp";
import bukseImg from "../images/categories-pack/bukse.webp";
import jeansImg from "../images/categories-pack/jeans.webp";
import shortsImg from "../images/categories-pack/shorts.webp";
import blazerImg from "../images/categories-pack/blazer.webp";
import jakkeImg from "../images/categories-pack/jakke.webp";

export const categoryCatalog = [
  {
    name: "T-skjorte",
    slug: "t-skjorte",
    image: tshirtImg,
    position: "center",
    tagline: "Everyday essentials",
  },
  {
    name: "Genser",
    slug: "genser",
    image: genserImg,
    position: "center",
    tagline: "Soft layering",
  },
  {
    name: "Hoodie",
    slug: "hoodie",
    image: hoodieImg,
    position: "center",
    tagline: "Relaxed fit",
  },
  {
    name: "Skjorte",
    slug: "skjorte",
    image: skjorteImg,
    position: "center",
    tagline: "Clean tailoring",
  },
  {
    name: "Bukse",
    slug: "bukse",
    image: bukseImg,
    position: "center",
    tagline: "Smart comfort",
  },
  {
    name: "Jeans",
    slug: "jeans",
    image: jeansImg,
    position: "center",
    tagline: "Denim rotation",
  },
  {
    name: "Shorts",
    slug: "shorts",
    image: shortsImg,
    position: "center",
    tagline: "Warm weather",
  },
  {
    name: "Blazer",
    slug: "blazer",
    image: blazerImg,
    position: "center",
    tagline: "Elevated looks",
  },
  {
    name: "Jakke",
    slug: "jakke",
    image: jakkeImg,
    position: "center",
    tagline: "Outerwear edit",
  },
];

export const categoryNames = categoryCatalog.map((category) => category.name);
