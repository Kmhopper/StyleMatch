import React, { useState } from "react";
import "./HamburgerMenu.css";
import { useNavigate } from "react-router-dom";

/**
 * HamburgerMenu
 * Viser en “skuff”-meny med kategorier. Menyen åpnes/lukkes lokalt i komponenten.
 *
 * Props:
 *  - categories: string[]  (listen som rendres som menyvalg)
 */
const HamburgerMenu = ({ categories }) => {
  // Lokal UI-state: om menyen er åpen/lukket
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Hook fra react-router for programmatisk navigering
  const navigate = useNavigate();

  // Bytter mellom åpen/lukket meny
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Lukker menyen (brukes når man klikker utenfor menyen eller etter navigasjon)
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Trigger-knappen (hamburger-ikonet) som åpner/lukker menyen */}
      <button className="hamburger-button" onClick={toggleMenu}>
        ☰
      </button>

      {/* Mørk overlay bak menyen. Klikk her => lukk menyen */}
      <div
        className={`overlay ${isMenuOpen ? "active" : ""}`}
        onClick={closeMenu}
      ></div>

      {/* Selve meny-skuffen. Klassen 'active' styrer visningen via CSS */}
      <div className={`hamburger-menu ${isMenuOpen ? "active" : ""}`}>
        <h2>Kategorier</h2>

        {/* Map over kategorier-propen og lag én <li> per kategori */}
        <ul>
          {categories.map((category) => (
            <li
              key={category}
              onClick={() => {
                // Ved klikk: naviger til kategori-ruten...
                navigate(`/category/${category}`);
                // ...og lukk menyen etterpå
                closeMenu();
              }}
            >
              {category}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default HamburgerMenu;
