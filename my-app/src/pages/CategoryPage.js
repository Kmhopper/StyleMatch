import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';
import HamburgerMenu from '../components/HamburgerMenu';
    

const CategoryPage = ({ selectedStores, categories }) => {
    const { categoryName } = useParams();
    const [products, setProducts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            if (!selectedStores.length) {
                setProducts([]); // Nullstill produkter hvis ingen butikker er valgt
                return;
            }

            try {
                const allProducts = []; // Midlertidig liste for alle produkter
                for (const store of selectedStores) {
                    const response = await axios.get('http://localhost:3001/products', {
                        params: {
                            tables: store,
                            category: categoryName,
                        },
                    });

                    // Filtrer bort produkter uten gyldige data
                    const validProducts = response.data.filter(
                        (product) =>
                            product.image_url &&
                            product.name &&
                            product.price &&
                            product.image_url.trim() !== '' // Pass på at URL ikke er tom
                    );

                    allProducts.push(...validProducts); // Legg til produkter i listen
                }

                setProducts(allProducts); // Oppdater state med alle produkter
            } catch (error) {
                console.error('Feil ved henting av produkter:', error);
            }
        };

        fetchProducts();
    }, [categoryName, selectedStores]);

    return (
        <div className="container">
            <HamburgerMenu categories={categories} /> {/* Pass på at kategorier blir sendt */}
            
            <h2 className="text-center my-4">{categoryName}</h2>
            <div className="row">
                {products.length > 0 ? (
                    products.map((product) => (
                        <div
                            key={product.id}
                            className="col-md-4 col-sm-6 mb-4"
                            onClick={() => product.product_link && window.open(product.product_link, '_blank')}
                        >
                            <div className="product-card">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="card-img-top" />
                                ) : (
                                    <div className="placeholder-image">Bilde mangler</div>
                                )}
                                <div className="card-body">
                                    <h5 className="card-title">{product.name}</h5>
                                    <p className="card-text">Pris: {product.price} NOK</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center">Velg de butikkene du ønsker å handle på</p>
                )}
            </div>
        </div>
    );
};

export default CategoryPage;
