import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();

  const API_URL = "https://agridirectai-backend.onrender.com";

  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password || !role) {
      setStatusMessage(
        "Please enter email, password and select your account type"
      );
      return;
    }

    setLoading(true);
    setStatusMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password,
            role
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setStatusMessage(
          data.message || "Login failed"
        );
        return;
      }

      localStorage.setItem(
        "agriDirectUser",
        JSON.stringify({
          ...data.user,
          role: data.role
        })
      );

      setStatusMessage(
        "Login successful. Redirecting..."
      );

      setTimeout(() => {
        if (data.role === "farmer") {
          navigate("/farmer-dashboard");
        } else {
          navigate("/buyer-dashboard");
        }
      }, 500);

    } catch (error) {
      console.log(
        "Login error:",
        error
      );

      setStatusMessage(
        "Unable to connect to backend"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          🌾 <span>AgriDirect</span> AI
        </div>

        <h1>Welcome Back</h1>

        <p className="auth-subtitle">
          Login to continue to your agricultural marketplace.
        </p>

        {statusMessage && (
          <div className="status-message">
            {statusMessage}
          </div>
        )}

        <div className="role-title">
          Select your account
        </div>

        <div className="role-buttons">

          <button
            type="button"
            className={`role-card ${
              role === "farmer"
                ? "selected-role"
                : ""
            }`}
            onClick={() => setRole("farmer")}
          >
            <span>👨‍🌾</span>

            <div>
              <strong>Farmer</strong>

              <small>
                Sell your produce
              </small>
            </div>
          </button>

          <button
            type="button"
            className={`role-card ${
              role === "buyer"
                ? "selected-role"
                : ""
            }`}
            onClick={() => setRole("buyer")}
          >
            <span>🏪</span>

            <div>
              <strong>Buyer</strong>

              <small>
                Buy fresh produce
              </small>
            </div>
          </button>

        </div>

        <input
          type="email"
          placeholder="Email address"
          className="auth-input"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Password"
          className="auth-input"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          className="auth-submit"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;