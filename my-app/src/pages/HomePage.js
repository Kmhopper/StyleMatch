import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

// IMPORTER BILDER FRA src/images (endre navn om dine filer heter noe annet)
import tshirtImg from "../images/tshirt_png.png";
import genserImg from "../images/sweater_png2.png";
import hoodieImg from "../images/hoodie_png.png";
import skjorteImg from "../images/shirt_png.png";
import bukseImg from "../images/pants_png.png";
import jeansImg from "../images/jeans_png.png";
import shortsImg from "../images/shorts_png.png";
import blazerImg from "../images/blazer_png.png";
import jakkeImg from "../images/jacket_png.png";

const HomePage = () => {
  const navigate = useNavigate();
  const categoriesRef = useRef(null); // <-- for smooth scroll

  // Bruk "pos" kun til background-position (ikke 'cover/contain')
  const categories = [
    { name: "T-skjorte", slug: "t-skjorte", image: tshirtImg, pos: "center 35%" },
    { name: "Genser",   slug: "genser",   image: genserImg,   pos: "center 40%" },
    { name: "Hoodie",   slug: "hoodie",   image: hoodieImg,   pos: "center 28%" },
    { name: "Skjorte",  slug: "skjorte",  image: skjorteImg,  pos: "center" },
    { name: "Bukse",    slug: "bukse",    image: bukseImg,    pos: "center bottom" },
    { name: "Jeans",    slug: "jeans",    image: jeansImg,    pos: "center bottom" },
    { name: "Shorts",   slug: "shorts",   image: shortsImg,   pos: "center 45%" },
    { name: "Blazer",   slug: "blazer",   image: blazerImg,   pos: "center 45%" },
    { name: "Jakke",    slug: "jakke",    image: jakkeImg,    pos: "center 40%" },
  ];

  return (
    <main className="homepage">
      {/* HERO */}
      <section className="hero">
        <h1 className="hero__title">Velkommen til din stil</h1>
        <p className="hero__subtitle">
          Utforsk kategorier eller bruk bildesøk for å finne akkurat det du leter etter.
        </p>
        <div className="hero__actions">
          <button
            className="btn btn--primary"
            onClick={() => navigate("/find-similar")}
          >
            Finn lignende produkter
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => categoriesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            Se alle kategorier
          </button>
        </div>
      </section>

      {/* KATEGORIER */}
      <section className="section" ref={categoriesRef}>
        <div className="section__header">
          <h2 className="section__title">Kategorier</h2>
        </div>

        <div className="category-grid">
          {categories.map((c) => (
            <article
              key={c.slug}
              className="category-card"
              onClick={() => navigate(`/category/${c.name}`)}
            >
              <div
                className="category-card__media"
                style={{
                  backgroundImage: `url(${c.image})`,
                  backgroundPosition: c.pos || "center",
                }}
                aria-hidden="true"
              />
              <div className="category-card__overlay" />
              <h3 className="category-card__title">{c.name}</h3>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default HomePage;
