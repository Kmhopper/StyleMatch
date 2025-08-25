import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../App.css';

/**
 * Header
 * Toppseksjon som:
 *  - viser logo og tittel
 *  - på forsiden ("/"): viser knapp til "Finn lignende produkter"
 *  - på andre sider: viser butikk-filtre (checkboxer) og sender valgene opp via onFilterChange
 *
 * Props:
 *  - onFilterChange: (selectedStores: string[]) => void
 */
const Header = ({ onFilterChange }) => {
  // Hvilke butikker brukeren har valgt i filteret (lokal UI-state)
  const [selectedStores, setSelectedStores] = useState([]);

  // Brukes for å vite hvor i appen vi er (for betinget rendering)
  const location = useLocation();

  /**
   * Håndterer klikk på en butikkscheckbox:
   *  - legger til/fjerner id i selectedStores
   *  - varsler forelderen via onFilterChange
   */
  const handleCheckboxChange = (event) => {
    const { id, checked } = event.target;

    // Kopi av nåværende utvalg (unngå å mutere eksisterende state)
    let updatedStores = [...selectedStores];

    if (checked) {
      updatedStores.push(id);                // legg til valgt butikk
    } else {
      updatedStores = updatedStores.filter(  // fjern valgt butikk
        (store) => store !== id
      );
    }

    setSelectedStores(updatedStores);        // oppdater lokal state
    onFilterChange(updatedStores);           // send opp til forelderen (CategoryPage o.l.)
  };

  return (
    <header className="py-3 mb-4">
      <div className="container d-flex justify-content-between align-items-center ">
        {/* Logo som lenker hjem */}
        <Link to="/" style={{ marginRight: 'auto' }}>
          <img
            src={require('../images/fittedlogo.png')}
            alt="Home"
            style={{
              width: '150px',
              height: '100px',
            }}
          />
        </Link>

        {/* Sentrert overskrift */}
        <h1 className="text-center">Velkommen til din stil!</h1>

        {/* På alle sider UNNTATT forsiden: vis butikk-filtre */}
        {location.pathname !== '/' && (
          <div className="btn-group" role="group" aria-label="Butikker">
            {/* H&M */}
            <input
              type="checkbox"
              className="btn-check"
              id="hm_products"
              autoComplete="off"
              onChange={handleCheckboxChange}
            />
            <label className="btn btn-secondary" htmlFor="hm_products">
              H&M
            </label>

            {/* Weekday */}
            <input
              type="checkbox"
              className="btn-check"
              id="weekday_products"
              autoComplete="off"
              onChange={handleCheckboxChange}
            />
            <label className="btn btn-secondary" htmlFor="weekday_products">
              Weekday
            </label>

            {/* Zara */}
            <input
              type="checkbox"
              className="btn-check"
              id="zara_products"
              autoComplete="off"
              onChange={handleCheckboxChange}
            />
            <label className="btn btn-secondary" htmlFor="zara_products">
              Zara
            </label>

            {/* Follestad */}
            <input
              type="checkbox"
              className="btn-check"
              id="follestad_products"
              autoComplete="off"
              onChange={handleCheckboxChange}
            />
            <label className="btn btn-secondary" htmlFor="follestad_products">
              Follestad
            </label>
          </div>
        )}

        {/* Kun på forsiden: knapp som ruter til "Finn lignende produkter"-siden */}
        {location.pathname === '/' && (
          <Link to="/find-similar" className="btn btn-outline-dark">
            Finn lignende produkter
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
