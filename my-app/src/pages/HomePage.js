import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./HomePage.css"

const HomePage = () => {
    const categories = [
        { name: 'T-skjorte' },
        { name: 'Genser' },
        { name: 'Hoodie' },
        { name: 'Skjorte' },
        { name: 'Bukse' },
        { name: 'Jeans' },
        { name: 'Shorts' },
        { name: 'Blazer' },
        { name: 'Jakke' },
    ];

    const navigate = useNavigate();

    return (
    
        <div className="homepage">
            <h1>Utforsk våre kategorier eller bruk bildesøk for å finne akkurat det du leter etter!</h1>
            {categories.map((category, index) => (
                <div 
                    key={index} 
                    className="category-card" 
                    onClick={() => navigate(`/category/${category.name}`)}
                >
                    <h2 className="category-title">{category.name}</h2>
                </div>
            ))}
        </div>
    );
};

export default HomePage;
