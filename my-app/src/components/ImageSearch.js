import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const ImageSearch = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
    
        if (!selectedFile) {
            alert('Vennligst last opp et bilde.');
            return;
        }
    
        setLoading(true);
        setError(null);
    
        const formData = new FormData();
        formData.append('image', selectedFile);
    
        try {
            console.log("Sender forespørsel til backend...");
            const response = await axios.post('http://localhost:3001/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            console.log("Respons fra backend:", response.data);
    
            if (response.data && Array.isArray(response.data)) {
                setResults(response.data);
            } else {
                setError('Ugyldig respons fra serveren.');
                console.error('Ugyldig respons fra backend:', response.data);
            }
        } catch (error) {
            console.error('Feil ved opplastning:', error.response?.data || error.message);
            setError('Noe gikk galt. Prøv igjen senere.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center">Finn lignende produkter</h2>
            <form onSubmit={handleSubmit} className="text-center">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="form-control-file mt-3"
                />
                <button type="submit" className="btn btn-primary mt-3">
                    Søk
                </button>
            </form>
            {loading && <p className="text-center">Laster opp og analyserer bilde...</p>}
            {error && <p className="text-danger text-center">{error}</p>}
            <div className="row mt-4">
                {results.length > 0 ? (
                    results.map((result, index) => (
                        <div
                            key={index}
                            className="col-md-4 col-sm-6 mb-4"
                            onClick={() => {
                                if (result.product_link) {
                                    window.open(result.product_link, '_blank'); // Åpne lenken i en ny fane
                                } else {
                                    alert('Ingen lenke tilgjengelig for dette produktet.');
                                }
                            }}
                        >
                            <div className="product-card">
                                <img
                                    src={result.image_url}
                                    alt={result.name}
                                    className="card-img-top"
                                />
                                <div className="card-body">
                                    <h5 className="card-title">{result.name}</h5>
                                    <p className="card-text">Pris: {result.price} NOK</p>
                                    <p className="card-text">
                                        Likhet: {Math.round(result.similarity * 100)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    !loading &&
                    !error &&
                    <p className="text-center">Ingen resultater å vise.</p>
                )}
            </div>
        </div>
    );
};

export default ImageSearch;
