import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";

const STORE_OPTIONS = [
  { id: "hm_products", label: "H&M" },
  { id: "weekday_products", label: "Weekday" },
  { id: "zara_products", label: "Zara" },
  { id: "follestad_products", label: "Follestad" },
];

const Header = ({ onFilterChange }) => {
  const [selectedStores, setSelectedStores] = useState([]);
  const location = useLocation();
  const isCategoryPage = location.pathname.startsWith("/category/");

  const handleCheckboxChange = (event) => {
    const { id, checked } = event.target;
    let updatedStores = [...selectedStores];

    if (checked) {
      updatedStores.push(id);
    } else {
      updatedStores = updatedStores.filter((store) => store !== id);
    }

    setSelectedStores(updatedStores);
    onFilterChange(updatedStores);
  };

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <Link to="/" className="brand">
          <img
            src={require("../images/fittedlogo.png")}
            alt="Nordic Thread"
            className="brand__logo"
          />
          <div className="brand__copy">
            <p className="brand__title">NORDIC THREAD</p>
            <p className="brand__subtitle">One cart, many stores</p>
          </div>
        </Link>

        <nav className="topbar__nav" aria-label="Hovednavigasjon">
          <span className="topbar__drop">Spring Drop 26</span>
          <Link
            to="/"
            className={`topbar__link ${location.pathname === "/" ? "is-active" : ""}`}
          >
            Forside
          </Link>
          <Link
            to="/find-similar"
            className={`topbar__link ${location.pathname === "/find-similar" ? "is-active" : ""}`}
          >
            Bilde-søk
          </Link>
        </nav>
      </div>

      {isCategoryPage && (
        <div className="store-filter" aria-label="Butikkfilter">
          <p className="store-filter__title">Velg butikker</p>
          <div className="store-filter__chips">
            {STORE_OPTIONS.map((store) => {
              const isChecked = selectedStores.includes(store.id);

              return (
                <label
                  key={store.id}
                  htmlFor={store.id}
                  className={`store-chip ${isChecked ? "is-active" : ""}`}
                >
                  <input
                    id={store.id}
                    type="checkbox"
                    checked={isChecked}
                    onChange={handleCheckboxChange}
                  />
                  <span>{store.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
