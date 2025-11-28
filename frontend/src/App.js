// src/App.js
import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import Home from "./Home";
import leafIcon from "./leaf.jpg";

function App() {
  const [view, setView] = useState("home"); // show home first

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // If you set REACT_APP_API_URL in .env, it will be used; otherwise default below.
  const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/predict";

  const onFileChange = (e) => {
    setError(null);
    setData(null);
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const sendFile = async () => {
    if (!selectedFile) {
      setError("No file selected.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await axios.post(API_URL, formData, {
        // don't manually set Content-Type; browser will set the boundary
        timeout: 120000,
      });

      if (res.status === 200) {
        // accept either { class, confidence } or { predicted_class, confidence }
        setData(res.data);
      } else {
        setError(`Unexpected server response: ${res.status}`);
      }
    } catch (err) {
      if (err.response) {
        setError(`Server error: ${err.response.status} ${err.response.data?.detail || ""}`);
      } else if (err.request) {
        setError("No response from server. Is the backend running and CORS configured?");
      } else {
        setError("Request error: " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setData(null);
    setError(null);
  };

  // Helper: parse class string and confidence
  const getClassRaw = (d) => {
    if (!d) return "";
    return d.class ?? d.predicted_class ?? "";
  };

  const getConfidence = (d) => {
    if (!d) return null;
    return typeof d.confidence === "number" ? d.confidence : Number(d.confidence);
  };

  // Determine status (healthy vs diseased)
  const renderBadge = (rawClass, confidence) => {
    if (!rawClass) return null;

    // Normalize string like "Potato___healthy" -> { crop: "Potato", status: "healthy" }
    const parts = rawClass.split("___");
    const crop = parts[0] ? parts[0].replace(/_/g, " ") : "";
    const status = parts[1] ? parts[1].toLowerCase() : "";

    const confidencePct = (typeof confidence === "number" && !isNaN(confidence))
      ? (confidence * 100).toFixed(2)
      : null;

    // Healthy detection heuristics: if status contains "healthy"
    const isHealthy = status.includes("healthy");

    return (
      <div className="resultSummary">
        <div className={`statusBadge ${isHealthy ? "badgeHealthy" : "badgeDisease"}`}>
          <div className="badgeTitle">{isHealthy ? "Healthy" : "Disease Detected"}</div>
          <div className="badgeCrop">{crop || rawClass.replace(/___/g, " — ")}</div>
        </div>

        <div className="confidenceBox">
          <div className="confidenceLabel">Confidence</div>
          <div className="confidenceValue">
            {confidencePct !== null ? `${confidencePct}%` : "—"}
          </div>
        </div>

        {!isHealthy && (
          <div className="actionHint">
            <strong>Advice:</strong> inspect leaf for symptoms and consider targeted treatment.
          </div>
        )}
      </div>
    );
  };

  const rawClass = getClassRaw(data);
  const confidence = getConfidence(data);

  // Show HOME view
  if (view === "home") {
    return <Home onStart={() => setView("upload")} />;
  }

  // UPLOAD PAGE (existing UI)
  return (
    <div className="root">
      <nav className="app-navbar">
  <div className="app-navbar-inner">
    <img src={leafIcon} alt="leaf" className="leaf-logo" />
    <span className="app-brand-name">Afgritech</span>
  </div>
</nav>

      <main className="page">
        <h1 className="upload-title">Upload your leaf</h1>

        <div className="card">
          <label className="label">
            Choose image
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="fileInput"
            />
          </label>

          {previewUrl && (
            <div className="previewWrap">
              <img src={previewUrl} alt="preview" className="preview" />
            </div>
          )}

          <div className="controls">
            <button
              onClick={sendFile}
              disabled={isLoading || !selectedFile}
              className={isLoading || !selectedFile ? "button buttonDisabled" : "button"}
            >
              {isLoading ? "Uploading..." : "Upload & Predict"}
            </button>

            <button onClick={onClear} className="clearButton">
              Clear
            </button>
          </div>

          {error && <div className="error">{error}</div>}
        </div>

        {data && (
          <div className="resultCard">
            <h2 className="resultHeading">Prediction</h2>

            <div className="resultBody">
              {/* Badge + confidence + advice */}
              {renderBadge(rawClass, confidence)}

              {/* raw JSON for debugging / details */}
              <pre className="pre">{JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        )}

        <footer className="footer">
          <small>Backend: {API_URL}</small>
        </footer>
      </main>
    </div>
  );
}

export default App;
