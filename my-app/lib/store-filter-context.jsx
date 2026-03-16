"use client";

import { createContext, useContext, useMemo, useState } from "react";

const StoreFilterContext = createContext(null);

export function StoreFilterProvider({ children }) {
  const [selectedStores, setSelectedStores] = useState([]);

  const toggleStore = (storeId, checked) => {
    setSelectedStores((current) => {
      if (checked) {
        if (current.includes(storeId)) {
          return current;
        }
        return [...current, storeId];
      }
      return current.filter((store) => store !== storeId);
    });
  };

  const clearStores = () => {
    setSelectedStores([]);
  };

  const value = useMemo(
    () => ({
      selectedStores,
      setSelectedStores,
      toggleStore,
      clearStores,
    }),
    [selectedStores]
  );

  return <StoreFilterContext.Provider value={value}>{children}</StoreFilterContext.Provider>;
}

export function useStoreFilters() {
  const context = useContext(StoreFilterContext);
  if (!context) {
    throw new Error("useStoreFilters must be used within StoreFilterProvider");
  }
  return context;
}
