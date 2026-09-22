import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";

function Home() {
  const { t } = useLanguage();

  return (
    <div className="home-page">

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo.png" alt="Logo" style={{ width: "34px", height: "34px", borderRadius: "8px", objectFit: "contain", background: "#fff", padding: "2px" }} />
          <span>{t("appName")}</span> 
        </div>

        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <a href="#features">{t("features")}</a>
          <a href="#how-it-works">{t("howItWorks")}</a>
          <LanguageSelector />
          <Link to="/login" className="nav-login">
            {t("login")}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">

          <div className="hero-badge">
            🤖 {t("priceIntelligence")}
          </div>

          <h1>
            {t("heroTitle1")}
            <br />
            <span>{t("heroTitle2")}</span>
          </h1>

          <p>
            {t("heroSubtitle")}
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="primary-btn">
              {t("startSelling")}
            </Link>

            <Link to="/register" className="secondary-btn">
              {t("buyProduce")}
            </Link>
          </div>

          <div className="hero-stats">
            <div>
              <strong>₹113 Cr+</strong>
              <span>{t("marketOpportunity")}</span>
            </div>

            <div>
              <strong>AI Powered</strong>
              <span>{t("priceIntelligence")}</span>
            </div>

            <div>
              <strong>Direct</strong>
              <span>{t("farmerBuyerConnect")}</span>
            </div>
          </div>

        </div>

        {/* Hero Ecosystem Showcase Card */}
        <div className="hero-trio-showcase">
          <div className="hero-trio-card">
            <img
              src="/uzhavar_hero_trio.jpg"
              alt="UzhavarSetu Ecosystem - Farmer, Buyer, Transporter"
              className="hero-trio-img"
            />
            <div className="hero-floating-badge badge-farmer">
              {t("verifiedFarmer")}
            </div>
            <div className="hero-floating-badge badge-buyer">
              {t("directBuyer")}
            </div>
            <div className="hero-floating-badge badge-transporter">
              {t("aiTransporter")}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">

        <div className="section-heading">
          <span>{t("powerfulFeatures")}</span>
          <h2>{t("featuresHeading")}</h2>
          <p>{t("featuresSub")}</p>
        </div>

        <div className="features-grid">

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>{t("marketIntelTitle")}</h3>
            <p>{t("marketIntelDesc")}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>{t("aiForecastTitle")}</h3>
            <p>{t("aiForecastDesc")}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔨</div>
            <h3>{t("biddingTitle")}</h3>
            <p>{t("biddingDesc")}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🚚</div>
            <h3>{t("logisticsTitle")}</h3>
            <p>{t("logisticsDesc")}</p>
          </div>

        </div>
      </section>

      {/* How it works */}
      <section className="how-section" id="how-it-works">

        <div className="section-heading">
          <span>{t("howItWorks")}</span>
          <h2>{t("howItWorksHeading")}</h2>
        </div>

        <div className="steps">

          <div className="step">
            <div className="step-number">01</div>
            <h3>{t("step1Title")}</h3>
            <p>{t("step1Desc")}</p>
          </div>

          <div className="step">
            <div className="step-number">02</div>
            <h3>{t("step2Title")}</h3>
            <p>{t("step2Desc")}</p>
          </div>

          <div className="step">
            <div className="step-number">03</div>
            <h3>{t("step3Title")}</h3>
            <p>{t("step3Desc")}</p>
          </div>

          <div className="step">
            <div className="step-number">04</div>
            <h3>{t("step4Title")}</h3>
            <p>{t("step4Desc")}</p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>{t("appName")}</h3>
            <p>{t("tagline")}</p>
          </div>

          <div className="footer-links">
            <a href="#features">{t("features")}</a>
            <a href="#how-it-works">{t("howItWorks")}</a>
            <Link to="/login">{t("login")}</Link>
            <Link to="/register">{t("register")}</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {t("appName")}. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}

export default Home;