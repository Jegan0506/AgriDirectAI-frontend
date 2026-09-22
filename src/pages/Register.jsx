import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { API_URL } from "../config";
import { useLanguage } from "../context/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";

function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [role, setRole] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
          data.message || "Registration failed"
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
      <div className="auth-card" style={{ position: "relative" }}>

        <div style={{ position: "absolute", top: "18px", right: "20px" }}>
          <LanguageSelector />
        </div>

        <div className="auth-logo" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
          <img src="/logo.png" alt="Logo" style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "contain", background: "#fff", padding: "2px" }} />
          <span>{t("appName")}</span>
        </div>

        <h1>{t("createAccount")}</h1>

        <p className="auth-subtitle">
          {t("registerSubtitle")}
        </p>

        {statusMessage && (
          <div className="status-message">
            {statusMessage}
          </div>
        )}

        <input
          type="text"
          name="name"
          placeholder={t("fullName")}
          className="auth-input"
          value={form.name}
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder={t("emailAddress")}
          className="auth-input"
          value={form.email}
          onChange={handleChange}
        />

        <input
          type="tel"
          name="phone"
          placeholder={t("phoneNumber")}
          className="auth-input"
          value={form.phone}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder={t("password")}
          className="auth-input"
          value={form.password}
          onChange={handleChange}
        />

        <div className="role-title">
          {t("selectAccount")}
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
              <strong>{t("farmerRole")}</strong>
              <small>{t("farmerRoleSub")}</small>
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
              <strong>{t("buyerRole")}</strong>
              <small>{t("buyerRoleSub")}</small>
            </div>
          </button>

          <button
            type="button"
            className={`role-card ${
              role === "transporter"
                ? "selected-role"
                : ""
            }`}
            onClick={() => setRole("transporter")}
          >
            <span>🚚</span>

            <div>
              <strong>{t("transporterRole")}</strong>
              <small>{t("transporterRoleSub")}</small>
            </div>
          </button>

        </div>

        <button
          className="auth-submit"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading
            ? t("registering")
            : t("createAccount")}
        </button>

        <p className="auth-footer">
          {t("alreadyHaveAccount")}{" "}
          <Link to="/login">
            {t("loginHere")}
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Register;