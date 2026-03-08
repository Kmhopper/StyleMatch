import React, { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { categoryCatalog } from "../data/categories";
import "./HomePage.css";

const HERO_STATS = [
  { label: "Butikker", value: "4+" },
  { label: "Kategorier", value: "9" },
  { label: "Nye produkter", value: "Hver dag" },
];

const TICKER_ITEMS = [
  "SCAN OUTFIT",
  "MATCH PRODUKTER",
  "SHOP PÅ TVERS",
  "CURATED LOOKS",
  "FIND YOUR STYLE",
];

const FLOW_STEPS = [
  {
    title: "Velg en kategori",
    text: "Gå rett inn i blazer, jeans, jakker eller favorittplagget ditt.",
  },
  {
    title: "Skru på butikker",
    text: "Sammenlign utvalg og pris på sekunder i samme visning.",
  },
  {
    title: "Bruk bilde-søk",
    text: "Last opp inspirasjon og få produkter med lignende uttrykk.",
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const categoriesRef = useRef(null);

  const heroFocus = useMemo(
    () => categoryCatalog.find((category) => category.slug === "blazer") ?? categoryCatalog[0],
    []
  );

  const heroSecondary = useMemo(
    () => [
      categoryCatalog.find((category) => category.slug === "jakke") ?? categoryCatalog[1],
      categoryCatalog.find((category) => category.slug === "jeans") ?? categoryCatalog[2],
      categoryCatalog.find((category) => category.slug === "hoodie") ?? categoryCatalog[3],
    ],
    []
  );

  return (
    <main className="home">
      <section className="home-marquee" aria-hidden="true">
        <div className="home-marquee__track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => (
            <span key={`${item}-${index}`}>
              {item}
              <i />
            </span>
          ))}
        </div>
      </section>

      <section className="home-hero">
        <div className="home-hero__content">
          <p className="home-hero__eyebrow">Shop på tvers av butikker</p>
          <h1 className="home-hero__title">Finn klær raskere</h1>
          <p className="home-hero__lead">
            Sammenlign produkter fra flere butikker og bruk bilde-søk for å finne lignende plagg.
          </p>

          <div className="home-hero__actions">
            <button
              type="button"
              className="home-btn home-btn--primary"
              onClick={() => navigate("/find-similar")}
            >
              Start bilde-søk
            </button>
            <button
              type="button"
              className="home-btn home-btn--ghost"
              onClick={() =>
                categoriesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              Se kategorier
            </button>
          </div>

          <div className="home-hero__stats">
            {HERO_STATS.map((item) => (
              <article key={item.label} className="hero-stat">
                <p>{item.value}</p>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </div>

        <aside className="home-showcase" aria-label="Featured looks">
          <article className="showcase-card showcase-card--main">
            <img
              className="showcase-card__image"
              src={heroFocus.image}
              alt={heroFocus.name}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              style={{ objectPosition: heroFocus.position }}
            />
            <div className="showcase-card__body">
              <p>Trending now</p>
              <h2>{heroFocus.name}</h2>
              <button type="button" onClick={() => navigate(`/category/${heroFocus.name}`)}>
                Shop collection
              </button>
            </div>
          </article>

          <div className="showcase-card__stack">
            {heroSecondary.map((item, index) => (
              <article key={item.slug} className={`showcase-mini showcase-mini--${index + 1}`}>
                <img
                  className="showcase-mini__media"
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: item.position }}
                />
                <p>{item.name}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="home-flow">
        {FLOW_STEPS.map((step, index) => (
          <article key={step.title} className="flow-card">
            <span>{`0${index + 1}`}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </section>

      <section className="home-categories" ref={categoriesRef}>
        <div className="home-categories__head">
          <p>Category universe</p>
          <h2>Bygget som en levende lookbook</h2>
        </div>

        <div className="home-category-grid">
          {categoryCatalog.map((category, index) => (
            <article
              key={category.slug}
              className={`home-category-card home-category-card--${(index % 5) + 1}`}
              onClick={() => navigate(`/category/${category.name}`)}
            >
              <img
                className="home-category-card__media"
                src={category.image}
                alt={category.name}
                loading={index < 3 ? "eager" : "lazy"}
                decoding="async"
                style={{ objectPosition: category.position }}
              />
              <div className="home-category-card__veil" />
              <div className="home-category-card__content">
                <p>{category.tagline}</p>
                <h3>{category.name}</h3>
                <span>Open category</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default HomePage;
