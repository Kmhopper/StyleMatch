import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import HamburgerMenu from "../components/HamburgerMenu";
import "./CategoryPage.css";

const INITIAL_VISIBLE_PRODUCTS = 24;
const LOAD_MORE_STEP = 24;

const STORE_LABELS = {
  hm_products: "H&M",
  weekday_products: "Weekday",
  zara_products: "Zara",
  follestad_products: "Follestad",
};

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") {
    return "Pris mangler";
  }

  const rawPrice = String(price).trim();
  if (/nok|kr/i.test(rawPrice)) {
    return rawPrice;
  }

  const normalized = rawPrice.replace(",", ".");
  const asNumber = Number.parseFloat(normalized);

  if (Number.isFinite(asNumber)) {
    return `${Math.round(asNumber)} NOK`;
  }

  return rawPrice;
};

const CategoryPage = ({ selectedStores, categories }) => {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PRODUCTS);
  const queryCacheRef = useRef(new Map());

  const activeStoreNames = useMemo(
    () => selectedStores.map((store) => STORE_LABELS[store] ?? store),
    [selectedStores]
  );

  const visibleProducts = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount]
  );

  useEffect(() => {
    let cancelled = false;
    const storesSnapshot = [...selectedStores];
    const cacheKey = `${categoryName}::${[...storesSnapshot].sort().join(",")}`;

    const fetchProducts = async () => {
      if (storesSnapshot.length === 0) {
        setProducts([]);
        setFetchError("");
        setLoading(false);
        return;
      }

      const cachedProducts = queryCacheRef.current.get(cacheKey);
      if (cachedProducts) {
        setProducts(cachedProducts);
        setFetchError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setFetchError("");

      try {
        const responses = await Promise.all(
          storesSnapshot.map((store) =>
            axios.get("http://localhost:3001/products", {
              params: { tables: store, category: categoryName },
            })
          )
        );

        const merged = responses.flatMap((response, index) => {
          const source = storesSnapshot[index];
          return response.data
            .filter((item) => item.image_url && item.name && item.price && item.image_url.trim() !== "")
            .map((item) => ({
              ...item,
              __source: source,
              __key: `${source}_${item.id ?? item.product_link ?? item.image_url}`,
            }));
        });

        if (!cancelled) {
          queryCacheRef.current.set(cacheKey, merged);

          // Keep cache bounded to avoid uncontrolled memory growth.
          if (queryCacheRef.current.size > 40) {
            const oldestKey = queryCacheRef.current.keys().next().value;
            queryCacheRef.current.delete(oldestKey);
          }

          setProducts(merged);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Feil ved henting av produkter:", error);
          setProducts([]);
          setFetchError("Vi fikk ikke hentet produkter akkurat nå. Prøv igjen.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [categoryName, selectedStores]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
  }, [categoryName, selectedStores, products.length]);

  const openProduct = (product) => {
    if (!product.product_link) {
      return;
    }

    window.open(product.product_link, "_blank", "noopener,noreferrer");
  };

  const handleProductKeyDown = (event, product) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProduct(product);
    }
  };

  return (
    <div className="category-page">
      <HamburgerMenu categories={categories} />

      <section className="category-hero">
        <p className="category-hero__eyebrow">Live katalog på tvers av butikker</p>
        <div className="category-hero__title-row">
          <h1>{categoryName}</h1>
          <span className="category-hero__count">
            {loading ? "Laster..." : `${products.length} produkter`}
          </span>
        </div>
        <p className="category-hero__subtext">
          Velg butikker i filteret over. Resultatene oppdateres automatisk.
        </p>
        <div className="category-hero__stores">
          {activeStoreNames.length > 0 ? (
            activeStoreNames.map((store) => (
              <span key={store} className="store-pill">
                {store}
              </span>
            ))
          ) : (
            <span className="store-pill store-pill--empty">Ingen butikker valgt</span>
          )}
        </div>
      </section>

      {selectedStores.length === 0 && (
        <section className="category-message">
          <h2>Velg minst en butikk</h2>
          <p>
            Kryss av butikkene i topplinjen for å vise produkter i denne kategorien.
          </p>
        </section>
      )}

      {selectedStores.length > 0 && loading && (
        <section className="product-grid">
          {Array.from({ length: 9 }).map((_, index) => (
            <article key={index} className="product-skeleton" aria-hidden="true" />
          ))}
        </section>
      )}

      {selectedStores.length > 0 && !loading && fetchError && (
        <section className="category-message">
          <h2>Noe gikk galt</h2>
          <p>{fetchError}</p>
        </section>
      )}

      {selectedStores.length > 0 && !loading && !fetchError && products.length === 0 && (
        <section className="category-message">
          <h2>Ingen produkter funnet</h2>
          <p>Prøv en annen kombinasjon av butikker eller bytt kategori.</p>
        </section>
      )}

      {selectedStores.length > 0 && !loading && products.length > 0 && (
        <>
          <section className="product-grid">
            {visibleProducts.map((product) => (
              <article
                key={product.__key}
                className={`product-tile ${product.product_link ? "is-clickable" : ""}`}
                onClick={() => openProduct(product)}
                onKeyDown={(event) => handleProductKeyDown(event, product)}
                tabIndex={product.product_link ? 0 : -1}
              >
                <div className="product-tile__media">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="product-tile__missing">Bilde mangler</div>
                  )}
                  <span className="product-tile__store">
                    {STORE_LABELS[product.__source] ?? product.__source}
                  </span>
                </div>
                <div className="product-tile__body">
                  <h3>{product.name}</h3>
                  <div className="product-tile__meta">
                    <p>{formatPrice(product.price)}</p>
                    <span>{product.product_link ? "Shop now" : "Ingen lenke"}</span>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {products.length > visibleCount && (
            <div className="load-more">
              <p>
                Viser {visibleProducts.length} av {products.length} produkter
              </p>
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((current) =>
                    Math.min(current + LOAD_MORE_STEP, products.length)
                  )
                }
              >
                Vis flere produkter
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CategoryPage;
