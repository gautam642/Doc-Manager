import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import AppDoc from "./components/AppDoc";
import "./App.css"
function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(
        !!localStorage.getItem("token")
    );

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
    };

    return (
        <Router>
            <div>
                {isAuthenticated ? (
                    <div>
                        <button onClick={handleLogout}>Logout</button>
                        <AppDoc />
                    </div>
                ) : (
                    <Routes>
                        <Route path="/" element={<AuthPage onLogin={handleLogin} />} />
                    </Routes>
                )}
            </div>
        </Router>
    );
}

export default App;
