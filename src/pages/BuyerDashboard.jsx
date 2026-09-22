import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LogisticsModule from "../components/LogisticsModule";
import { API_URL } from "../config";

function BuyerDashboard() {
  const navigate = useNavigate();
  const bidFormRef = useRef(null);

  const [buyer, setBuyer] = useState(null);
  const [produceList, setProduceList] = useState([]);
  const [myBids, setMyBids] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("UzhavarSetuUser");
    navigate("/login");
  };

  const [searchCrop, setSearchCrop] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const [profileOpen, setProfileOpen] = useState(false);
  const [editProfile, setEditProfile] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedProduce, setSelectedProduce] =
    useState(null);

  const [bidForm, setBidForm] = useState({
    quantity: "",
    bidPrice: ""
  });

  const [bidSubmitting, setBidSubmitting] =
    useState(false);

  const [negotiatingBid, setNegotiatingBid] =
    useState(null);

  const [counterPrice, setCounterPrice] =
    useState("");

  const [negotiationMessage, setNegotiationMessage] =
    useState("");

  const [profileForm, setProfileForm] =
    useState({
      name: "",
      businessName: "",
      phone: "",
      location: "",
      buyerType: "",
      interestedCrops: ""
    });

  const [showAllBuyerBids, setShowAllBuyerBids] = useState(false);

  /* DEMO PAYMENT MODAL STATES */
  const [activePayBidModal, setActivePayBidModal] = useState(null);
  const [activeReceiptModal, setActiveReceiptModal] = useState(null);

  const [payMethod, setPayMethod] = useState("Bank Account");
  const [payProcessing, setPayProcessing] = useState(false);
  const [payError, setPayError] = useState("");

  const [bankPayForm, setBankPayForm] = useState({
    accountHolder: "",
    accountNumber: "",
    confirmAccount: "",
    ifsc: ""
  });

  const [upiPayForm, setUpiPayForm] = useState({
    upiId: ""
  });

  const submitDemoPayment = async (bid) => {
    setPayError("");

    if (payMethod === "Bank Account") {
      if (!bankPayForm.accountHolder.trim()) {
        setPayError("Please enter Account Holder Name");
        return;
      }
      if (!bankPayForm.accountNumber.trim() || !/^\d{8,18}$/.test(bankPayForm.accountNumber.trim())) {
        setPayError("Please enter a valid numeric account number (8-18 digits)");
        return;
      }
      if (bankPayForm.accountNumber.trim() !== bankPayForm.confirmAccount.trim()) {
        setPayError("Account Number and Confirm Account Number do not match");
        return;
      }
      if (!bankPayForm.ifsc.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(bankPayForm.ifsc.trim())) {
        setPayError("Please enter a valid IFSC Code (e.g. SBIN0001234)");
        return;
      }
    } else {
      if (!upiPayForm.upiId.trim() || !upiPayForm.upiId.includes("@")) {
        setPayError("Please enter a valid UPI ID (e.g. buyer@upi)");
        return;
      }
    }

    setPayProcessing(true);

    setTimeout(async () => {
      let paidBidObj = null;

      try {
        const res = await fetch(`${API_URL}/api/bids/${bid._id}/pay`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethod: payMethod,
            accountHolder: bankPayForm.accountHolder,
            bankAccount: bankPayForm.accountNumber,
            ifsc: bankPayForm.ifsc,
            upiId: upiPayForm.upiId
          })
        });

        const data = await res.json();
        if (res.ok) {
          const updatedBid = data.bid || {};
          paidBidObj = {
            ...bid,
            ...updatedBid,
            isPaid: true,
            paid: true,
            paymentStatus: "Paid",
            transactionId: data.payment?.transactionId || updatedBid.transactionId
          };
          setMyBids((old) => old.map((b) => (b._id === bid._id ? paidBidObj : b)));
          setStatusMessage("✓ Demo Payment Successful! No real money was transferred.");
        } else {
          setPayError(data.message || "Demo payment failed");
        }
      } catch (err) {
        console.log("Pay API fallback:", err);
        const dateStr = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
        const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
        const txnId = `UZS-DEMO-${dateStr}-${randomHex}`;
        const masked = payMethod === "Bank Account" ? "•••• " + bankPayForm.accountNumber.slice(-4) : upiPayForm.upiId;

        paidBidObj = {
          ...bid,
          isPaid: true,
          paid: true,
          paymentStatus: "Paid",
          transactionId: txnId,
          paymentMethod: payMethod,
          paymentDate: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          isDemoPayment: true,
          produceAmount: Number(bid.quantity) * Number(bid.bidPrice),
          transportFreight: 18500,
          totalAmount: Number(bid.quantity) * Number(bid.bidPrice) + 18500,
          farmerSettlementStatus: "Released",
          transporterSettlementStatus: "Released",
          maskedAccount: masked
        };

        setMyBids((old) => old.map((b) => (b._id === bid._id ? paidBidObj : b)));
        setStatusMessage("✓ Demo Payment Successful! No real money was transferred.");
      } finally {
        setPayProcessing(false);
        setActivePayBidModal(null);
        if (paidBidObj) {
          // Auto trigger AI Transporter Match for this location & quantity
          try {
            await fetch(`${API_URL}/api/logistics`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                produceId: bid.produceId || (bid.produce && bid.produce._id),
                bidId: bid._id,
                farmerId: bid.farmerId,
                buyerId: buyer?._id || bid.buyerId,
                farmerName: bid.farmerName || "Farmer",
                buyerName: buyer?.name || bid.buyerName || "Buyer",
                crop: bid.crop,
                quantity: Number(bid.quantity),
                pickupLocation: bid.location || bid.produceLocation || bid.farmerLocation || "Coimbatore",
                destination: buyer?.location || "Chennai",
                deliveryPriority: "Normal",
                status: "Finding Transport"
              })
            });
          } catch (logErr) {
            console.log("Logistics auto-match error:", logErr);
          }

          setActiveReceiptModal(paidBidObj);
        }
        setTimeout(() => setStatusMessage(""), 4000);
      }
    }, 1500);
  };

  useEffect(() => {
    loadBuyerData();
    loadProduce();
  }, []);

  useEffect(() => {
    if (buyer?._id) {
      loadMyBids(buyer._id);
    }
  }, [buyer]);

  const loadBuyerData = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/buyers`
      );

      const data = await response.json();

      if (
        response.ok &&
        data.length > 0
      ) {
        const currentBuyer = data[0];

        setBuyer(currentBuyer);

        setProfileForm({
          name: currentBuyer.name || "",
          businessName:
            currentBuyer.businessName || "",
          phone: currentBuyer.phone || "",
          location:
            currentBuyer.location || "",
          buyerType:
            currentBuyer.buyerType || "",
          interestedCrops:
            currentBuyer.interestedCrops?.join(
              ", "
            ) || ""
        });
      } else {
        setStatusMessage(
          "Buyer profile not found"
        );
      }
    } catch (error) {
      console.log(
        "Buyer error:",
        error
      );

      setStatusMessage(
        "Unable to load buyer profile"
      );
    }
  };

  const loadProduce = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/produce`
      );

      const data = await response.json();

      if (response.ok) {
        setProduceList(data);
      }
    } catch (error) {
      console.log(
        "Produce error:",
        error
      );

      setStatusMessage(
        "Unable to connect to backend"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMyBids = async (
    buyerId
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/api/bids`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch bids"
        );
      }

      const buyerBids = data.filter(
        (bid) =>
          String(bid.buyerId) ===
          String(buyerId)
      );

      setMyBids(buyerBids);
    } catch (error) {
      console.log(
        "My bids error:",
        error
      );

      setStatusMessage(
        "Unable to load your bids"
      );
    }
  };

  const sortedBuyerBids = [...myBids].sort((a, b) => {
    const aActive = (a.status === "Pending" || a.status === "Counter Offer" || a.status === "Accepted") && !a.isPaid;
    const bActive = (b.status === "Pending" || b.status === "Counter Offer" || b.status === "Accepted") && !b.isPaid;
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return 0;
  });

  const displayedBuyerBids = showAllBuyerBids
    ? sortedBuyerBids
    : sortedBuyerBids.slice(0, 3);

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]:
        e.target.value
    });
  };

  const handleSaveProfile = async () => {
    if (!buyer) return;

    setSaving(true);
    setStatusMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/buyers/${buyer._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            name: profileForm.name,
            businessName:
              profileForm.businessName,
            phone: profileForm.phone,
            location:
              profileForm.location,
            buyerType:
              profileForm.buyerType,
            interestedCrops:
              profileForm.interestedCrops
                .split(",")
                .map(
                  (crop) =>
                    crop.trim()
                )
                .filter(Boolean)
          })
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setBuyer(data.buyer);
        setEditProfile(false);

        setStatusMessage(
          "Profile updated successfully"
        );
      } else {
        setStatusMessage(
          data.message ||
            "Failed to update profile"
        );
      }
    } catch (error) {
      console.log(
        "Profile update error:",
        error
      );

      setStatusMessage(
        "Unable to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBidChange = (e) => {
    setBidForm({
      ...bidForm,
      [e.target.name]:
        e.target.value
    });
  };

  const openBidForm = (item) => {
    setSelectedProduce(item);

    setBidForm({
      quantity: item.quantity,
      bidPrice: item.expectedPrice
    });

    setStatusMessage("");

    setTimeout(() => {
      if (bidFormRef.current) {
        bidFormRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 80);
  };

  const handlePayOrder = (bidId) => {
    setMyBids(myBids.map((b) => (b._id === bidId ? { ...b, paid: true } : b)));
    setStatusMessage("Demo Payment Successful! Produce & Transport settlements allocated.");
    setTimeout(() => setStatusMessage(""), 3500);
  };

  const closeBidForm = () => {
    setSelectedProduce(null);

    setBidForm({
      quantity: "",
      bidPrice: ""
    });
  };

  const handlePlaceBid = async () => {
    if (!buyer || !selectedProduce) {
      return;
    }

    if (
      !bidForm.quantity ||
      !bidForm.bidPrice
    ) {
      setStatusMessage(
        "Please enter quantity and bid price"
      );

      return;
    }

    if (
      Number(bidForm.quantity) <= 0 ||
      Number(bidForm.bidPrice) <= 0
    ) {
      setStatusMessage(
        "Quantity and bid price must be greater than 0"
      );

      return;
    }

    if (
      Number(bidForm.quantity) >
      Number(selectedProduce.quantity)
    ) {
      setStatusMessage(
        `Maximum available quantity is ${selectedProduce.quantity} kg`
      );

      return;
    }

    setBidSubmitting(true);
    setStatusMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/bids`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            produceId:
              selectedProduce._id,
            buyerId: buyer._id,
            buyerName: buyer.name,
            crop:
              selectedProduce.crop,
            quantity:
              Number(
                bidForm.quantity
              ),
            bidPrice:
              Number(
                bidForm.bidPrice
              )
          })
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setStatusMessage(
          `Bid placed successfully for ${selectedProduce.crop}`
        );

        closeBidForm();

        loadMyBids(buyer._id);
      } else {
        setStatusMessage(
          data.message ||
            "Failed to place bid"
        );
      }
    } catch (error) {
      console.log(
        "Place bid error:",
        error
      );

      setStatusMessage(
        "Unable to place bid. Check backend."
      );
    } finally {
      setBidSubmitting(false);
    }
  };

  const handleBuyerBidAction = async (
    bid,
    status
  ) => {
    try {
      setStatusMessage("");

      const response = await fetch(
        `${API_URL}/api/bids/${bid._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            status,
            negotiationMessage:
              status === "Accepted"
                ? "Buyer accepted the offer"
                : "Buyer rejected the offer",
            by: "Buyer"
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update bid"
        );
      }

      setStatusMessage(
        status === "Accepted"
          ? "Offer accepted successfully"
          : "Offer rejected successfully"
      );

      loadMyBids(buyer._id);
    } catch (error) {
      console.log(
        "Bid action error:",
        error
      );

      setStatusMessage(
        error.message ||
          "Failed to update bid"
      );
    }
  };

  const openBuyerCounterOffer = (
    bid
  ) => {
    setNegotiatingBid(bid);

    setCounterPrice(
      bid.bidPrice
    );

    setNegotiationMessage("");

    setStatusMessage("");
  };

  const closeNegotiation = () => {
    setNegotiatingBid(null);
    setCounterPrice("");
    setNegotiationMessage("");
  };

  const handleBuyerCounterOffer =
    async () => {
      if (!negotiatingBid) return;

      if (
        !counterPrice ||
        Number(counterPrice) <= 0
      ) {
        setStatusMessage(
          "Enter a valid counter offer price"
        );

        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/api/bids/${negotiatingBid._id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body: JSON.stringify({
                status:
                  "Counter Offer",
                counterOfferPrice:
                  Number(
                    counterPrice
                  ),
                negotiationMessage,
                by: "Buyer"
              })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to send counter offer"
          );
        }

        setStatusMessage(
          "Counter offer sent successfully"
        );

        closeNegotiation();

        loadMyBids(buyer._id);
      } catch (error) {
        console.log(
          "Counter offer error:",
          error
        );

        setStatusMessage(
          error.message ||
            "Failed to send counter offer"
        );
      }
    };

  const filteredProduce =
    produceList.filter(
      (item) =>
        item.crop
          .toLowerCase()
          .includes(
            searchCrop.toLowerCase()
          )
    );

  return (
    <div className="dashboard-page">

      <div className="buyer-header">

        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src="/logo.png" alt="Logo" style={{ width: "38px", height: "38px", borderRadius: "8px", objectFit: "contain", background: "#fff", padding: "2px" }} />
            UzhavarSetu
          </h1>

          <p>
            Buyer Dashboard
          </p>
        </div>

        <div className="profile-wrapper">

          <button
            className="profile-button"
            onClick={() => {
              setProfileOpen(
                !profileOpen
              );

              setEditProfile(false);
            }}
          >

            <div className="profile-avatar">
              👤
            </div>

            <div className="profile-name">

              <strong>
                {buyer?.name ||
                  "Buyer"}
              </strong>

              <small>
                {buyer?.businessName ||
                  "Business"}
              </small>

            </div>

            <span className="profile-arrow">
              {profileOpen
                ? "▲"
                : "▼"}
            </span>

          </button>

          {profileOpen &&
            buyer && (

              <div className="profile-dropdown">

                {!editProfile ? (

                  <>

                    <div className="profile-top">

                      <div className="large-avatar">
                        👤
                      </div>

                      <div>

                        <h3>
                          {buyer.name}
                        </h3>

                        <p>
                          {
                            buyer.businessName
                          }
                        </p>

                      </div>

                    </div>

                    <div className="profile-divider" />

                    <div className="profile-info">

                      <div>

                        <span>
                          📞
                        </span>

                        <div>

                          <small>
                            Phone
                          </small>

                          <p>
                            {
                              buyer.phone
                            }
                          </p>

                        </div>

                      </div>

                      <div>

                        <span>
                          📍
                        </span>

                        <div>

                          <small>
                            Location
                          </small>

                          <p>
                            {
                              buyer.location
                            }
                          </p>

                        </div>

                      </div>

                      <div>

                        <span>
                          🏷️
                        </span>

                        <div>

                          <small>
                            Buyer Type
                          </small>

                          <p>
                            {
                              buyer.buyerType
                            }
                          </p>

                        </div>

                      </div>

                      <div>

                        <span>
                          🌾
                        </span>

                        <div>

                          <small>
                            Interested Crops
                          </small>

                          <div className="crop-tags">

                            {buyer.interestedCrops?.map(
                              (
                                crop,
                                index
                              ) => (

                                <span
                                  key={
                                    index
                                  }
                                  className="crop-tag"
                                >
                                  {crop}
                                </span>

                              )
                            )}

                          </div>

                        </div>

                      </div>

                    </div>

                    <div className="profile-actions-group" style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                      <button
                        className="edit-profile-btn"
                        style={{ flex: 1, margin: 0 }}
                        onClick={() => navigate("/buyer-profile")}
                      >
                        ✏️ Edit Profile & Payment Details
                      </button>
                      <button
                        className="logout-btn"
                        onClick={handleLogout}
                        style={{
                          flex: 1,
                          background: "#fff1f2",
                          color: "#e11d48",
                          border: "1px solid #fecdd3",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          fontWeight: "600",
                          fontSize: "14px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        🚪 Logout
                      </button>
                    </div>

                  </>

                ) : (

                  <div className="edit-profile-form">

                    <h3>
                      ✏️ Edit Profile
                    </h3>

                    <label>
                      Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={
                        profileForm.name
                      }
                      onChange={
                        handleProfileChange
                      }
                    />

                    <label>
                      Business Name
                    </label>

                    <input
                      type="text"
                      name="businessName"
                      value={
                        profileForm.businessName
                      }
                      onChange={
                        handleProfileChange
                      }
                    />

                    <label>
                      Phone
                    </label>

                    <input
                      type="text"
                      name="phone"
                      value={
                        profileForm.phone
                      }
                      onChange={
                        handleProfileChange
                      }
                    />

                    <label>
                      Location
                    </label>

                    <input
                      type="text"
                      name="location"
                      value={
                        profileForm.location
                      }
                      onChange={
                        handleProfileChange
                      }
                    />

                    <label>
                      Buyer Type
                    </label>

                    <select
                      name="buyerType"
                      value={
                        profileForm.buyerType
                      }
                      onChange={
                        handleProfileChange
                      }
                    >

                      <option value="Retailer">
                        Retailer
                      </option>

                      <option value="Wholesaler">
                        Wholesaler
                      </option>

                      <option value="Processor">
                        Processor
                      </option>

                      <option value="Exporter">
                        Exporter
                      </option>

                      <option value="Restaurant">
                        Restaurant
                      </option>

                    </select>

                    <label>
                      Interested Crops
                    </label>

                    <input
                      type="text"
                      name="interestedCrops"
                      value={
                        profileForm.interestedCrops
                      }
                      onChange={
                        handleProfileChange
                      }
                      placeholder="Tomato, Onion"
                    />

                    <div className="edit-actions">

                      <button
                        className="save-profile-btn"
                        onClick={
                          handleSaveProfile
                        }
                        disabled={
                          saving
                        }
                      >
                        {saving
                          ? "Saving..."
                          : "💾 Save Changes"}
                      </button>

                      <button
                        className="cancel-profile-btn"
                        onClick={() =>
                          setEditProfile(
                            false
                          )
                        }
                        disabled={
                          saving
                        }
                      >
                        Cancel
                      </button>

                    </div>

                  </div>

                )}

              </div>

            )}

        </div>

      </div>

      {statusMessage && (
        <div className="status-message">
          {statusMessage}
        </div>
      )}

      <div className="farmer-search-card">

        <div className="farmer-search-header">

          <div>

            <span className="search-icon">
              🔍
            </span>

            <div>

              <h2>
                Find Farmer Produce
              </h2>

              <p>
                Discover fresh produce directly from farmers
              </p>

            </div>

          </div>

        </div>

        <div className="search-box-wrapper">

          <span>
            🔍
          </span>

          <input
            type="text"
            placeholder="Search by crop name..."
            value={searchCrop}
            onChange={(e) =>
              setSearchCrop(
                e.target.value
              )
            }
          />

          {searchCrop && (

            <button
              className="clear-search"
              onClick={() =>
                setSearchCrop("")
              }
            >
              ✕
            </button>

          )}

        </div>

      </div>

      <div className="my-produce-list">

        <h2>
          🌾 Available Produce
        </h2>

        {loading ? (

          <p>
            Loading produce...
          </p>

        ) : filteredProduce.length ===
          0 ? (

          <p>
            No matching produce available.
          </p>

        ) : (

          filteredProduce.map(
            (item) => (

              <div
                className="produce-item"
                key={item._id}
              >

                {item.photo && (

                  <img
                    src={item.photo}
                    alt={item.crop}
                    className="produce-photo"
                  />

                )}

                <div>

                  <h3>
                    🌾 {item.crop}
                  </h3>

                  <p>
                    📦 {item.quantity} kg
                  </p>

                  <p>
                    ⭐ {item.quality}
                  </p>

                </div>

                <div>

                  <p>
                    📍 {item.location}
                  </p>

                  <p>
                    📅 Harvest:{" "}
                    {
                      item.harvestDate
                    }
                  </p>

                  <strong>
                    💰 ₹
                    {
                      item.expectedPrice
                    }
                    /kg
                  </strong>

                </div>

                <div className="produce-actions">

                  <button
                    className="primary-btn"
                    onClick={() =>
                      openBidForm(item)
                    }
                  >
                    💰 Place Bid
                  </button>

                </div>

              </div>

            )
          )

        )}

      </div>

      {selectedProduce && (

        <div ref={bidFormRef} id="bid-form-card" className="bid-form-card">

          <div className="bid-form-header">

            <div>

              <h2>
                💰 Place Bid
              </h2>

              <p>
                {
                  selectedProduce.crop
                }{" "}
                •{" "}
                {
                  selectedProduce.location
                }
              </p>

            </div>

            <button
              className="bid-close-btn"
              onClick={
                closeBidForm
              }
            >
              ✕
            </button>

          </div>

          <div className="bid-produce-summary">

            <div>

              <span>
                Available Quantity
              </span>

              <strong>
                {
                  selectedProduce.quantity
                }{" "}
                kg
              </strong>

            </div>

            <div>

              <span>
                Farmer Expected Price
              </span>

              <strong>
                ₹
                {
                  selectedProduce.expectedPrice
                }
                /kg
              </strong>

            </div>

          </div>

          <div className="bid-fields">

            <div>

              <label>
                Quantity to Buy (kg)
              </label>

              <input
                type="number"
                name="quantity"
                min="1"
                max={
                  selectedProduce.quantity
                }
                value={
                  bidForm.quantity
                }
                onChange={
                  handleBidChange
                }
                placeholder="Enter quantity"
              />

            </div>

            <div>

              <label>
                Your Bid Price (₹/kg)
              </label>

              <input
                type="number"
                name="bidPrice"
                min="1"
                value={
                  bidForm.bidPrice
                }
                onChange={
                  handleBidChange
                }
                placeholder="Enter price per kg"
              />

            </div>

          </div>

          <div className="bid-total">

            <span>
              Total Bid Value
            </span>

            <strong>
              ₹
              {(
                Number(
                  bidForm.quantity ||
                    0
                ) *
                Number(
                  bidForm.bidPrice ||
                    0
                )
              ).toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>

          <div className="bid-actions">

            <button
              className="cancel-profile-btn"
              onClick={
                closeBidForm
              }
              disabled={
                bidSubmitting
              }
            >
              Cancel
            </button>

            <button
              className="save-profile-btn"
              onClick={
                handlePlaceBid
              }
              disabled={
                bidSubmitting
              }
            >
              {bidSubmitting
                ? "Placing Bid..."
                : "💰 Submit Bid"}
            </button>

          </div>

        </div>

      )}

      <div className="my-bids-section">
        <h2>💰 My Bids</h2>

        {myBids.length === 0 ? (
          <p>
            You haven't placed any bids yet.
          </p>
        ) : (
          <>
            {displayedBuyerBids.map((bid) => (
              <div
                className="bid-card"
                key={bid._id}
              >
                <div className="bid-card-header">
                  <div>
                    <h3>
                      🌾 {bid.crop}
                    </h3>
                    <p>
                      📦{" "}
                      {bid.quantity}{" "}
                      kg
                    </p>
                  </div>
                  <span
                    className={`bid-status ${
                      bid.status
                        ?.toLowerCase()
                        .replace(
                          /\s+/g,
                          "-"
                        )
                    }`}
                  >
                    {bid.status}
                  </span>
                </div>

                <div className="bid-info">
                  <div>
                    <span>
                      Your Current Offer
                    </span>
                    <strong>
                      ₹
                      {
                        bid.bidPrice
                      }
                      /kg
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total Value
                    </span>
                    <strong>
                      ₹
                      {(
                        Number(
                          bid.quantity
                        ) *
                        Number(
                          bid.bidPrice
                        )
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>
                </div>

                {bid.status ===
                  "Pending" && (
                  <div className="buyer-pending-info">
                    <p>
                      ⏳ Waiting for farmer response
                    </p>
                  </div>
                )}

                {bid.status ===
                  "Counter Offer" && (
                  <div className="buyer-counter-info">
                    <h4>
                      🔄 Farmer Counter Offer
                    </h4>

                    <p>
                      Farmer's offer:{" "}
                      <strong>
                        ₹
                        {
                          bid.counterOfferPrice
                        }
                        /kg
                      </strong>
                    </p>

                    {bid.negotiationMessage && (
                      <p>
                        💬{" "}
                        {
                          bid.negotiationMessage
                        }
                      </p>
                    )}

                    <div className="bid-actions">
                      <button
                        className="accept-bid-btn"
                        onClick={() =>
                          handleBuyerBidAction(
                            bid,
                            "Accepted"
                          )
                        }
                      >
                        ✓ Accept Offer
                      </button>

                      <button
                        className="reject-bid-btn"
                        onClick={() =>
                          handleBuyerBidAction(
                            bid,
                            "Rejected"
                          )
                        }
                      >
                        ✕ Reject
                      </button>

                      <button
                        className="negotiate-bid-btn"
                        onClick={() =>
                          openBuyerCounterOffer(
                            bid
                          )
                        }
                      >
                        💬 Counter Offer
                      </button>
                    </div>
                  </div>
                )}

                {bid.status === "Accepted" && (
                  <>
                    {!(bid.isPaid || bid.paid) ? (
                      <div style={{ marginTop: "14px", borderTop: "1px dashed #E4EBE5", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="status-badge status-in-transit" style={{ fontSize: "12px", padding: "6px 12px" }}>
                          Payment Pending
                        </span>
                        <button
                          className="primary-btn"
                          style={{ background: "#3F7D4A", color: "#ffffff", fontWeight: "700", padding: "10px 18px", borderRadius: "10px", fontSize: "14px", cursor: "pointer", border: "none" }}
                          onClick={() => {
                            setActivePayBidModal(bid);
                            setPayError("");
                          }}
                        >
                          💳 Pay Farmer ₹{(Number(bid.quantity) * Number(bid.bidPrice)).toLocaleString("en-IN")}
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginTop: "14px", borderTop: "1px dashed #E4EBE5", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="compact-status-tag" style={{ background: "#dcfce7", color: "#15803d", fontWeight: "700", fontSize: "12px", padding: "6px 12px" }}>
                          ✓ Produce Paid
                        </span>
                        <button
                          className="view-bid-details-btn"
                          style={{ width: "auto", padding: "8px 16px", fontSize: "13px" }}
                          onClick={() => setActiveReceiptModal(bid)}
                        >
                          📄 Payment Details
                        </button>
                      </div>
                    )}
                  </>
                )}

                {bid.status ===
                  "Rejected" && (
                  <div className="bid-rejected-info">
                    ✕ This bid was rejected
                  </div>
                )}
              </div>
            ))}

            {myBids.length > 3 && (
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <button
                  className="secondary-btn"
                  onClick={() => setShowAllBuyerBids(!showAllBuyerBids)}
                  style={{ padding: "10px 22px", fontSize: "14px", borderRadius: "10px", fontWeight: "600" }}
                >
                  {showAllBuyerBids
                    ? "▲ Show Less Bids"
                    : `▼ View More Bids (${myBids.length - 3} more)`}
                </button>
              </div>
            )}
          </>
        )}

      </div>

      {negotiatingBid && (

        <div className="negotiation-card">

          <div className="negotiation-header">

            <div>

              <h3>
                💬 Counter Offer
              </h3>

              <p>
                {
                  negotiatingBid.crop
                }
              </p>

            </div>

            <button
              className="close-btn"
              onClick={
                closeNegotiation
              }
            >
              ×
            </button>

          </div>

          <div className="negotiation-details">

            <div>

              <span>
                Quantity
              </span>

              <strong>
                {
                  negotiatingBid.quantity
                }{" "}
                kg
              </strong>

            </div>

            <div>

              <span>
                Farmer Offer
              </span>

              <strong>
                ₹
                {
                  negotiatingBid.bidPrice
                }
                /kg
              </strong>

            </div>

            <div>

              <span>
                Current Total
              </span>

              <strong>
                ₹
                {(
                  Number(
                    negotiatingBid.quantity
                  ) *
                  Number(
                    negotiatingBid.bidPrice
                  )
                ).toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

          </div>

          <div className="negotiation-form">

            <label>
              Your Counter Offer (₹/kg)
            </label>

            <input
              type="number"
              min="1"
              value={
                counterPrice
              }
              onChange={(e) =>
                setCounterPrice(
                  e.target.value
                )
              }
              placeholder="Enter your price"
            />

            <label>
              Message
            </label>

            <textarea
              rows="3"
              value={
                negotiationMessage
              }
              onChange={(e) =>
                setNegotiationMessage(
                  e.target.value
                )
              }
              placeholder="Add a message to farmer..."
            />

            <div className="negotiation-actions">

              <button
                className="cancel-profile-btn"
                onClick={
                  closeNegotiation
                }
              >
                Cancel
              </button>

              <button
                className="save-profile-btn"
                onClick={
                  handleBuyerCounterOffer
                }
              >
                💬 Send Counter Offer
              </button>

            </div>

          </div>

        </div>

      )}

      {/* LOGISTICS & SHIPMENT TRACKING MODULE */}
      <div style={{ marginTop: "35px" }}>
        <LogisticsModule userRole="buyer" userId={buyer?._id} />
      </div>

      {/* DEDICATED PAYMENT MODAL */}
      {activePayBidModal && (
        <div className="modal-overlay" onClick={() => setActivePayBidModal(null)}>
          <div className="modal-card" style={{ maxWidth: "560px", padding: "28px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                💳 Order Payment Checkout
              </h3>
              <button className="close-btn" onClick={() => setActivePayBidModal(null)}>×</button>
            </div>

            <div style={{ background: "#F5F8F5", borderRadius: "12px", padding: "16px", marginBottom: "20px", border: "1px solid #E1E8E2" }}>
              <div style={{ fontSize: "14px", color: "#4A5568", marginBottom: "6px" }}>
                Produce: <strong>{activePayBidModal.crop} ({activePayBidModal.quantity} kg)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#2D3748", margin: "6px 0" }}>
                <span>Produce Price ({activePayBidModal.quantity} kg × ₹{activePayBidModal.bidPrice}):</span>
                <strong style={{ fontSize: "16px", color: "#2F5233" }}>₹{(Number(activePayBidModal.quantity) * Number(activePayBidModal.bidPrice)).toLocaleString("en-IN")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#718096", margin: "6px 0", paddingTop: "6px", borderTop: "1px dashed #E2E8F0" }}>
                <span>Transport Freight (Shipping):</span>
                <em>Payable separately to Transporter below in Smart Logistics</em>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "800", color: "#2F5233", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #CBD5E0" }}>
                <span>Total Amount Payable to Farmer:</span>
                <span>₹{(Number(activePayBidModal.quantity) * Number(activePayBidModal.bidPrice)).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "#2D3748", display: "block", marginBottom: "8px" }}>
                Select Payment Method
              </label>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: payMethod === "Bank Account" ? "2px solid #2F5233" : "1px solid #CBD5E0",
                    background: payMethod === "Bank Account" ? "#E8F5E9" : "#FFFFFF",
                    fontWeight: payMethod === "Bank Account" ? "700" : "500",
                    color: payMethod === "Bank Account" ? "#2F5233" : "#4A5568",
                    cursor: "pointer"
                  }}
                  onClick={() => setPayMethod("Bank Account")}
                >
                  🏦 Bank Account Transfer
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: payMethod === "UPI" ? "2px solid #2F5233" : "1px solid #CBD5E0",
                    background: payMethod === "UPI" ? "#E8F5E9" : "#FFFFFF",
                    fontWeight: payMethod === "UPI" ? "700" : "500",
                    color: payMethod === "UPI" ? "#2F5233" : "#4A5568",
                    cursor: "pointer"
                  }}
                  onClick={() => setPayMethod("UPI")}
                >
                  📱 UPI / QR Payment
                </button>
              </div>
            </div>

            {payMethod === "Bank Account" ? (
              <div style={{ display: "grid", gap: "12px", marginBottom: "18px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#4A5568" }}>Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={bankPayForm.accountHolder}
                    onChange={(e) => setBankPayForm({ ...bankPayForm, accountHolder: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #CBD5E0", marginTop: "4px", fontSize: "14px" }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#4A5568" }}>Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 987654321012"
                      value={bankPayForm.accountNumber}
                      onChange={(e) => setBankPayForm({ ...bankPayForm, accountNumber: e.target.value })}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #CBD5E0", marginTop: "4px", fontSize: "14px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#4A5568" }}>Confirm Account No.</label>
                    <input
                      type="text"
                      placeholder="Re-enter account no."
                      value={bankPayForm.confirmAccount}
                      onChange={(e) => setBankPayForm({ ...bankPayForm, confirmAccount: e.target.value })}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #CBD5E0", marginTop: "4px", fontSize: "14px" }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#4A5568" }}>IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SBIN0001234"
                    value={bankPayForm.ifsc}
                    onChange={(e) => setBankPayForm({ ...bankPayForm, ifsc: e.target.value.toUpperCase() })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #CBD5E0", marginTop: "4px", fontSize: "14px" }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: "18px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#4A5568" }}>UPI ID (VPA)</label>
                <input
                  type="text"
                  placeholder="e.g. buyer@paytm or 9876543210@upi"
                  value={upiPayForm.upiId}
                  onChange={(e) => setUpiPayForm({ upiId: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #CBD5E0", marginTop: "4px", fontSize: "14px" }}
                />
              </div>
            )}

            {payError && (
              <div style={{ color: "#E53E3E", background: "#FFF5F5", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", border: "1px solid #FEB2B2" }}>
                ⚠️ {payError}
              </div>
            )}

            <div style={{ background: "#FEFCBF", border: "1px solid #F6E05E", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#744210", marginBottom: "18px" }}>
              ℹ️ Demo Payment System — Simulated transaction. No real money will be transferred.
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button className="secondary-btn" onClick={() => setActivePayBidModal(null)} disabled={payProcessing}>
                Cancel
              </button>
              <button
                className="save-profile-btn"
                style={{ minWidth: "160px" }}
                onClick={() => submitDemoPayment(activePayBidModal)}
                disabled={payProcessing}
              >
                {payProcessing ? "🔄 Processing Payment..." : `🔒 Pay Farmer ₹${(Number(activePayBidModal.quantity) * Number(activePayBidModal.bidPrice)).toLocaleString("en-IN")}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED PAYMENT RECEIPT MODAL */}
      {activeReceiptModal && (
        <div className="modal-overlay" onClick={() => setActiveReceiptModal(null)}>
          <div className="modal-card" style={{ maxWidth: "680px", padding: "28px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#1A202C", display: "flex", alignItems: "center", gap: "8px" }}>
                  💳 Produce Payment Details (Order #{activeReceiptModal.orderId || activeReceiptModal._id?.slice(-8).toUpperCase() || "ORD-DEMO"})
                </h3>
                <span style={{ fontSize: "13px", color: "#718096" }}>Farmer Settlement Paid • Transport freight payable separately below</span>
              </div>
              <button className="close-btn" onClick={() => setActiveReceiptModal(null)}>×</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#F7FAFC", padding: "14px", borderRadius: "10px", marginBottom: "18px", border: "1px solid #E2E8F0" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#718096", display: "block" }}>Produce Quantity</span>
                <strong style={{ fontSize: "16px", color: "#2D3748" }}>{activeReceiptModal.crop} ({activeReceiptModal.quantity} kg)</strong>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#718096", display: "block" }}>Amount Paid to Farmer</span>
                <strong style={{ fontSize: "18px", color: "#2F5233" }}>₹{(Number(activeReceiptModal.quantity) * Number(activeReceiptModal.bidPrice)).toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "12px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "10px", borderBottom: "1px dashed #86EFAC" }}>
                <div>
                  <h4 style={{ margin: 0, color: "#166534", fontSize: "16px" }}>✓ Payment Completed</h4>
                  <span style={{ fontSize: "12px", color: "#15803D" }}>Demo Payment — No real money was transferred.</span>
                </div>
                <span className="compact-status-tag" style={{ background: "#166534", color: "#FFFFFF", fontWeight: "700" }}>
                  DEMO PAID
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", color: "#374151" }}>
                <div>
                  <span style={{ color: "#6B7280" }}>Transaction ID: </span>
                  <strong style={{ fontFamily: "monospace", color: "#111827" }}>{activeReceiptModal.transactionId || `UZS-DEMO-${Date.now()}`}</strong>
                </div>
                <div>
                  <span style={{ color: "#6B7280" }}>Order ID: </span>
                  <strong>{activeReceiptModal.orderId || activeReceiptModal._id?.slice(-8).toUpperCase() || "ORD-DEMO"}</strong>
                </div>
                <div>
                  <span style={{ color: "#6B7280" }}>Amount Paid: </span>
                  <strong style={{ color: "#166534" }}>₹{(Number(activeReceiptModal.quantity) * Number(activeReceiptModal.bidPrice) + 6500).toLocaleString("en-IN")}</strong>
                </div>
                <div>
                  <span style={{ color: "#6B7280" }}>Payment Method: </span>
                  <strong>{activeReceiptModal.paymentMethod || "Bank Account Transfer"}</strong>
                </div>
                <div>
                  <span style={{ color: "#6B7280" }}>Payment Status: </span>
                  <strong style={{ color: "#166534" }}>Paid (Demo Mode)</strong>
                </div>
                <div>
                  <span style={{ color: "#6B7280" }}>Date / Time: </span>
                  <strong>{activeReceiptModal.paymentDate || new Date().toLocaleString("en-IN")}</strong>
                </div>
              </div>

              <div style={{ background: "#FFFFFF", borderRadius: "8px", padding: "12px", marginTop: "14px", border: "1px solid #DCFCE7", fontSize: "12px" }}>
                <span style={{ fontWeight: "700", color: "#166534", display: "block", marginBottom: "4px" }}>Simulated Settlement Allocation:</span>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#374151" }}>
                  <span>🌾 Farmer Settlement: <strong>₹{(Number(activeReceiptModal.quantity) * Number(activeReceiptModal.bidPrice)).toLocaleString("en-IN")}</strong> (Payment Released)</span>
                  <span>🚛 Transporter Freight: <strong>₹{(activeReceiptModal.transportFreight || 18500).toLocaleString("en-IN")}</strong> (Freight Released)</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button className="primary-btn" onClick={() => setActiveReceiptModal(null)} style={{ padding: "10px 24px" }}>
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuyerDashboard;