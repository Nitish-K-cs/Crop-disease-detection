// src/App.js
import React, { useState } from "react";
import axios from "axios";

function App() {
  const [selectedFile, setSelectedFile] = useState(null); // File object
  const [previewUrl, setPreviewUrl] = useState(null);     // local preview
  const [data, setData] = useState(null);                 // response from backend
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Replace or set REACT_APP_API_URL in your .env: e.g. REACT_APP_API_URL=http://127.0.0.1:8000/predict
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

    // Basic validation: image mime type
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);

    // create local preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
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
      formData.append("file", selectedFile); // matches your backend signature

      const res = await axios({
        method: "post",
        url: API_URL,
        data: formData,
        headers: {
          // IMPORTANT: don't set Content-Type here — let the browser set the multipart boundary
        },
        timeout: 120000, // 2 minutes in case model takes time
      });

      if (res.status === 200) {
        setData(res.data);
      } else {
        setError(`Unexpected server response: ${res.status}`);
      }
    } catch (err) {
      if (err.response) {
        // server responded with a status outside 2xx
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

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Image Upload & Prediction</h1>

      <div style={styles.card}>
        <label style={styles.label}>
          Choose image
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            style={styles.fileInput}
          />
        </label>

        {previewUrl && (
          <div style={styles.previewWrap}>
            <img src={previewUrl} alt="preview" style={styles.preview} />
          </div>
        )}

        <div style={styles.controls}>
          <button
            onClick={sendFile}
            disabled={isLoading || !selectedFile}
            style={isLoading || !selectedFile ? styles.buttonDisabled : styles.button}
          >
            {isLoading ? "Uploading..." : "Upload & Predict"}
          </button>

          <button onClick={onClear} style={styles.clearButton}>
            Clear
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}
      </div>

      {data && (
        <div style={styles.resultCard}>
          <h2>Prediction</h2>
          <pre style={styles.pre}>
            {JSON.stringify(data, null, 2)}
          </pre>

          {/* If your backend returns {predicted_class, confidence}, show nicer UI */}
          {data.predicted_class && (
            <div style={styles.summary}>
              <strong>Class:</strong> {data.predicted_class} <br />
              <strong>Confidence:</strong> {typeof data.confidence === "number" ? (data.confidence * 100).toFixed(2) + "%" : String(data.confidence)}
            </div>
          )}
        </div>
      )}

      <footer style={styles.footer}>
        <small>Backend: {API_URL}</small>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 760,
    margin: "28px auto",
    padding: "0 16px",
    fontFamily: "Inter, Roboto, -apple-system, 'Segoe UI', Helvetica, Arial",
    color: "#111",
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    border: "1px solid #e6e6e6",
    borderRadius: 8,
    padding: 18,
    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
  },
  label: {
    display: "inline-block",
    cursor: "pointer",
    padding: "8px 12px",
    border: "1px dashed #ccc",
    borderRadius: 6,
  },
  fileInput: {
    display: "block",
    marginTop: 8,
  },
  previewWrap: {
    marginTop: 12,
  },
  preview: {
    maxWidth: "100%",
    maxHeight: 360,
    borderRadius: 6,
    border: "1px solid #ddd",
  },
  controls: {
    marginTop: 12,
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  button: {
    padding: "8px 14px",
    backgroundColor: "#0b66ff",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  buttonDisabled: {
    padding: "8px 14px",
    backgroundColor: "#9fb8ff",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "not-allowed",
  },
  clearButton: {
    padding: "8px 12px",
    backgroundColor: "#f3f3f3",
    border: "1px solid #ddd",
    borderRadius: 6,
    cursor: "pointer",
  },
  error: {
    marginTop: 12,
    color: "#b00020",
  },
  resultCard: {
    marginTop: 18,
    border: "1px solid #e6e6e6",
    padding: 12,
    borderRadius: 8,
    background: "#fafafa",
  },
  pre: {
    background: "#fff",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #eee",
    overflowX: "auto",
  },
  summary: {
    marginTop: 8,
    fontSize: 16,
  },
  footer: {
    marginTop: 18,
    textAlign: "center",
    color: "#666",
  },
};

export default App;
