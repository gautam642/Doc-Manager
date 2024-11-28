import React, { useState } from "react";
import axios from "axios";
import "./AuthPage.css";
import { useColorModes } from "@coreui/react";

function AuthPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async () => {
    const endpoint = isRegister ? "/register" : "/login";
    const payload = isRegister ? { name, email, password } : { email, password };
    try {
      const response = await axios.post(`http://localhost:5000/auth${endpoint}`, payload);
      if (!isRegister) {
        localStorage.setItem("token", response.data.token);
        onLogin();
      } else {
        alert("Registration successful! Please log in.");
        setIsRegister(false);
      }
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  return (
    <div className="auth-page">
      <h1 style={{"color":"white"}}>The Securer</h1>
      <div className="auth-container">
        <h1>{isRegister ? "Create an Account" : "Welcome Back"}</h1>
        <p>{isRegister ? "Sign up to get started" : "Log in to access your account"}</p>
        <form onSubmit={(e) => e.preventDefault()}>
          {isRegister && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleSubmit}>{isRegister ? "Register" : "Login"}</button>
        </form>
        <div className="toggle">
          <p>
            {isRegister
              ? "Already have an account?"
              : "Don't have an account yet?"}{" "}
            <span onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? "Login here" : "Sign up now"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
