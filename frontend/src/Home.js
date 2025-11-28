// src/Home.js
import React from "react";
import leafIcon from "./leaf.jpg"; // <-- put a small leaf image in src/ as leaf.png

export default function Home({ onStart }) {
  return (
    <div className="home-wrapper">

      {/* ---------------- NAVBAR ---------------- */}
      <nav className="home-navbar">
        <div className="home-navbar-left">
          <img src={leafIcon} alt="leaf" className="leaf-logo" />
          <span className="brand-name">Afgritech</span>
        </div>

        <div className="home-navbar-right">
          <button className="nav-btn login-btn">Login</button>
          <button className="nav-btn register-btn">Register</button>
        </div>
      </nav>

      {/* ---------------- HOME CONTENT ---------------- */}
      <div className="home-container">
        <div className="home-left">
          <h1 className="home-title">
            PRECISION <br />
            CROP DISEASE <br />
            DETECTION AI
          </h1>

          <button className="home-btn" onClick={onStart}>
            Get Started
          </button>
        </div>

        <div className="home-right"></div>
      </div>
    </div>
  );
}
