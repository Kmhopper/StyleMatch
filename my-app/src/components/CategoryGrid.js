import React from 'react';
import { Link } from 'react-router-dom';

const CategoryGrid = ({ categories }) => {
    return (
        <div className="container">
            <div className="row">
                {categories.map((category) => (
                    <div key={category.name} className="col-md-4 col-sm-6 mb-4">
                        <Link to={`/category/${category.name}`} className="text-decoration-none">
                            <div
                                className="card h-100"
                                style={{
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                                    borderRadius: '10px',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0px 8px 12px rgba(0, 0, 0, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';
                                }}
                            >
                                <div
                                    style={{
                                        height: '200px', // Setter fast høyde på kortet
                                        width: '100%', // Full bredde
                                        overflow: 'hidden', // Skjuler overflødig innhold
                                        display: 'flex', // Sørger for å midtstille innhold
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <img
                                        src={category.image}
                                        alt={category.name}
                                        style={{
                                            height: '100%', // Sørger for at høyden alltid fyller containeren
                                            width: 'auto', // Bevarer proporsjonene
                                            objectFit: 'cover', // Sørger for at bildet fyller kortet
                                        }}
                                    />
                                </div>
                                <div className="card-body text-center">
                                    <h5 className="card-title">{category.name}</h5>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryGrid;
