import React from 'react';
import { Link } from 'react-router-dom';
import './CategoryGrid.css'; 

const CategoryGrid = ({ categories }) => {
  return (
    <div className="container">
      <div className="row">
        {categories.map((category) => (
          <div key={category.name} className="col-md-4 col-sm-6 mb-4">
            <Link to={`/category/${category.name}`} className="text-decoration-none">
              <div className="card h-100 category-card">
                <div className="category-imageWrap">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="category-img"
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
