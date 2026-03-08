import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ImageSearch.css";

const ImageSearch = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const updateFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }
    setSelectedFile(file);
    setError("");
  };

  const handleFileChange = (event) => {
    updateFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    updateFile(event.dataTransfer.files?.[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError("Last opp et bilde før du starter søket.");
      return;
    }

    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await axios.post("http://localhost:3001/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (Array.isArray(response.data)) {
        setResults(response.data);
      } else {
        setResults([]);
        setError("Ugyldig respons fra serveren.");
      }
    } catch (requestError) {
      console.error("Feil ved opplastning:", requestError.response?.data || requestError.message);
      setResults([]);
      setError("Noe gikk galt under analysen. Prøv igjen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-search">
      <section className="image-search__hero">
        <p className="image-search__eyebrow">Visual product matching</p>
        <h1>Finn lignende produkter med ett bilde</h1>
        <p>
          Last opp et bilde av plagget du liker, så finner vi produkter med samme uttrykk på tvers av butikkene.
        </p>
      </section>

      <section className="image-search__layout">
        <form className="upload-panel" onSubmit={handleSubmit}>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="upload-panel__input"
          />

          <label
            htmlFor="image-upload"
            className={`upload-dropzone ${isDragging ? "is-dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Valgt plagg"
                className="upload-dropzone__preview"
                decoding="async"
              />
            ) : (
              <>
                <span className="upload-dropzone__title">Dra et bilde hit</span>
                <span className="upload-dropzone__subtitle">eller klikk for å velge fil</span>
              </>
            )}
          </label>

          <div className="upload-panel__actions">
            <button type="submit" disabled={loading} className="upload-btn upload-btn--primary">
              {loading ? "Analyserer..." : "Start søk"}
            </button>
            <button
              type="button"
              className="upload-btn upload-btn--ghost"
              onClick={() => {
                setSelectedFile(null);
                setResults([]);
                setError("");
              }}
              disabled={loading}
            >
              Nullstill
            </button>
          </div>

          {selectedFile && (
            <p className="upload-panel__filename">
              Valgt fil: <strong>{selectedFile.name}</strong>
            </p>
          )}

          {error && <p className="upload-panel__error">{error}</p>}
        </form>

        <aside className="image-search__tips">
          <h2>Tips for bedre treff</h2>
          <ul>
            <li>Bruk et klart bilde med ett hovedplagg.</li>
            <li>Unngå tung bakgrunn og flere personer i samme bilde.</li>
            <li>Resultatene blir bedre når plagget er godt synlig.</li>
          </ul>
        </aside>
      </section>

      <section className="search-results">
        <div className="search-results__head">
          <h2>Treff</h2>
          <span>{results.length} produkter</span>
        </div>

        {loading && <p className="search-results__status">Laster opp og analyserer bildet...</p>}

        {!loading && results.length === 0 && !error && (
          <p className="search-results__status">Ingen resultater enda. Last opp et bilde for å starte.</p>
        )}

        {results.length > 0 && (
          <div className="search-results__grid">
            {results.map((result, index) => {
              const similarity = Number.parseFloat(result.similarity);
              const similarityLabel = Number.isFinite(similarity)
                ? `${Math.round(similarity * 100)}% match`
                : "Likhet ukjent";

              return (
                <article
                  key={`${result.product_link ?? result.image_url}_${index}`}
                  className={`search-card ${result.product_link ? "is-clickable" : ""}`}
                  onClick={() =>
                    result.product_link &&
                    window.open(result.product_link, "_blank", "noopener,noreferrer")
                  }
                  role={result.product_link ? "link" : undefined}
                  tabIndex={result.product_link ? 0 : -1}
                  onKeyDown={(event) => {
                    if (!result.product_link) {
                      return;
                    }
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      window.open(result.product_link, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  <div className="search-card__media">
                    <img
                      src={result.image_url}
                      alt={result.name}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="search-card__similarity">{similarityLabel}</span>
                  </div>
                  <div className="search-card__body">
                    <h3>{result.name}</h3>
                    <p>{result.price} NOK</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ImageSearch;
