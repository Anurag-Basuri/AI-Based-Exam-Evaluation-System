import React, {useState} from "react";
import { useSearchParams } from "react-router-dom";
import Login from "../components/Login.jsx";
import Register from "../components/register.jsx";

const AuthPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const mode = (searchParams.get("mode") || "login").toLowerCase(); // "login" | "register"

    const setMode = (next) => {
        const params = new URLSearchParams(searchParams);
        params.set("mode", next);
        setSearchParams(params, { replace: true });
    };

    return (
        <>
            {/* Floating toggle so it works with full-page Login/Register layouts */}
            <div
                role="tablist"
                aria-label="Authentication mode"
                style={styles.switchWrap}
            >
                <button
                    role="tab"
                    aria-selected={mode === "login"}
                    onClick={() => setMode("login")}
                    style={{
                        ...styles.switchBtn,
                        ...(mode === "login" ? styles.switchActiveLogin : {}),
                    }}
                >
                    Login
                </button>
                <button
                    role="tab"
                    aria-selected={mode === "register"}
                    onClick={() => setMode("register")}
                    style={{
                        ...styles.switchBtn,
                        ...(mode === "register" ? styles.switchActiveRegister : {}),
                    }}
                >
                    Register
                </button>
            </div>

            {mode === "register" ? <Register /> : <Login />}
        </>
    );
};

const styles = {
    switchWrap: {
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 6,
        background: "rgba(255,255,255,0.92)",
        border: "1px solid #e2e8f0",
        borderRadius: 999,
        padding: 6,
        zIndex: 50,
        boxShadow: "0 8px 24px rgba(2,6,23,0.12)",
        backdropFilter: "saturate(140%) blur(4px)",
    },
    switchBtn: {
        appearance: "none",
        border: "none",
        background: "transparent",
        color: "#334155",
        fontWeight: 700,
        padding: "8px 14px",
        borderRadius: 999,
        cursor: "pointer",
        transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
    },
    switchActiveLogin: {
        background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
        color: "#fff",
        boxShadow: "0 6px 18px rgba(79,70,229,0.25)",
    },
    switchActiveRegister: {
        background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
        color: "#fff",
        boxShadow: "0 6px 18px rgba(249,115,22,0.25)",
    },
};

export default AuthPage;
