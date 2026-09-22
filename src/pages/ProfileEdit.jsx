import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from "../config";

function ProfileEdit() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState("farmer");
  const [statusMessage, setStatusMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    farmName: "",
    businessName: "",
    companyName: "",
    vehicleType: "",
    bankAccount: "",
    ifsc: "",
    accountHolder: "",
    upiId: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem("UzhavarSetuUser");
    if (!saved) {
      navigate("/login");
      return;
    }

    try {
      const u = JSON.parse(saved);
      setUser(u);
      setRole(u.role || "farmer");

      setForm({
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        location: u.location || "",
        farmName: u.farmName || "My Farm",
        businessName: u.businessName || "My Business",
        companyName: u.companyName || "Express Transports",
        vehicleType: u.vehicleType || "Mini Truck",
        bankAccount: u.bankAccount || "",
        ifsc: u.ifsc || "",
        accountHolder: u.accountHolder || u.name || "",
        upiId: u.upiId || ""
      });
    } catch (e) {
      console.log(e);
      navigate("/login");
    }
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage("");

    try {
      const updatedUser = {
        ...user,
        ...form
      };

      // Persist in localStorage
      localStorage.setItem("UzhavarSetuUser", JSON.stringify(updatedUser));
      setUser(updatedUser);

      setStatusMessage("Profile & Payment details updated successfully!");

      setTimeout(() => {
        if (role === "farmer") navigate("/farmer-dashboard");
        else if (role === "buyer") navigate("/buyer-dashboard");
        else navigate("/transporter-dashboard");
      }, 1200);
    } catch (err) {
      console.log("Save profile error:", err);
      setStatusMessage("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getDashboardLink = () => {
    if (role === "farmer") return "/farmer-dashboard";
    if (role === "buyer") return "/buyer-dashboard";
    return "/transporter-dashboard";
  };

  return (
    <div className="dashboard-page" style={{ minHeight: "100vh", background: "#F8FAF7", padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* TOP NAVIGATION */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
          <Link to={getDashboardLink()} style={{ color: "#3F7D4A", fontWeight: "700", textDecoration: "none", fontSize: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
            ← Back to Dashboard
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "20px", fontWeight: "800", color: "#26332A" }}>
            <img src="/logo.png" alt="Logo" style={{ width: "28px", height: "28px", borderRadius: "6px" }} />
            <span>UzhavarSetu Profile</span>
          </div>
        </div>

        {/* PROFILE HEADER CARD */}
        <div className="farmer-section" style={{ background: "#fff", border: "1px solid #E4EBE5", borderRadius: "18px", padding: "28px", marginBottom: "25px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#EAF4EA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>
              {role === "farmer" ? "👨‍🌾" : role === "buyer" ? "🏪" : "🚚"}
            </div>
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: "800", color: "#26332A" }}>
                Edit {role.charAt(0).toUpperCase() + role.slice(1)} Profile
              </h1>
              <p style={{ margin: 0, color: "#68756B", fontSize: "14px" }}>
                Update your personal, business, and secure bank payment details.
              </p>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="status-message" style={{ background: "#EAF4EA", border: "1px solid #C4E2C7", color: "#3F7D4A", padding: "14px 18px", borderRadius: "12px", marginBottom: "20px", fontWeight: "700" }}>
            {statusMessage}
          </div>
        )}

        {/* EDIT FORM */}
        <form onSubmit={handleSave} className="farmer-section" style={{ background: "#fff", border: "1px solid #E4EBE5", borderRadius: "18px", padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          
          {/* SECTION 1: PERSONAL DETAILS */}
          <h2 style={{ margin: "0 0 18px", fontSize: "18px", fontWeight: "800", color: "#26332A", borderBottom: "2px solid #EAF4EA", paddingBottom: "10px" }}>
            👤 Personal Information
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "25px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#26332A" }}>Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #D7DED8", fontSize: "15px", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#26332A" }}>Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                disabled
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #E4EBE5", background: "#F8FAF7", color: "#68756B", fontSize: "15px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#26332A" }}>Mobile Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #D7DED8", fontSize: "15px", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#26332A" }}>Location / City</label>
              <input
                type="text"
                name="location"
                placeholder="e.g. Coimbatore, Tamil Nadu"
                value={form.location}
                onChange={handleChange}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #D7DED8", fontSize: "15px", outline: "none" }}
              />
            </div>
          </div>

          {/* SECTION 2: ROLE SPECIFIC DETAILS */}
          <h2 style={{ margin: "25px 0 18px", fontSize: "18px", fontWeight: "800", color: "#26332A", borderBottom: "2px solid #EAF4EA", paddingBottom: "10px" }}>
            {role === "farmer" ? "🌾 Farm Details" : role === "buyer" ? "🏪 Business Details" : "🚚 Logistics & Vehicle Details"}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "25px" }}>
            {role === "farmer" && (
              <>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#26332A" }}>Farm Name</label>
                  <input
                    type="text"
                    name="farmName"
                    value={form.farmName}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #D7DED8", fontSize: "15px" }}
                  />
                </div>
              </>
            )}

            {role === "buyer" && (
              <>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#26332A" }}>Business / Company Name</label>
                  <input
                    type="text"
                    name="businessName"
                    value={form.businessName}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #D7DED8", fontSize: "15px" }}
                  />
                </div>
              </>
            )}

            {role === "transporter" && (
              <>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#26332A" }}>Transport Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #D7DED8", fontSize: "15px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#26332A" }}>Primary Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={form.vehicleType}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #D7DED8", fontSize: "15px", background: "#fff" }}
                  >
                    <option value="Mini Truck">Mini Truck (Up to 1.5 Tons)</option>
                    <option value="Light Commercial Vehicle">Light Commercial Vehicle (1.5 - 3.5 Tons)</option>
                    <option value="Truck">Heavy Truck (3.5+ Tons)</option>
                    <option value="Refrigerated Truck">Refrigerated Van (Perishables)</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* SECTION 3: BANK & PAYMENT DETAILS */}
          <h2 style={{ margin: "25px 0 18px", fontSize: "18px", fontWeight: "800", color: "#26332A", borderBottom: "2px solid #EAF4EA", paddingBottom: "10px" }}>
            🏦 Payment & Settlement Account Details
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "30px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#26332A" }}>Account Holder Name</label>
              <input
                type="text"
                name="accountHolder"
                placeholder="Name as per bank record"
                value={form.accountHolder}
                onChange={handleChange}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #D7DED8", fontSize: "15px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#26332A" }}>Bank Account Number</label>
              <input
                type="password"
                name="bankAccount"
                placeholder="Enter account number"
                value={form.bankAccount}
                onChange={handleChange}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #D7DED8", fontSize: "15px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#26332A" }}>IFSC Code</label>
              <input
                type="text"
                name="ifsc"
                placeholder="e.g. SBIN0001234"
                value={form.ifsc}
                onChange={handleChange}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #D7DED8", fontSize: "15px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#26332A" }}>UPI ID (Optional)</label>
              <input
                type="text"
                name="upiId"
                placeholder="e.g. username@upi"
                value={form.upiId}
                onChange={handleChange}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #D7DED8", fontSize: "15px" }}
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div style={{ display: "flex", gap: "14px", justifyContent: "flex-end", borderTop: "1px solid #E4EBE5", paddingTop: "20px" }}>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(getDashboardLink())}
              style={{ padding: "12px 24px", borderRadius: "10px", background: "#EAF4EA", color: "#3F7D4A", border: "1px solid #3F7D4A33", fontWeight: "600", cursor: "pointer" }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-profile-btn"
              disabled={saving}
            >
              {saving ? "Saving Changes..." : "💾 Save Changes"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

export default ProfileEdit;
