import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ImageSearch from './components/ImageSearch';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import './App.css';

const App = () => {
    const [selectedStores, setSelectedStores] = useState([]);


    const categories = [
        'T-skjorte',
        'Genser',
        'Hoodie',
        'Skjorte',
        'Bukse',
        'Jeans',
        'Shorts',
        'Blazer',
        'Jakke',
    ];

    return (
        <Router>
            <div className="app-container">
                <Header onFilterChange={setSelectedStores} />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route
                        path="/category/:categoryName"
                        element={
                            <CategoryPage 
                                selectedStores={selectedStores} 
                                categories={categories}
                            />
                        }
                    />
                    <Route path="/find-similar" element={<ImageSearch />} /> {/* Ny rute */}
                    <Route path="*" element={<h1>404: Siden ble ikke funnet</h1>} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
