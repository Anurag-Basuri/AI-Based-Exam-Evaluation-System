import React, { useState } from "react";

const Login = ({ onLogin }) => {
    const [role, setRole] = useState("student"); // "student" | "teacher"
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!identifier || !password) {
            setError("Please fill in all fields.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role, identifier, password }),
            });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Login failed");
            }
            const data = await res.json();
            // Example: persist token/role as needed by your app
            if (data?.token) localStorage.setItem("token", data.token);
            localStorage.setItem("role", role);
            if (typeof onLogin === "function") onLogin({ role, user: data?.user });
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <h2 style={styles.title}>Login</h2>

                <div style={styles.roleGroup}>
                    <label style={styles.roleLabel}>
                        <input
                            type="radio"
                            name="role"
                            value="student"
                            checked={role === "student"}
                            onChange={() => setRole("student")}
                        />
                        Student
                    </label>
                    <label style={styles.roleLabel}>
                        <input
                            type="radio"
                            name="role"
                            value="teacher"
                            checked={role === "teacher"}
                            onChange={() => setRole("teacher")}
                        />
                        Teacher
                    </label>
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>
                        {role === "student" ? "Student ID or Email" : "Teacher Email"}
                    </label>
                    <input
                        style={styles.input}
                        type="text"
                        placeholder={role === "student" ? "e.g. S12345 or student@domain.com" : "teacher@domain.com"}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        autoComplete="username"
                    />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Password</label>
                    <input
                        style={styles.input}
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />
                </div>

                {error ? <div style={styles.error}>{error}</div> : null}

                <button type="submit" style={styles.button} disabled={loading}>
                    {loading ? "Signing in..." : `Login as ${role}`}
                </button>
            </form>
        </div>
    );
};

const styles = {
    container: {
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f7f7fb",
        padding: 16,
    },
    form: {
        width: "100%",
        maxWidth: 420,
        background: "#fff",
        padding: 24,
        borderRadius: 12,
        boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
    },
    title: { margin: 0, marginBottom: 16, fontWeight: 600 },
    roleGroup: {
        display: "flex",
        gap: 16,
        marginBottom: 16,
    },
    roleLabel: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer" },
    field: { marginBottom: 12 },
    label: { display: "block", fontSize: 14, marginBottom: 6 },
    input: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #ddd",
        outline: "none",
    },
    button: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: "none",
        background: "#4f46e5",
        color: "#fff",
        cursor: "pointer",
        fontWeight: 600,
    },
    error: {
        background: "#fdecea",
        color: "#b3261e",
        padding: "8px 10px",
        borderRadius: 8,
        marginBottom: 12,
        fontSize: 14,
    },
};

export default Login;</label></div></form></div>
