import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./HamburgerMenu.css";

const HamburgerMenu = ({ categories }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { categoryName } = useParams();

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={`drawer-toggle ${isMenuOpen ? "is-open" : ""}`}
        onClick={() => setIsMenuOpen((open) => !open)}
        aria-label="Vis kategorier"
        aria-expanded={isMenuOpen}
      >
        <span />
        <span />
        <span />
      </button>

      <div
        className={`drawer-overlay ${isMenuOpen ? "is-active" : ""}`}
        onClick={closeMenu}
        aria-hidden={!isMenuOpen}
      />

      <aside className={`drawer ${isMenuOpen ? "is-active" : ""}`} aria-hidden={!isMenuOpen}>
        <div className="drawer__head">
          <p>Kategorier</p>
          <button type="button" onClick={closeMenu} aria-label="Lukk meny">
            x
          </button>
        </div>

        <div className="drawer__list">
          {categories.map((category) => {
            const isActive = category === categoryName;

            return (
              <button
                key={category}
                type="button"
                className={`drawer__item ${isActive ? "is-active" : ""}`}
                onClick={() => {
                  navigate(`/category/${category}`);
                  closeMenu();
                }}
              >
                {category}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default HamburgerMenu;
