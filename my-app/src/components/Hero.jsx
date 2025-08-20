import React from 'react';
import './Hero.css'; // For stilene til Hero-seksjonen

const Hero = ({ title, subtitle, buttonText, onButtonClick }) => {
    return (
        <div className="hero-section">
            <div className="hero-overlay">
                <div className="hero-content">
                    <h1 className="hero-title">{title}</h1>
                    <p className="hero-subtitle">{subtitle}</p>
                    <button className="hero-button" onClick={onButtonClick}>
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Hero;
