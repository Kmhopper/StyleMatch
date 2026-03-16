"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/constants";

export function useImageSearch() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const updateFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }
    setSelectedFile(file);
    setError("");
  };

  const handleFileChange = (event) => {
    updateFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    updateFile(event.dataTransfer.files?.[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError("Last opp et bilde før du starter søket.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (Array.isArray(response.data)) {
        setResults(response.data);
      } else {
        setResults([]);
        setError("Ugyldig respons fra serveren.");
      }
    } catch (requestError) {
      console.error("Feil ved opplastning:", requestError.response?.data || requestError.message);
      setResults([]);
      setError("Noe gikk galt under analysen. Prøv igjen.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setResults([]);
    setError("");
  };

  return {
    selectedFile,
    previewUrl,
    results,
    loading,
    error,
    isDragging,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleSubmit,
    reset,
  };
}
