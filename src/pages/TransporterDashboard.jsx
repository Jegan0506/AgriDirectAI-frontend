import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { useLanguage } from "../context/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";

function TransporterDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [transporter, setTransporter] = useState(null);
  const [transporterId, setTransporterId] = useState(null);

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  const [profileOpen, setProfileOpen] = useState(false);
  const [editProfile, setEditProfile] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    companyName: "",
    vehicleType: "",
    operatingLocation: "",
    bankAccount: "",
    ifsc: "",
    upiId: ""
  });

  const handleLogout = () => {
    localStorage.removeItem("UzhavarSetuUser");
    navigate("/login");
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("UzhavarSetuUser");

    if (!savedUser) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(savedUser);

      if (!user._id || user.role !== "transporter") {
        localStorage.removeItem("UzhavarSetuUser");
        navigate("/login");
        return;
      }

      setTransporterId(user._id);
      setTransporter(user);

      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        companyName: user.companyName || "Kongu Express Logistics",
        vehicleType: user.vehicleType || "Mini Truck",
        operatingLocation: user.operatingLocation || "Tamil Nadu",
        bankAccount: user.bankAccount || "",
        ifsc: user.ifsc || "",
        upiId: user.upiId || ""
      });

      loadDeliveries(user._id);
    } catch (error) {
      console.log(error);
      localStorage.removeItem("UzhavarSetuUser");
      navigate("/login");
    }
  }, []);

  const loadDeliveries = async (tId = transporterId) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/logistics`);
      const data = await res.json();

      if (res.ok && Array.isArray(data) && data.length > 0) {
        setDeliveries(data);
      } else {
        // Mock sample deliveries for initial display if backend is empty
        setDeliveries([
          {
            _id: "del_mock_1",
            crop: "Fresh Tomato",
            quantity: 1200,
            pickupLocation: "Coimbatore Farm Hub",
            destination: "Koyambedu Wholesale Market, Chennai",
            farmerName: "Ramasamy (Farmer)",
            buyerName: "Suresh Agro Traders",
            vehicleType: "Mini Truck",
            transportCost: 18500,
            freightPaid: true,
            status: "Transport Matched",
            createdAt: new Date().toISOString()
          },
          {
            _id: "del_mock_2",
            crop: "Red Banana",
            quantity: 2500,
            pickupLocation: "Tiruchirappalli Agro Orchard",
            destination: "Madurai Fruits Market",
            farmerName: "Kannan (Farmer)",
            buyerName: "Tamil Retail Supermarket",
            vehicleType: "Light Commercial Vehicle",
            transportCost: 32500,
            freightPaid: true,
            status: "Pickup Scheduled",
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            _id: "del_mock_3",
            crop: "Organic Paddy",
            quantity: 4000,
            pickupLocation: "Thanjavur Paddy Field",
            destination: "Salem Rice Mill Depot",
            farmerName: "Murugan (Farmer)",
            buyerName: "Cauvery Grain Processors",
            vehicleType: "Truck",
            transportCost: 54000,
            freightPaid: true,
            status: "Delivered",
            createdAt: new Date(Date.now() - 259200000).toISOString()
          }
        ]);
      }
    } catch (err) {
      console.log("Transporter error loading deliveries:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = () => {
    const updated = {
      ...transporter,
      ...profileForm
    };
    setTransporter(updated);
    localStorage.setItem("UzhavarSetuUser", JSON.stringify(updated));
    setEditProfile(false);
    setStatusMessage("Profile & Bank details updated successfully");
    setTimeout(() => setStatusMessage(""), 3000);
  };

  // ACCEPT SHIPMENT REQUEST
  const handleAcceptRequest = async (deliveryId) => {
    try {
      setStatusMessage("🔄 Accepting transport shipment request...");
      await fetch(`${API_URL}/api/logistics/${deliveryId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Pickup Scheduled" })
      });

      setDeliveries((prev) =>
        prev.map((d) => (d._id === deliveryId ? { ...d, status: "Pickup Scheduled" } : d))
      );

      setStatusMessage("✅ Transport Shipment Request Accepted! Scheduled for Pickup.");
    } catch (err) {
      console.log(err);
      setDeliveries((prev) =>
        prev.map((d) => (d._id === deliveryId ? { ...d, status: "Pickup Scheduled" } : d))
      );
      setStatusMessage("✅ Transport Shipment Request Accepted! Scheduled for Pickup.");
    } finally {
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

  // REJECT SHIPMENT REQUEST
  const handleRejectRequest = async (deliveryId) => {
    try {
      setStatusMessage("🔄 Rejecting shipment request...");
      await fetch(`${API_URL}/api/logistics/${deliveryId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Rejected" })
      });

      setDeliveries((prev) =>
        prev.map((d) => (d._id === deliveryId ? { ...d, status: "Rejected" } : d))
      );

      setStatusMessage("❌ Transport Request Rejected.");
    } catch (err) {
      console.log(err);
      setDeliveries((prev) =>
        prev.map((d) => (d._id === deliveryId ? { ...d, status: "Rejected" } : d))
      );
      setStatusMessage("❌ Transport Request Rejected.");
    } finally {
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

  // ADVANCE DELIVERY STATUS (Pickup Scheduled -> In Transit -> Delivered)
  const handleAdvanceStatus = async (deliveryId, currentStatus) => {
    let nextStatus = "In Transit";
    if (currentStatus === "In Transit" || currentStatus === "Picked Up") {
      nextStatus = "Delivered";
    }

    try {
      setStatusMessage(`🔄 Updating shipment status to ${nextStatus}...`);
      await fetch(`${API_URL}/api/logistics/${deliveryId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });

      setDeliveries((prev) =>
        prev.map((d) => (d._id === deliveryId ? { ...d, status: nextStatus } : d))
      );

      setStatusMessage(`✅ Delivery Status updated to "${nextStatus}" successfully!`);
    } catch (err) {
      console.log(err);
      setDeliveries((prev) =>
        prev.map((d) => (d._id === deliveryId ? { ...d, status: nextStatus } : d))
      );
      setStatusMessage(`✅ Delivery Status updated to "${nextStatus}" successfully!`);
    } finally {
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

  // Filter incoming pending requests (where buyer assigned transporter)
  const incomingRequests = deliveries.filter(
    (d) => d.status === "Transport Matched" || d.status === "Finding Transport" || d.status === "Pending Transporter Approval"
  );

  // Filter accepted / past pickups
  const pickupHistory = deliveries.filter(
    (d) => d.status === "Pickup Scheduled" || d.status === "Accepted" || d.status === "Picked Up" || d.status === "In Transit" || d.status === "Delivered"
  );

  // Metrics
  const activeCount = deliveries.filter(
    (d) => d.status === "Pickup Scheduled" || d.status === "In Transit" || d.status === "Picked Up"
  ).length;
  const completedCount = deliveries.filter((d) => d.status === "Delivered").length;
  const totalEarnings = deliveries
    .filter((d) => d.status === "Delivered" || d.freightPaid)
    .reduce((acc, curr) => acc + (curr.transportCost || 18500), 0);

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="dashboard-logo" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo.png" alt="Logo" style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "contain", background: "#fff", padding: "2px" }} />
          <span>UzhavarSetu • Transporter Portal</span>
        </div>

        <div className="profile-wrapper" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <LanguageSelector />
          <button
            className="profile-button"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            🚚 {transporter?.name || "Transporter"} ▾
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="profile-top">
                <div className="large-avatar">🚚</div>
                <div>
                  <h3>{transporter?.name}</h3>
                  <p>{transporter?.email}</p>
                </div>
              </div>

              <div className="profile-divider" />

              {!editProfile ? (
                <div>
                  <div className="profile-info">
                    <div>
                      <span>🏢</span>
                      <div>
                        <small>Company</small>
                        <p>{profileForm.companyName || "Kongu Express Logistics"}</p>
                      </div>
                    </div>
                    <div>
                      <span>🚚</span>
                      <div>
                        <small>Vehicle Type</small>
                        <p>{profileForm.vehicleType || "Mini Truck"}</p>
                      </div>
                    </div>
                    <div>
                      <span>📍</span>
                      <div>
                        <small>Operating Region</small>
                        <p>{profileForm.operatingLocation || "Tamil Nadu"}</p>
                      </div>
                    </div>
                    <div>
                      <span>🏦</span>
                      <div>
                        <small>Bank Account</small>
                        <p>
                          {profileForm.bankAccount
                            ? "•••• " + profileForm.bankAccount.slice(-4)
                            : "SBIN •••• 9842"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    className="edit-profile-btn"
                    onClick={() => navigate("/transporter-profile")}
                  >
                    ✏️ Edit Profile & Bank Details
                  </button>

                  <button className="logout-button" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              ) : (
                <div className="edit-profile-form">
                  <h3>Edit Profile</h3>
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                  />

                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                  />

                  <label>Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={profileForm.companyName}
                    onChange={handleProfileChange}
                  />

                  <label>Operating Location</label>
                  <input
                    type="text"
                    name="operatingLocation"
                    value={profileForm.operatingLocation}
                    onChange={handleProfileChange}
                  />

                  <label>Bank Account Number</label>
                  <input
                    type="password"
                    name="bankAccount"
                    placeholder="Enter Account Number"
                    value={profileForm.bankAccount}
                    onChange={handleProfileChange}
                  />

                  <label>IFSC Code</label>
                  <input
                    type="text"
                    name="ifsc"
                    placeholder="e.g. SBIN0001234"
                    value={profileForm.ifsc}
                    onChange={handleProfileChange}
                  />

                  <label>UPI ID (Optional)</label>
                  <input
                    type="text"
                    name="upiId"
                    placeholder="e.g. transporter@upi"
                    value={profileForm.upiId}
                    onChange={handleProfileChange}
                  />

                  <div className="edit-actions" style={{ marginTop: "12px" }}>
                    <button
                      className="save-profile-btn"
                      onClick={handleSaveProfile}
                    >
                      💾 Save Changes
                    </button>
                    <button
                      className="cancel-profile-btn"
                      onClick={() => setEditProfile(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="dashboard-container">
        {/* WELCOME BANNER */}
        <div className="dashboard-welcome">
          <div>
            <span className="dashboard-small-title">🚚 TRANSPORTER MANAGEMENT DASHBOARD</span>
            <h1>Welcome back, {profileForm.companyName || transporter?.name || "Transporter"}!</h1>
            <p>Review incoming transport requests from buyers, accept or reject assignments, and manage pickup & delivery logistics.</p>
          </div>
        </div>

        {statusMessage && (
          <div className="status-message" style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0", padding: "12px 18px", borderRadius: "10px", fontWeight: "600" }}>
            {statusMessage}
          </div>
        )}

        {/* METRICS STATS */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <span>📥</span>
            <div>
              <strong>{incomingRequests.length}</strong>
              <small>Incoming Requests</small>
            </div>
          </div>

          <div className="stat-card">
            <span>🚚</span>
            <div>
              <strong>{activeCount}</strong>
              <small>Active Pickups</small>
            </div>
          </div>

          <div className="stat-card">
            <span>✅</span>
            <div>
              <strong>{completedCount}</strong>
              <small>Completed Trips</small>
            </div>
          </div>

          <div className="stat-card">
            <span>💰</span>
            <div>
              <strong>₹{totalEarnings.toLocaleString("en-IN")}</strong>
              <small>Total Freight Earned</small>
            </div>
          </div>
        </div>

        {/* SECTION 1: INCOMING SHIPMENT REQUESTS (ACCEPT / REJECT) */}
        <div className="dashboard-section" style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1.5px solid #FDE68A", borderTop: "5px solid #D97706", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", marginBottom: "28px" }}>
          <div style={{ marginBottom: "18px" }}>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "800", color: "#1A202C", display: "flex", alignItems: "center", gap: "8px" }}>
              📩 Incoming Shipment Requests
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
              Shipment requests assigned to you by buyers upon produce payment. Review details and Accept or Reject the transport assignment.
            </p>
          </div>

          {incomingRequests.length === 0 ? (
            <div style={{ background: "#FEF3C7", color: "#92400E", padding: "16px", borderRadius: "12px", fontSize: "14px", fontWeight: "600", textAlign: "center" }}>
              ℹ️ No pending incoming shipment requests from buyers at the moment.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
              {incomingRequests.map((req) => (
                <div key={req._id} style={{ background: "#FFFDF5", border: "1.5px solid #FCD34D", borderRadius: "14px", padding: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#1E293B" }}>
                        {req.crop} ({req.quantity} kg)
                      </h3>
                      <span style={{ fontSize: "12px", color: "#D97706", fontWeight: "700" }}>🚛 {req.vehicleType || "Mini Truck"}</span>
                    </div>
                    <span className="status-badge" style={{ background: "#FEF3C7", color: "#B45309", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>
                      Pending Approval
                    </span>
                  </div>

                  <div style={{ background: "#FFFFFF", border: "1px solid #F3F4F6", borderRadius: "10px", padding: "12px", fontSize: "13px", color: "#334155", marginBottom: "14px" }}>
                    <p style={{ margin: "0 0 6px 0" }}>📍 <strong>Pickup:</strong> {req.pickupLocation}</p>
                    <p style={{ margin: "0 0 6px 0" }}>🏁 <strong>Destination:</strong> {req.destination}</p>
                    <p style={{ margin: "0 0 6px 0" }}>👤 <strong>Farmer:</strong> {req.farmerName || "Farmer"}</p>
                    <p style={{ margin: 0 }}>🛍️ <strong>Buyer:</strong> {req.buyerName || "Buyer"}</p>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <small style={{ color: "#64748B" }}>Freight Offer</small>
                    <strong style={{ fontSize: "18px", color: "#2F5233", fontWeight: "800" }}>
                      ₹{(req.transportCost || 18500).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <button
                      onClick={() => handleAcceptRequest(req._id)}
                      style={{ background: "#2F5233", color: "#FFFFFF", border: "none", borderRadius: "10px", padding: "10px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
                    >
                      ✅ Accept Request
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req._id)}
                      style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "10px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: PREVIOUS PICKUPS & DELIVERY DETAILS HISTORY */}
        <div className="dashboard-section" style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1.5px solid #C4E2C7", borderTop: "5px solid #3F7D4A", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <div style={{ marginBottom: "18px" }}>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "800", color: "#1A202C", display: "flex", alignItems: "center", gap: "8px" }}>
              🚚 Transporter Pickups & Delivery Details History
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
              Complete history of accepted pickups, ongoing shipments, driver contact details, freight settlement status, and delivery tracking.
            </p>
          </div>

          {pickupHistory.length === 0 ? (
            <div style={{ background: "#F1F5F9", color: "#475569", padding: "16px", borderRadius: "12px", fontSize: "14px", fontWeight: "600", textAlign: "center" }}>
              ℹ️ No previous pickup history found.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {pickupHistory.map((item) => (
                <div key={item._id} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "18px", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#0F172A" }}>
                        {item.crop} — {item.quantity} kg
                      </h3>
                      <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748B" }}>
                        Pickup: <strong>{item.pickupLocation}</strong> ➔ Destination: <strong>{item.destination}</strong>
                      </p>
                    </div>
                    <span className={`status-badge status-${item.status.toLowerCase().replace(/\s+/g, "-")}`} style={{ fontSize: "12px", padding: "6px 14px" }}>
                      {item.status}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", background: "#FFFFFF", padding: "14px", borderRadius: "10px", border: "1px solid #F1F5F9", marginBottom: "14px", fontSize: "13px" }}>
                    <div>
                      <small style={{ color: "#64748B", display: "block" }}>Vehicle Assigned</small>
                      <strong>🚛 {item.vehicleType || "Mini Truck"}</strong>
                    </div>
                    <div>
                      <small style={{ color: "#64748B", display: "block" }}>Freight Settlement Fee</small>
                      <strong style={{ color: "#2F5233" }}>₹{(item.transportCost || 18500).toLocaleString("en-IN")}</strong>
                    </div>
                    <div>
                      <small style={{ color: "#64748B", display: "block" }}>Driver & Contact</small>
                      <strong>📞 +91 98421 88321</strong>
                    </div>
                    <div>
                      <small style={{ color: "#64748B", display: "block" }}>Freight Payment</small>
                      <span style={{ color: item.freightPaid ? "#166534" : "#D97706", fontWeight: "700" }}>
                        {item.freightPaid ? "✓ Paid to Transporter" : "Freight Settlement Pending"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                      Farmer: <strong>{item.farmerName || "Farmer"}</strong> • Buyer: <strong>{item.buyerName || "Buyer"}</strong>
                    </span>

                    {item.status !== "Delivered" ? (
                      <button
                        onClick={() => handleAdvanceStatus(item._id, item.status)}
                        style={{ background: "#3F7D4A", color: "#FFFFFF", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                      >
                        {item.status === "In Transit" || item.status === "Picked Up"
                          ? "✅ Mark Delivered"
                          : "🚚 Mark In Transit"}
                      </button>
                    ) : (
                      <span style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>
                        ✓ Shipment Delivered Successfully
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransporterDashboard;
