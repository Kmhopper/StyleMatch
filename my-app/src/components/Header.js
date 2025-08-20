import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../App.css';

const Header = ({ onFilterChange }) => {
    const [selectedStores, setSelectedStores] = useState([]);
    const location = useLocation(); // For å sjekke hvilken side vi er på

    const handleCheckboxChange = (event) => {
        const { id, checked } = event.target;
        let updatedStores = [...selectedStores];

        if (checked) {
            updatedStores.push(id); // Legg til den valgte butikken
        } else {
            updatedStores = updatedStores.filter(store => store !== id); // Fjern den valgte butikken
        }

        setSelectedStores(updatedStores);
        onFilterChange(updatedStores); // Send oppdaterte butikker til forelderen
    };

    return (
        <header className="py-3 mb-4">
            <div className="container d-flex justify-content-between align-items-center ">
            <Link to="/" style={{ marginRight: 'auto' }}>
                <img
                    src={require('../images/fittedlogo.png')}
                    alt="Home"
                    style={{
                        width: '150px', // Øk bredden
                        height: '100px', // Tilpass høyden automatisk
                        
                      }}
                    
                />
            </Link>
                {/* Overskriften */}
                <h1 className="text-center">
                    Velkommen til din stil!
                </h1>

                {/* Vis butikk-knapper og Finn lignende produkter på de riktige sidene */}
                {(location.pathname !== '/') && (
                    <div className="btn-group" role="group" aria-label="Butikker">
                        <input
                            type="checkbox"
                            className="btn-check"
                            id="hm_products"
                            autoComplete="off"
                            onChange={handleCheckboxChange}
                        />
                        <label className="btn btn-secondary" htmlFor="hm_products">H&M</label>

                        <input
                            type="checkbox"
                            className="btn-check"
                            id="weekday_products"
                            autoComplete="off"
                            onChange={handleCheckboxChange}
                        />
                        <label className="btn btn-secondary" htmlFor="weekday_products">Weekday</label>

                        <input
                            type="checkbox"
                            className="btn-check"
                            id="zara_products"
                            autoComplete="off"
                            onChange={handleCheckboxChange}
                        />
                        <label className="btn btn-secondary" htmlFor="zara_products">Zara</label>

                        <input
                            type="checkbox"
                            className="btn-check"
                            id="follestad_products"
                            autoComplete="off"
                            onChange={handleCheckboxChange}
                        />
                        <label className="btn btn-secondary" htmlFor="follestad_products">Follestad</label>
                    </div>
                )}

                {/* "Finn lignende produkter" knappen vises på hjemmesiden */}
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
