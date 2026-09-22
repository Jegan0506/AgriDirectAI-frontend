import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-page">

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo.png" alt="Logo" style={{ width: "34px", height: "34px", borderRadius: "8px", objectFit: "contain", background: "#fff", padding: "2px" }} />
          <span>UzhavarSetu</span> 
        </div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <Link to="/login" className="nav-login">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">

          <div className="hero-badge">
            🤖 AI-Powered Agricultural Market Intelligence
          </div>

          <h1>
            Sell Smarter.
            <br />
            <span>Earn Better.</span>
          </h1>

          <p>
            UzhavarSetu helps farmers discover the right market,
            compare buyers, predict prices and maximize their profit.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="primary-btn">
              👨‍🌾 Start Selling
            </Link>

            <Link to="/register" className="secondary-btn">
              🏪 Buy Produce
            </Link>
          </div>

          <div className="hero-stats">
            <div>
              <strong>₹113 Cr+</strong>
              <span>Market Opportunity</span>
            </div>

            <div>
              <strong>AI Powered</strong>
              <span>Price Intelligence</span>
            </div>

            <div>
              <strong>Direct</strong>
              <span>Farmer–Buyer Connect</span>
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
              👨‍🌾 Verified Farmer
            </div>
            <div className="hero-floating-badge badge-buyer">
              🏪 Direct Buyer
            </div>
            <div className="hero-floating-badge badge-transporter">
              🚚 AI Transporter
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">

        <div className="section-heading">
          <span>POWERFUL FEATURES</span>
          <h2>Everything you need to sell smarter</h2>
          <p>
            From price discovery to logistics, UzhavarSetu connects
            the complete agricultural selling journey.
          </p>
        </div>

        <div className="features-grid">

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Market Intelligence</h3>
            <p>
              Compare current and nearby market prices before deciding
              where to sell.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Price Forecast</h3>
            <p>
              Get estimated future price trends using historical and
              market data.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔨</div>
            <h3>Competitive Bidding</h3>
            <p>
              Receive offers from multiple verified buyers and choose
              the best deal.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🚚</div>
            <h3>Smart Logistics</h3>
            <p>
              Find suitable transport options and calculate your actual
              net profit.
            </p>
          </div>

        </div>
      </section>

      {/* How it works */}
      <section className="how-section" id="how-it-works">

        <div className="section-heading">
          <span>HOW IT WORKS</span>
          <h2>From farm to better value</h2>
        </div>

        <div className="steps">

          <div className="step">
            <div className="step-number">01</div>
            <h3>Add Your Produce</h3>
            <p>
              Enter crop, quantity, quality, harvest date and location.
            </p>
          </div>

          <div className="step">
            <div className="step-number">02</div>
            <h3>Get Market Insights</h3>
            <p>
              View market prices, demand and AI-powered forecasts.
            </p>
          </div>

          <div className="step">
            <div className="step-number">03</div>
            <h3>Compare Buyers</h3>
            <p>
              Receive and compare competitive offers from verified buyers.
            </p>
          </div>

          <div className="step">
            <div className="step-number">04</div>
            <h3>Sell Profitably</h3>
            <p>
              Select the best offer and arrange logistics for delivery.
            </p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>
          Don't just sell your crop.
          <br />
          <span>Sell it smarter.</span>
        </h2>

        <p>
          Know the market. Choose the buyer. Maximize the value.
        </p>

        <Link to="/register" className="primary-btn">
          Get Started →
        </Link>
      </section>

      {/* Footer */}
      <footer>
        <div className="logo" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo.png" alt="Logo" style={{ width: "30px", height: "30px", borderRadius: "6px", objectFit: "contain", background: "#fff", padding: "2px" }} />
          <span>UzhavarSetu</span>
        </div>

        <p>
          AI-powered agricultural market intelligence.
        </p>

        <small>
          © 2026 UzhavarSetu. Built for smarter agriculture.
        </small>
      </footer>

    </div>
  );
}

export default Home;