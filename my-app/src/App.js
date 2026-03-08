import React, { Suspense, lazy, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import { categoryNames } from "./data/categories";
import "./App.css";

const HomePage = lazy(() => import("./pages/HomePage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ImageSearch = lazy(() => import("./components/ImageSearch"));

const App = () => {
  const [selectedStores, setSelectedStores] = useState([]);

  return (
    <Router>
      <div className="app-shell">
        <div className="app-shell__glow app-shell__glow--one" aria-hidden="true" />
        <div className="app-shell__glow app-shell__glow--two" aria-hidden="true" />
        <Header onFilterChange={setSelectedStores} />
        <main className="app-main">
          <Suspense
            fallback={
              <section className="route-loader" aria-live="polite">
                <div className="route-loader__pulse" />
                <p>Laster side...</p>
              </section>
            }
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/category/:categoryName"
                element={
                  <CategoryPage
                    selectedStores={selectedStores}
                    categories={categoryNames}
                  />
                }
              />
              <Route path="/find-similar" element={<ImageSearch />} />
              <Route
                path="*"
                element={
                  <section className="not-found">
                    <p className="not-found__code">404</p>
                    <h1 className="not-found__title">Siden finnes ikke</h1>
                    <p className="not-found__text">
                      Sjekk adressen, eller gå tilbake til forsiden.
                    </p>
                  </section>
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
};
export default App;
