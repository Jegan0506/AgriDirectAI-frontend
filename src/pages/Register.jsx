import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Register() {
  const navigate = useNavigate();

  const API_URL = "https://agridirectai-backend.onrender.com";

  const [role, setRole] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  const [statusMessage, setStatusMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async () => {
    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.password ||
      !role
    ) {
      setStatusMessage(
        "Please fill all details and select your role"
      );

      return;
    }

    if (form.password.length < 6) {
      setStatusMessage(
        "Password must contain at least 6 characters"
      );

      return;
    }

    setLoading(true);
    setStatusMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
            role
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setStatusMessage(
          data.message ||
            "Registration failed"
        );

        return;
      }

      setStatusMessage(
        "Account created successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1000);

    } catch (error) {
      console.log(
        "Registration error:",
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
          🌾 <span>UzhavarSetu</span>
        </div>

        <h1>Create Account</h1>

        <p className="auth-subtitle">
          Join UzhavarSetu and connect directly with the market.
        </p>

        {statusMessage && (
          <div className="status-message">
            {statusMessage}
          </div>
        )}

        <input
          type="text"
          name="name"
          placeholder="Full name"
          className="auth-input"
          value={form.name}
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email address"
          className="auth-input"
          value={form.email}
          onChange={handleChange}
        />

        <input
          type="tel"
          name="phone"
          placeholder="Mobile number"
          className="auth-input"
          value={form.phone}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Create password"
          className="auth-input"
          value={form.password}
          onChange={handleChange}
        />

        <div className="role-title">
          Register as
        </div>

        <div className="role-buttons">

          <button
            type="button"
            className={`role-card ${
              role === "farmer"
                ? "selected-role"
                : ""
            }`}
            onClick={() =>
              setRole("farmer")
            }
          >
            <span>👨‍🌾</span>

            <div>
              <strong>Farmer</strong>

              <small>
                List and sell produce
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
            onClick={() =>
              setRole("buyer")
            }
          >
            <span>🏪</span>

            <div>
              <strong>Buyer</strong>

              <small>
                Find agricultural produce
              </small>
            </div>
          </button>

        </div>

        <button
          className="auth-submit"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading
            ? "Creating Account..."
            : "Create Account"}
        </button>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">
            Login
          </Link>
        </p>

      </div>

    </div>
  );
}

export default Register;