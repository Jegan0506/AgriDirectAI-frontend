import React, { useState, useEffect } from "react";
import "./LogisticsModule.css";
import { API_URL } from "../config";

const LogisticsModule = ({ userRole = "farmer", userId = null, acceptedBid = null, onDeliveryCreated = null }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllDeliveries, setShowAllDeliveries] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Create Form State
  const [createForm, setCreateForm] = useState({
    crop: acceptedBid?.crop || "Tomato",
    quantity: acceptedBid?.quantity || 800,
    pickupLocation: "Coimbatore",
    destination: "Chennai",
    preferredPickupDate: new Date().toISOString().split("T")[0],
    deliveryPriority: "Normal",
    vehicleType: ""
  });

  const [suggestedVehicle, setSuggestedVehicle] = useState("Mini Truck");

  useEffect(() => {
    fetchDeliveries();
  }, [userId, userRole]);

  useEffect(() => {
    // Auto vehicle suggestion logic
    const qty = Number(createForm.quantity);
    const cropLower = createForm.crop.toLowerCase();
    const isPerishable = ["tomato", "strawberry", "mango", "banana", "milk", "flower"].some((c) => cropLower.includes(c));

    if (isPerishable && qty > 500) {
      setSuggestedVehicle("Refrigerated Truck");
    } else if (qty <= 1000) {
      setSuggestedVehicle("Mini Truck");
    } else if (qty <= 3500) {
      setSuggestedVehicle("Light Commercial Vehicle");
    } else {
      setSuggestedVehicle("Truck");
    }
  }, [createForm.quantity, createForm.crop]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/logistics`;
      if (userRole === "farmer" && userId) {
        url = `${API_URL}/api/logistics/farmer/${userId}`;
      } else if (userRole === "buyer" && userId) {
        url = `${API_URL}/api/logistics/buyer/${userId}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setDeliveries(data);
        if (data.length > 0 && !selectedDelivery) {
          setSelectedDelivery(data[0]);
        }
      }
    } catch (err) {
      console.log("Fetch deliveries error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...createForm,
        vehicleType: createForm.vehicleType || suggestedVehicle,
        farmerId: userRole === "farmer" ? userId : acceptedBid?.farmerId || null,
        buyerId: userRole === "buyer" ? userId : acceptedBid?.buyerId || null,
        produceId: acceptedBid?.produceId || null,
        bidId: acceptedBid?._id || null,
        farmerName: acceptedBid?.farmerName || "Farmer",
        buyerName: acceptedBid?.buyerName || "Buyer"
      };

      const res = await fetch(`${API_URL}/api/logistics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.delivery) {
        setStatusMsg("✅ Delivery created and transport matched!");
        setShowCreateModal(false);
        fetchDeliveries();
        setSelectedDelivery(data.delivery);
        if (onDeliveryCreated) onDeliveryCreated(data.delivery);
      } else {
        setStatusMsg(data.message || "Failed to create delivery");
      }
    } catch (err) {
      setStatusMsg("Failed to connect to backend server.");
    }
  };

  const handleAdvanceStatus = async (deliveryId, currentStatus) => {
    const statuses = [
      "Transport Required",
      "Finding Transport",
      "Transport Matched",
      "Pickup Scheduled",
      "Picked Up",
      "In Transit",
      "Delivered"
    ];
    const nextIdx = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    const nextStatus = statuses[nextIdx];

    try {
      const res = await fetch(`${API_URL}/api/logistics/${deliveryId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        fetchDeliveries();
        if (selectedDelivery && selectedDelivery._id === deliveryId) {
          setSelectedDelivery((prev) => ({ ...prev, status: nextStatus }));
        }
      }
    } catch (err) {
      console.log("Status update error:", err);
    }
  };

  const handleSelectTransporterAndRoute = async (transporterId, routeId) => {
    if (!selectedDelivery) return;
    const transName = transporterId === "trans_2" ? "GreenField Agro Transports" : "Kongu Express Logistics";
    try {
      const res = await fetch(`${API_URL}/api/logistics/${selectedDelivery._id}/select-transport`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transporterId, routeId })
      });
      const data = await res.json();
      if (res.ok && data.delivery) {
        setSelectedDelivery(data.delivery);
        fetchDeliveries();
        setStatusMsg(`✅ Transporter (${transName}) & AI Route confirmed! Now pay freight below.`);
      } else {
        setSelectedDelivery((prev) => prev ? { ...prev, transporterId, transporterName: transName } : null);
        setStatusMsg(`✅ Transporter (${transName}) & AI Route confirmed! Now pay freight below.`);
      }
    } catch (err) {
      console.log(err);
      setSelectedDelivery((prev) => prev ? { ...prev, transporterId, transporterName: transName } : null);
      setStatusMsg(`✅ Transporter (${transName}) & AI Route confirmed! Now pay freight below.`);
    }
  };

  const handlePayTransporterFreight = (deliveryId) => {
    setStatusMsg("🔄 Processing Demo Transporter Freight Payment...");
    setTimeout(() => {
      setSelectedDelivery((prev) => prev ? { ...prev, freightPaid: true, status: "Pickup Scheduled" } : null);
      setDeliveries((prev) => prev.map((d) => d._id === deliveryId ? { ...d, freightPaid: true, status: "Pickup Scheduled" } : d));
      setStatusMsg("✅ Demo Freight Payment of ₹18,500 successfully paid to Transporter!");
      setTimeout(() => setStatusMsg(""), 4000);
    }, 1200);
  };

  // Analytics Metrics
  const activeCount = deliveries.filter((d) => d.status !== "Delivered").length;
  const completedCount = deliveries.filter((d) => d.status === "Delivered").length;
  const totalVolume = deliveries.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  const avgCost = deliveries.length ? Math.round(deliveries.reduce((acc, curr) => acc + (Number(curr.transportCost) || 0), 0) / deliveries.length) : 18500;

  // Timeline Step Mapping (6 Steps)
  const steps = [
    { title: "Sale Confirmed", key: "Transport Required" },
    { title: "Transport Matched", key: "Transport Matched" },
    { title: "Pickup Scheduled", key: "Pickup Scheduled" },
    { title: "Picked Up", key: "Picked Up" },
    { title: "In Transit", key: "In Transit" },
    { title: "Delivered", key: "Delivered" }
  ];

  const getStepStatus = (currentStatus, stepKey) => {
    const statusOrder = [
      "Transport Required",
      "Finding Transport",
      "Transport Matched",
      "Pickup Scheduled",
      "Picked Up",
      "In Transit",
      "Delivered"
    ];
    const currentIdx = statusOrder.indexOf(currentStatus);
    const stepIdx = statusOrder.indexOf(stepKey);

    if (currentIdx > stepIdx || currentStatus === "Delivered") return "completed";
    if (currentIdx === stepIdx) return "active";
    return "pending";
  };

  return (
    <div className="logistics-container">
      {/* HEADER BAR */}
      <div className="logistics-header-bar">
        <div>
          <h2>🚚 Smart Logistics & AI Route Optimization</h2>
          <p>Automated vehicle suggestion, transporter matching, multi-route AI scoring & shipment tracking.</p>
        </div>
        <div className="logistics-header-actions">
          {userRole !== "farmer" && (
            <button className="primary-btn" onClick={() => setShowCreateModal(true)}>
              + Schedule Delivery
            </button>
          )}
        </div>
      </div>

      {statusMsg && <div className="logistics-status-banner">{statusMsg}</div>}

      {/* ANALYTICS SUMMARY GRID */}
      <div className="logistics-metrics-grid">
        <div className="metric-card accent-market">
          <span className="metric-icon">🚚</span>
          <div>
            <small>Active Shipments</small>
            <strong>{activeCount}</strong>
          </div>
        </div>
        <div className="metric-card accent-ai">
          <span className="metric-icon">✅</span>
          <div>
            <small>Completed Deliveries</small>
            <strong>{completedCount}</strong>
          </div>
        </div>
        <div className="metric-card accent-bids">
          <span className="metric-icon">📦</span>
          <div>
            <small>Volume Transported</small>
            <strong>{totalVolume} kg</strong>
          </div>
        </div>
        <div className="metric-card accent-earnings">
          <span className="metric-icon">💰</span>
          <div>
            <small>Avg Transport Cost</small>
            <strong>₹{avgCost.toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>

      {/* 1. ACTIVE & PAST DELIVERIES (COMPACT GRID FORMAT LIKE PREVIOUS BIDS HISTORY) */}
      <div style={{ background: "#ffffff", border: "1px solid #E4EBE5", borderRadius: "18px", padding: "24px", marginBottom: "24px", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1A202C", margin: 0 }}>
              📦 Active & Past Deliveries
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748B" }}>
              Select a shipment below to view live progress, choose transporters & unlock AI route optimization
            </p>
          </div>
          <span className="bid-count" style={{ background: "#E2E8F0", color: "#475569" }}>
            {deliveries.length} Shipments Total
          </span>
        </div>

        {loading ? (
          <div className="logistics-loading">Loading logistics data...</div>
        ) : deliveries.length === 0 ? (
          <div className="empty-logistics-card" style={{ padding: "20px", textAlign: "center" }}>
            <p>No active logistics shipments found.</p>
          </div>
        ) : (
          <>
            <div className="compact-bids-grid">
              {(showAllDeliveries ? deliveries : deliveries.slice(0, 3)).map((d) => (
                <div
                  key={d._id}
                  className={`compact-bid-card ${selectedDelivery?._id === d._id ? "active-delivery-selected" : ""}`}
                  style={{
                    border: selectedDelivery?._id === d._id ? "2px solid #3F7D4A" : "1.5px solid #E4EBE5",
                    background: selectedDelivery?._id === d._id ? "#F0FDF4" : "#F8FAF7",
                    borderRadius: "14px",
                    padding: "16px",
                    cursor: "pointer",
                    boxShadow: selectedDelivery?._id === d._id ? "0 4px 14px rgba(63,125,74,0.15)" : "none"
                  }}
                  onClick={() => setSelectedDelivery(d)}
                >
                  <div className="compact-bid-top" style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div className="compact-bid-crop-info" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span className="compact-bid-icon" style={{ fontSize: "20px" }}>📦</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>{d.crop} — {d.quantity} kg</h3>
                        <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748B" }}>📍 {d.pickupLocation} ➔ 🏁 {d.destination}</p>
                      </div>
                    </div>
                    <span className={`status-badge status-${d.status.toLowerCase().replace(/\s+/g, "-")}`}>
                      {d.status}
                    </span>
                  </div>

                  <div className="compact-bid-middle" style={{ display: "flex", justifyContent: "space-between", background: "#FFFFFF", padding: "8px 12px", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "12px", fontSize: "12px" }}>
                    <div>
                      <small style={{ color: "#64748B", display: "block" }}>Vehicle Type</small>
                      <strong>{d.vehicleType || "Mini Truck"}</strong>
                    </div>
                    <div>
                      <small style={{ color: "#64748B", display: "block" }}>Freight Cost</small>
                      <strong style={{ color: "#2F5233" }}>₹{(d.transportCost || 18500).toLocaleString("en-IN")}</strong>
                    </div>
                  </div>

                  <button
                    className="view-bid-details-btn"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "700",
                      background: selectedDelivery?._id === d._id ? "#3F7D4A" : "#E2E8F0",
                      color: selectedDelivery?._id === d._id ? "#FFFFFF" : "#334155",
                      cursor: "pointer"
                    }}
                  >
                    {selectedDelivery?._id === d._id ? "✓ Active Selected Delivery" : "📄 Inspect Delivery"}
                  </button>
                </div>
              ))}
            </div>

            {deliveries.length > 3 && (
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <button
                  className="secondary-btn"
                  onClick={() => setShowAllDeliveries(!showAllDeliveries)}
                  style={{ padding: "10px 22px", fontSize: "14px", borderRadius: "10px", fontWeight: "600" }}
                >
                  {showAllDeliveries
                    ? "▲ Show Less Deliveries"
                    : `▼ View More Deliveries (${deliveries.length - 3} more)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* DETAILED DELIVERY STACK FOR SELECTED SHIPMENT */}
      {selectedDelivery ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* SUMMARY HEADER CARD */}
          <div className="detail-header-card" style={{ background: "#ffffff", border: "1px solid #E4EBE5", borderRadius: "18px", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
            <div className="detail-title-group">
              <span className="tag-vehicle">{selectedDelivery.vehicleType}</span>
              <h2 style={{ margin: "4px 0", fontSize: "22px", fontWeight: "800" }}>
                {selectedDelivery.crop} ({selectedDelivery.quantity} kg)
              </h2>
              <p className="detail-loc" style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
                Pickup: <strong>{selectedDelivery.pickupLocation}</strong> ➔ Destination: <strong>{selectedDelivery.destination}</strong>
              </p>
            </div>
            <div className="detail-status-group" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
              <span className={`status-badge-lg status-${selectedDelivery.status.toLowerCase().replace(/\s+/g, "-")}`}>
                {selectedDelivery.status}
              </span>
              <button
                className="advance-status-btn"
                onClick={() => handleAdvanceStatus(selectedDelivery._id, selectedDelivery.status)}
                title="Click to advance delivery status for demo testing"
              >
                🔄 Advance Status
              </button>
            </div>
          </div>

          {/* 1. LIVE DELIVERY PROGRESS */}
          <div className="tracking-section-card" style={{ background: "#ffffff", border: "1.5px solid #C4E2C7", borderTop: "5px solid #3F7D4A", borderRadius: "18px", padding: "24px", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
            <div style={{ marginBottom: "16px" }}>
              <h4 style={{ fontSize: "18px", fontWeight: "800", color: "#1A202C", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                📍 Live Delivery Progress
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
                Real-time shipment status & milestone tracking from pickup to destination
              </p>
            </div>

            <div className="logistics-stepper">
              {steps.map((step, idx) => {
                const st = getStepStatus(selectedDelivery.status, step.key);
                return (
                  <div key={idx} className={`stepper-item ${st}`}>
                    <div className="stepper-circle">{st === "completed" ? "✓" : idx + 1}</div>
                    <span className="stepper-label">{step.title}</span>
                  </div>
                );
              })}
            </div>
            <div className="transporter-mini-bar" style={{ marginTop: "16px" }}>
              {selectedDelivery.status === "Transport Required" || selectedDelivery.status === "Sale Confirmed" || !selectedDelivery.transporterId ? (
                <div style={{ flex: 1, padding: "10px", background: "#FEF3C7", borderRadius: "8px", color: "#92400E", fontWeight: "700", textAlign: "center" }}>
                  ⏳ Transport Matching in Progress... Waiting for Transporter Selection
                </div>
              ) : (
                <>
                  <div>
                    <small>Transporter Name</small>
                    <strong>{selectedDelivery.transporterName || "Kongu Express Logistics"}</strong>
                  </div>
                  <div>
                    <small>Driver Contact</small>
                    <strong>{selectedDelivery.transporterPhone || "+91 98421 88321"}</strong>
                  </div>
                  <div>
                    <small>Freight Settlement</small>
                    <strong>₹{(selectedDelivery.transportCost || 18500).toLocaleString("en-IN")}</strong>
                  </div>
                  <div>
                    <small>Est. Distance & Time</small>
                    <strong>{selectedDelivery.estimatedDistance || 340} km ({selectedDelivery.estimatedTime || "9h 20m"})</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* FARMER VIEW OR BUYER VIEW */}
          {userRole === "farmer" ? (
            <div className="transporters-section-card accent-bids" style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ color: "#1e293b", margin: "0 0 6px 0", fontSize: "18px" }}>🚚 Confirmed Transport Details</h3>
              <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 16px 0" }}>
                Confirmed transporter & route details assigned to this shipment after buyer payment.
              </p>

              <div className="details-grid" style={{ background: "#f8fafc", padding: "18px", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                <div className="detail-item">
                  <small>Transporter Name</small>
                  <strong>{selectedDelivery.transporterName || "Kongu Express Logistics"}</strong>
                </div>
                <div className="detail-item">
                  <small>Driver Contact Phone</small>
                  <strong>📞 {selectedDelivery.transporterPhone || "+91 98421 88321"}</strong>
                </div>
                <div className="detail-item">
                  <small>Vehicle Type</small>
                  <strong>🚛 {selectedDelivery.vehicleType || "Mini Truck"}</strong>
                </div>
                <div className="detail-item">
                  <small>Freight Amount (Paid by Buyer)</small>
                  <strong style={{ color: "#2F6B3F" }}>₹{(selectedDelivery.transportCost || 18500).toLocaleString("en-IN")}</strong>
                </div>
                <div className="detail-item">
                  <small>Pickup Location</small>
                  <strong>📍 {selectedDelivery.pickupLocation}</strong>
                </div>
                <div className="detail-item">
                  <small>Destination</small>
                  <strong>🏁 {selectedDelivery.destination}</strong>
                </div>
                <div className="detail-item">
                  <small>Est. Distance & Duration</small>
                  <strong>🛣️ {selectedDelivery.estimatedDistance || 340} km ({selectedDelivery.estimatedTime || "9h 20m"})</strong>
                </div>
                <div className="detail-item">
                  <small>Shipment Status</small>
                  <span className={`status-badge status-${selectedDelivery.status.toLowerCase().replace(/\s+/g, "-")}`}>
                    {selectedDelivery.status}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 2. MATCHED TRANSPORTERS & RATES */}
              <div className="transporters-section-card accent-bids" style={{ background: "#ffffff", border: "1.5px solid #FDE68A", borderTop: "5px solid #D97706", borderRadius: "18px", padding: "24px", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1A202C", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                    🚚 Matched Transporters & Rates
                  </h3>
                  {selectedDelivery.freightPaid ? (
                    <p style={{ margin: 0, fontSize: "13px", color: "#166534", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>✓</span> Transporter Assigned & Paid ({selectedDelivery.transporterName || "Kongu Express Logistics"}) — Freight Settlement Complete.
                    </p>
                  ) : (
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
                      Select a verified transport provider below to confirm transport & unlock AI Route Optimization
                    </p>
                  )}
                </div>

                {!selectedDelivery.freightPaid && (
                  <div className="transporter-cards-grid" style={{ marginTop: "18px" }}>
                    {(selectedDelivery.matchedTransporters && selectedDelivery.matchedTransporters.length > 0
                      ? selectedDelivery.matchedTransporters
                      : [
                          {
                            id: "trans_1",
                            name: "Kongu Express Logistics",
                            phone: "+91 98421 88321",
                            vehicleType: selectedDelivery.vehicleType,
                            capacity: "1.5 Tons",
                            distanceFromPickupKm: 12,
                            estimatedCost: selectedDelivery.transportCost || 18500,
                            matchScore: 92,
                            rating: 4.8,
                            recommended: true
                          },
                          {
                            id: "trans_2",
                            name: "GreenField Agro Transports",
                            phone: "+91 97892 11400",
                            vehicleType: selectedDelivery.vehicleType,
                            capacity: "2.0 Tons",
                            distanceFromPickupKm: 28,
                            estimatedCost: (selectedDelivery.transportCost || 18500) + 1400,
                            matchScore: 84,
                            rating: 4.6,
                            recommended: false
                          }
                        ]
                    ).map((trans) => (
                      <div key={trans.id} className={`transporter-card ${trans.recommended ? "top-transporter" : ""}`}>
                        <div className="trans-head">
                          <strong>{trans.name}</strong>
                          <span className="match-score-pill">Match Score: {trans.matchScore}%</span>
                        </div>
                        <div className="trans-details">
                          <p>Vehicle: <strong>{trans.vehicleType}</strong> ({trans.capacity})</p>
                          <p>Distance to pickup: <strong>{trans.distanceFromPickupKm} km</strong></p>
                          <p>Est. Transport Cost: <strong>₹{trans.estimatedCost.toLocaleString("en-IN")}</strong></p>
                        </div>
                        <button
                          className="select-trans-btn"
                          onClick={() => handleSelectTransporterAndRoute(trans.id, selectedDelivery.selectedRoute?.id)}
                        >
                          {selectedDelivery.transporterId === trans.id ? "✓ Confirmed Transporter" : "Select Transporter"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. AI ROUTE OPTIMIZATION & MULTI-ROUTE COMPARISON (REVEALED AFTER TRANSPORTER SELECTION) */}
              {(selectedDelivery.transporterId || selectedDelivery.transporterName) ? (
                <div className="ai-route-section-card accent-ai" style={{ background: "#ffffff", border: "1.5px solid #99F6E4", borderTop: "5px solid #0D9488", borderRadius: "18px", padding: "24px", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
                  <div className="section-head-flex" style={{ marginBottom: selectedDelivery.freightPaid ? "0" : "20px" }}>
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1A202C", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                        🤖 AI Route Optimization & Multi-Route Comparison
                      </h3>
                      {selectedDelivery.freightPaid ? (
                        <p style={{ margin: 0, fontSize: "13px", color: "#0D9488", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>✓</span> AI Route Confirmed & Freight Settlement Paid to Transporter.
                        </p>
                      ) : (
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
                          Transparent scoring algorithm based on distance, travel time, fuel economy & tolls for confirmed transporter
                        </p>
                      )}
                    </div>
                    {!selectedDelivery.freightPaid && (
                      <div className="route-score-badge">
                        <span>AI Route Score</span>
                        <strong>{selectedDelivery.routeScore || 91}/100</strong>
                      </div>
                    )}
                  </div>

                  {!selectedDelivery.freightPaid && (
                    <>
                      {/* ROUTE CARDS GRID */}
                      <div className="routes-comparison-grid">
                        {(selectedDelivery.availableRoutes && selectedDelivery.availableRoutes.length > 0
                          ? selectedDelivery.availableRoutes
                          : [
                              {
                                id: "r1",
                                name: `Route A (${selectedDelivery.pickupLocation} → NH Highway → ${selectedDelivery.destination})`,
                                via: "NH Highways (Fastest & Lowest Fuel)",
                                distanceKm: selectedDelivery.estimatedDistance || 385,
                                estimatedTime: selectedDelivery.estimatedTime || "7h 40m",
                                fuelCost: selectedDelivery.fuelCost || 8900,
                                tollCost: selectedDelivery.tollCost || 2400,
                                handlingCost: selectedDelivery.handlingCost || 4500,
                                totalCost: selectedDelivery.transportCost || 18500,
                                routeScore: 91,
                                recommended: true,
                                reason: "Shortest travel time, highest fuel efficiency, and smooth road conditions for produce safety."
                              },
                              {
                                id: "r2",
                                name: `Route B (${selectedDelivery.pickupLocation} → SH Bypass → ${selectedDelivery.destination})`,
                                via: "State Highway (Lower Tolls)",
                                distanceKm: (selectedDelivery.estimatedDistance || 385) + 35,
                                estimatedTime: "8h 20m",
                                fuelCost: (selectedDelivery.fuelCost || 8900) + 750,
                                tollCost: 1400,
                                handlingCost: 4500,
                                totalCost: (selectedDelivery.transportCost || 18500) + 2800,
                                routeScore: 84,
                                recommended: false,
                                reason: "Slightly longer travel time with moderate toll savings."
                              }
                            ]
                        ).map((route) => (
                          <div
                            key={route.id}
                            className={`route-card-option ${route.recommended ? "recommended-route" : ""} ${
                              selectedDelivery.selectedRoute?.id === route.id ? "active-selected-route" : ""
                            }`}
                          >
                            {route.recommended && <span className="rec-ribbon">⭐ AI Recommended Route</span>}
                            <h4>{route.name}</h4>
                            <p className="route-via">{route.via}</p>

                            <div className="route-stats-row">
                              <div>
                                <small>Distance</small>
                                <strong>{route.distanceKm} km</strong>
                              </div>
                              <div>
                                <small>Travel Time</small>
                                <strong>{route.estimatedTime}</strong>
                              </div>
                              <div>
                                <small>Est. Total Cost</small>
                                <strong>₹{route.totalCost.toLocaleString("en-IN")}</strong>
                              </div>
                              <div>
                                <small>Score</small>
                                <strong className="score-num">{route.routeScore}/100</strong>
                              </div>
                            </div>

                            <div className="route-cost-breakdown">
                              <small>Cost Breakdown: Fuel ₹{route.fuelCost} + Toll ₹{route.tollCost} + Handling ₹{route.handlingCost}</small>
                            </div>

                            <p className="route-reason">💡 <em>{route.reason}</em></p>

                            <button
                              className="select-route-btn"
                              onClick={() => handleSelectTransporterAndRoute(selectedDelivery.transporterId || "trans_1", route.id)}
                            >
                              {selectedDelivery.selectedRoute?.id === route.id ? "✓ Selected Route" : "Choose This Route"}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* VISUAL MAP PROTOTYPE */}
                      <div className="route-map-prototype">
                        <div className="map-node pickup-node">
                          📍 <strong>Pickup: {selectedDelivery.pickupLocation}</strong>
                        </div>
                        <div className="map-line">
                          <span className="map-line-label">
                            🛣️ {selectedDelivery.selectedRoute?.name || "Route A"} ({selectedDelivery.estimatedDistance || 340} km)
                          </span>
                        </div>
                        <div className="map-node dest-node">
                          🏁 <strong>Destination: {selectedDelivery.destination}</strong>
                        </div>
                      </div>

                      {/* TRANSPORTER FREIGHT PAYMENT SECTION */}
                      <div style={{ marginTop: "24px", background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: "14px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "16px", color: "#166534", display: "flex", alignItems: "center", gap: "8px" }}>
                            💳 Transporter Freight Settlement
                          </h4>
                          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#15803D" }}>
                            Transporter: <strong>{selectedDelivery.transporterName || "Kongu Express Logistics"}</strong> • Freight Fee: <strong>₹{(selectedDelivery.transportCost || 18500).toLocaleString("en-IN")}</strong>
                          </p>
                        </div>

                        <button
                          className="primary-btn"
                          style={{ background: "#D97706", color: "#FFFFFF", padding: "10px 22px", fontWeight: "700", fontSize: "14px", borderRadius: "10px", border: "none", cursor: "pointer" }}
                          onClick={() => handlePayTransporterFreight(selectedDelivery._id)}
                        >
                          💳 Pay Freight ₹{(selectedDelivery.transportCost || 18500).toLocaleString("en-IN")} to Transporter
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ background: "#FEFCBF", border: "1px solid #F6E05E", borderRadius: "14px", padding: "16px", color: "#744210", fontSize: "13px", textAlign: "center", fontWeight: "600" }}>
                  💡 Select a Transporter above to unlock 🤖 AI Route Optimization & Multi-Route Comparison.
                </div>
              )}
            </>
          )}

        </div>
      ) : (
        <div className="empty-detail-state" style={{ padding: "30px", textAlign: "center", background: "#FFFFFF", borderRadius: "18px", border: "1px solid #E2E8F0" }}>
          <p>Select a shipment above to inspect delivery status, choose transporter & AI route details.</p>
        </div>
      )}

      {/* CREATE DELIVERY MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>📦 Schedule New Logistics Delivery</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateDelivery} className="create-delivery-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Crop Name</label>
                  <input
                    type="text"
                    value={createForm.crop}
                    onChange={(e) => setCreateForm({ ...createForm, crop: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Quantity (kg)</label>
                  <input
                    type="number"
                    value={createForm.quantity}
                    onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* AUTO-SUGGESTION BANNER */}
              <div className="auto-suggestion-box">
                💡 <strong>AI Vehicle Suggestion:</strong> Based on <em>{createForm.quantity} kg {createForm.crop}</em>, we recommend <strong>{suggestedVehicle}</strong> for safe transport.
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Pickup Location (Farm)</label>
                  <input
                    type="text"
                    value={createForm.pickupLocation}
                    onChange={(e) => setCreateForm({ ...createForm, pickupLocation: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Destination (Buyer / Market)</label>
                  <input
                    type="text"
                    value={createForm.destination}
                    onChange={(e) => setCreateForm({ ...createForm, destination: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select
                    value={createForm.vehicleType || suggestedVehicle}
                    onChange={(e) => setCreateForm({ ...createForm, vehicleType: e.target.value })}
                  >
                    <option value="Mini Truck">Mini Truck (Up to 1 Ton)</option>
                    <option value="Light Commercial Vehicle">Light Commercial Vehicle (1-3.5 Tons)</option>
                    <option value="Truck">Heavy Truck (3.5+ Tons)</option>
                    <option value="Refrigerated Truck">Refrigerated Truck (Cold Chain)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Delivery Priority</label>
                  <select
                    value={createForm.deliveryPriority}
                    onChange={(e) => setCreateForm({ ...createForm, deliveryPriority: e.target.value })}
                  >
                    <option value="Normal">Normal Standard</option>
                    <option value="Express">Express (Perishable Priority)</option>
                    <option value="Urgent">Urgent Overnight</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  🚀 Match Transport & Calculate AI Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticsModule;
