import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { API_URL } from "../config";
import { useLanguage } from "../context/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";

function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();

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
        "UzhavarSetuUser",
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
        } else if (data.role === "transporter") {
          navigate("/transporter-dashboard");
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
      <div className="auth-card" style={{ position: "relative" }}>

        <div style={{ position: "absolute", top: "18px", right: "20px" }}>
          <LanguageSelector />
        </div>

        <div className="auth-logo" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
          <img src="/logo.png" alt="Logo" style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "contain", background: "#fff", padding: "2px" }} />
          <span>{t("appName")}</span>
        </div>

        <h1>{t("welcomeBack")}</h1>

        <p className="auth-subtitle">
          {t("loginSubtitle")}
        </p>

        {statusMessage && (
          <div className="status-message">
            {statusMessage}
          </div>
        )}

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

              <small>
                {t("farmerRoleSub")}
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
              <strong>{t("buyerRole")}</strong>

              <small>
                {t("buyerRoleSub")}
              </small>
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

              <small>
                {t("transporterRoleSub")}
              </small>
            </div>
          </button>
        </div>

        <input
          type="email"
          placeholder={t("emailAddress")}
          className="auth-input"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          type="password"
          placeholder={t("password")}
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
            ? t("loggingIn")
            : t("login")}
        </button>

        <p className="auth-footer">
          {t("dontHaveAccount")}{" "}
          <Link to="/register">
            {t("createOne")}
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;