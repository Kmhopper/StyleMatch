import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

/**
 * ImageSearch
 * Lar brukeren laste opp et bilde → sender til backend /analyze → viser topp-matchene.
 * Forventet backend-respons: Array av produkter [{ name, price, image_url, product_link, similarity }, ...]
 */
const ImageSearch = () => {
  // Lokal UI-state for skjemaet og resultatvisning
  const [selectedFile, setSelectedFile] = useState(null);  // filen brukeren velger
  const [results, setResults] = useState([]);              // søkeresultat fra backend
  const [loading, setLoading] = useState(false);           // spinner/ventestatus
  const [error, setError] = useState(null);                // feilmelding i UI

  const navigate = useNavigate(); // (ikke brukt i dag, men OK å ha hvis du vil route videre senere)

  // Når brukeren velger fil i <input type="file">
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  /**
   * Sender valgt bilde til backend som multipart/form-data.
   * Viser loading, håndterer feil, og lagrer resultatlisten ved suksess.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();              // ikke last inn siden på form-submit

    if (!selectedFile) {
      alert('Vennligst last opp et bilde.');
      return;
    }

    setLoading(true);
    setError(null);

    // Pakk filen inn i FormData slik backend kan lese den som "image"
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      console.log("Sender forespørsel til backend...");
      const response = await axios.post('http://localhost:3001/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log("Respons fra backend:", response.data);

      // Forvent at backend returnerer en array av produkter
      if (response.data && Array.isArray(response.data)) {
        setResults(response.data);
      } else {
        setError('Ugyldig respons fra serveren.');
        console.error('Ugyldig respons fra backend:', response.data);
      }
    } catch (error) {
      // Viser kort feilmelding til bruker; logger mer detaljert i konsoll
      console.error('Feil ved opplastning:', error.response?.data || error.message);
      setError('Noe gikk galt. Prøv igjen senere.');
    } finally {
      setLoading(false); // skru av spinner uansett utfall
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center">Finn lignende produkter</h2>

      {/* Skjema for å velge og sende inn bilde */}
      <form onSubmit={handleSubmit} className="text-center">
        <input
          type="file"
          accept="image/*"                // kun bilder
          onChange={handleFileChange}
          className="form-control-file mt-3"
        />
        <button type="submit" className="btn btn-primary mt-3">
          Søk
        </button>
      </form>

      {/* Tilbakemeldinger til bruker under/etter kall */}
      {loading && <p className="text-center">Laster opp og analyserer bilde...</p>}
      {error && <p className="text-danger text-center">{error}</p>}

      {/* Resultatgrid: klikker du på et kort åpnes produktsiden i ny fane */}
      <div className="row mt-4">
        {results.length > 0 ? (
          results.map((result, index) => (
            <div
              key={index}
              className="col-md-4 col-sm-6 mb-4"
              onClick={() => {
                if (result.product_link) {
                  window.open(result.product_link, '_blank'); // åpne i ny fane
                } else {
                  alert('Ingen lenke tilgjengelig for dette produktet.');
                }
              }}
            >
              <div className="product-card">
                <img
                  src={result.image_url}
                  alt={result.name}
                  className="card-img-top"
                />
                <div className="card-body">
                  <h5 className="card-title">{result.name}</h5>
                  <p className="card-text">Pris: {result.price} NOK</p>
                  {/* Likhet → prosent (cosine similarity * 100, avrundet) */}
                  <p className="card-text">
                    Likhet: {Math.round(result.similarity * 100)}%
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          // Tomtilstand: vis kun hvis vi ikke laster og ikke har feil
          !loading &&
          !error &&
          <p className="text-center">Ingen resultater å vise.</p>
        )}
      </div>
    </div>
  );
};

export default ImageSearch;
