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
        let cancelled = false;
        const storesSnapshot = [...selectedStores];

        const fetchProducts = async () => {
            if (storesSnapshot.length === 0) {
            setProducts([]);
            return;
            }

            try {
            // Hent parallelt fra alle valgte butikker
            const responses = await Promise.all(
                storesSnapshot.map(store =>
                axios.get('http://localhost:3001/products', {
                    params: { tables: store, category: categoryName },
                })
                )
            );

            // Slå sammen og merk produktene med kilde + unik key
            const merged = responses.flatMap((res, idx) => {
                const source = storesSnapshot[idx];
                return res.data
                .filter(
                    p =>
                    p.image_url &&
                    p.name &&
                    p.price &&
                    p.image_url.trim() !== ''
                )
                .map(p => ({
                    ...p,
                    __source: source,
                    // unik nøkkel på tvers av tabeller
                    __key: `${source}_${p.id ?? p.product_link ?? p.image_url}`,
                }));
            });


            if (!cancelled) setProducts(merged);
            } catch (error) {
            if (!cancelled) console.error('Feil ved henting av produkter:', error);
            }
        };

        fetchProducts();
        return () => {
            cancelled = true;
        };
        }, [categoryName, selectedStores]);

    return (
        <div className="container">
            <HamburgerMenu categories={categories} /> {/* Pass på at kategorier blir sendt */}
            
            <h2 className="text-center my-4">{categoryName}</h2>
            <div className="row">
                {products.length > 0 ? (
                    products.map((product) => (
                        <div
                            key={product.__key}
                            className="col-md-4 col-sm-6 mb-4"
                            onClick={() => product.product_link && window.open(product.product_link, '_blank')}
                        >
                            <div className="product-card">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="card-img-top" loading="lazy"/>
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
