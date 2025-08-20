import React, { useState } from "react";
import "./HamburgerMenu.css";
import { useNavigate } from "react-router-dom";

const HamburgerMenu = ({ categories }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <>
            <button className="hamburger-button" onClick={toggleMenu}>
                ☰
            </button>
            <div className={`overlay ${isMenuOpen ? "active" : ""}`} onClick={closeMenu}></div>
            <div className={`hamburger-menu ${isMenuOpen ? "active" : ""}`}>
                <h2>Kategorier</h2>
                <ul>
                    {categories.map((category) => (
                        <li
                            key={category}
                            onClick={() => {
                                navigate(`/category/${category}`);
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
