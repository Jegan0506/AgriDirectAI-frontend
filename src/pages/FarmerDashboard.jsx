import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LogisticsModule from "../components/LogisticsModule";
import { API_URL } from "../config";
import { useLanguage } from "../context/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";

function FarmerDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const addProduceFormRef = useRef(null);
  const receivedBidsRef = useRef(null);

  const scrollToPendingBids = () => {
    if (receivedBidsRef.current) {
      receivedBidsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  const [farmer, setFarmer] = useState(null);
  const [farmerId, setFarmerId] = useState(null);

  const [produceList, setProduceList] = useState([]);
  const [bids, setBids] = useState([]);

  const [showForm, setShowForm] = useState(false);

  const handleOpenAddProduce = () => {
    setShowForm(true);
    setEditingId(null);
    setForecast(null);
    setStatusMessage("");

    setTimeout(() => {
      if (addProduceFormRef.current) {
        addProduceFormRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 80);
  };
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forecastLoading, setForecastLoading] =
    useState(false);

  const [statusMessage, setStatusMessage] =
    useState("");

  const [forecast, setForecast] = useState(null);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [editProfile, setEditProfile] =
    useState(false);

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    location: "",
    farmName: ""
  });

  const [formData, setFormData] = useState({
    crop: "",
    quantity: "",
    quality: "",
    harvestDate: "",
    location: "",
    expectedPrice: "",
    photo: ""
  });

  const [marketCrop, setMarketCrop] =
    useState("");

  const [marketPrice, setMarketPrice] =
    useState("");

  /* NEGOTIATION */

  const [negotiatingBid, setNegotiatingBid] =
    useState(null);

  const [counterPrice, setCounterPrice] =
    useState("");

  const [negotiationMessage, setNegotiationMessage] =
    useState("");

  /* MODALS FOR COMPACT VIEWS */
  const [selectedProduce, setSelectedProduce] = useState(null);
  const [selectedBid, setSelectedBid] = useState(null);

  /* SHOW MORE / SHOW LESS STATES (MAX 2 BY DEFAULT) */
  const [showAllProduce, setShowAllProduce] = useState(false);
  const [showAllBids, setShowAllBids] = useState(false);

  /* ================================
     LOAD LOGGED-IN FARMER
  ================================= */

  useEffect(() => {
    const savedUser =
      localStorage.getItem(
        "UzhavarSetuUser"
      );

    if (!savedUser) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(savedUser);

      if (
        !user._id ||
        user.role !== "farmer"
      ) {
        localStorage.removeItem(
          "UzhavarSetuUser"
        );

        navigate("/login");
        return;
      }

      setFarmerId(user._id);

      loadFarmer(user._id);
      loadProduce(user._id);
      loadBids(user._id);
    } catch (error) {
      console.log(error);

      localStorage.removeItem(
        "UzhavarSetuUser"
      );

      navigate("/login");
    }
  }, []);

  /* ================================
     LOAD FARMER
  ================================= */

  const loadFarmer = async (
    loggedInFarmerId
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/api/farmers/${loggedInFarmerId}`
      );

      const data = await response.json();

      if (response.ok) {
        const currentFarmer =
          data.farmer || data;

        setFarmer(currentFarmer);
        setFarmerId(
          currentFarmer._id
        );

        setProfileForm({
          name:
            currentFarmer.name || "",
          phone:
            currentFarmer.phone || "",
          location:
            currentFarmer.location || "",
          farmName:
            currentFarmer.farmName || ""
        });
      } else {
        setStatusMessage(
          data.message ||
            "Unable to load farmer profile"
        );
      }
    } catch (error) {
      console.log(
        "Farmer error:",
        error
      );

      setStatusMessage(
        "Unable to load farmer profile"
      );
    }
  };

  /* ================================
     LOAD FARMER PRODUCE
  ================================= */

  const loadProduce = async (
    loggedInFarmerId = farmerId
  ) => {
    try {
      if (!loggedInFarmerId) {
        return;
      }

      const response = await fetch(
        `${API_URL}/api/produce`
      );

      const data = await response.json();

      if (response.ok) {
        const farmerProduce =
          data.filter(
            (item) =>
              String(
                item.farmerId
              ) ===
              String(
                loggedInFarmerId
              )
          );

        setProduceList(
          farmerProduce
        );
      }
    } catch (error) {
      console.log(error);

      setStatusMessage(
        "Unable to connect to backend"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================================
     LOAD FARMER BIDS
  ================================= */

  const loadBids = async (
    loggedInFarmerId = farmerId
  ) => {
    try {
      if (!loggedInFarmerId) {
        return;
      }

      const bidResponse =
        await fetch(
          `${API_URL}/api/bids`
        );

      const bidData =
        await bidResponse.json();

      if (!bidResponse.ok) {
        return;
      }

      const produceResponse =
        await fetch(
          `${API_URL}/api/produce`
        );

      const produceData =
        await produceResponse.json();

      if (!produceResponse.ok) {
        return;
      }

      const farmerProduce =
        produceData.filter(
          (item) =>
            String(
              item.farmerId
            ) ===
            String(
              loggedInFarmerId
            )
        );

      const farmerProduceIds =
        farmerProduce.map(
          (item) =>
            String(item._id)
        );

      const farmerBids =
        bidData.filter((bid) =>
          farmerProduceIds.includes(
            String(bid.produceId)
          )
        );

      setBids(farmerBids);
    } catch (error) {
      console.log(error);
    } finally {
      setBidLoading(false);
    }
  };

  /* ================================
     LOGOUT
  ================================= */

  const handleLogout = () => {
    localStorage.removeItem(
      "UzhavarSetuUser"
    );

    navigate("/login");
  };

  /* ================================
     FORM CHANGE
  ================================= */

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value
    });
  };

  /* ================================
     PROFILE CHANGE
  ================================= */

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]:
        e.target.value
    });
  };

  /* ================================
     PHOTO
  ================================= */

  const handlePhotoChange = (e) => {
    const file =
      e.target.files[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onloadend = () => {
      setFormData({
        ...formData,
        photo:
          reader.result
      });
    };

    reader.readAsDataURL(file);
  };

  /* ================================
     RESET PRODUCE FORM
  ================================= */

  const resetForm = () => {
    setFormData({
      crop: "",
      quantity: "",
      quality: "",
      harvestDate: "",
      location: "",
      expectedPrice: "",
      photo: ""
    });

    setEditingId(null);
    setShowForm(false);
    setForecast(null);
  };

  /* ================================
     ADD / UPDATE PRODUCE
  ================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!farmerId) {
      setStatusMessage(
        "Farmer account not found"
      );
      return;
    }

    setSaving(true);
    setStatusMessage("");

    try {
      const url = editingId
        ? `${API_URL}/api/produce/${editingId}`
        : `${API_URL}/api/produce`;

      const response = await fetch(
        url,
        {
          method: editingId
            ? "PUT"
            : "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            farmerId:
              farmerId,

            farmerName:
              farmer?.name || "",

            crop:
              formData.crop,

            quantity:
              Number(
                formData.quantity
              ),

            quality:
              formData.quality,

            harvestDate:
              formData.harvestDate,

            location:
              formData.location,

            expectedPrice:
              Number(
                formData.expectedPrice
              ),

            photo:
              formData.photo
          })
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setStatusMessage(
          editingId
            ? "Produce updated successfully"
            : "Produce added successfully"
        );

        resetForm();

        await loadProduce(
          farmerId
        );

        await loadBids(
          farmerId
        );
      } else {
        setStatusMessage(
          data.message ||
            "Failed to save produce"
        );
      }
    } catch (error) {
      console.log(error);

      setStatusMessage(
        "Unable to save produce"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ================================
     EDIT PRODUCE
  ================================= */

  const handleEdit = (item) => {
    setFormData({
      crop:
        item.crop || "",

      quantity:
        item.quantity || "",

      quality:
        item.quality || "",

      harvestDate:
        item.harvestDate || "",

      location:
        item.location || "",

      expectedPrice:
        item.expectedPrice || "",

      photo:
        item.photo || ""
    });

    setEditingId(
      item._id
    );

    setShowForm(true);
    setForecast(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  /* ================================
     DELETE PRODUCE
  ================================= */

  const handleDelete = async (
    id
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/api/produce/${id}`,
        {
          method: "DELETE"
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setStatusMessage(
          "Produce deleted successfully"
        );

        await loadProduce(
          farmerId
        );

        await loadBids(
          farmerId
        );
      } else {
        setStatusMessage(
          data.message ||
            "Failed to delete produce"
        );
      }
    } catch (error) {
      console.log(error);

      setStatusMessage(
        "Unable to delete produce"
      );
    }
  };

  /* ================================
     AI FORECAST
  ================================= */

  const handleForecast = async () => {
    if (
      !formData.crop ||
      !formData.quantity ||
      !formData.quality ||
      !formData.harvestDate ||
      !formData.location ||
      !formData.expectedPrice
    ) {
      setStatusMessage(
        "Fill all crop details before using AI Forecast"
      );

      return;
    }

    setForecastLoading(true);
    setForecast(null);
    setStatusMessage("");

    try {
      const response =
        await fetch(
          `${API_URL}/api/ai/forecast`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              crop:
                formData.crop,

              quantity:
                Number(
                  formData.quantity
                ),

              quality:
                formData.quality,

              harvestDate:
                formData.harvestDate,

              location:
                formData.location,

              expectedPrice:
                Number(
                  formData.expectedPrice
                )
            })
          }
        );

      const data =
        await response.json();

      if (
        response.ok &&
        data.success
      ) {
        setForecast(
          data.forecast
        );
      } else {
        setStatusMessage(
          data.message ||
            "AI forecast failed"
        );
      }
    } catch (error) {
      console.log(error);

      setStatusMessage(
        "Unable to connect to AI service"
      );
    } finally {
      setForecastLoading(false);
    }
  };

  /* ================================
     SAVE FARMER PROFILE
  ================================= */

  const handleSaveProfile =
    async () => {
      if (!farmerId) {
        setStatusMessage(
          "Farmer profile is not ready"
        );

        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/api/farmers/${farmerId}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                name:
                  profileForm.name,

                phone:
                  profileForm.phone,

                location:
                  profileForm.location,

                farmName:
                  profileForm.farmName
              })
            }
          );

        const data =
          await response.json();

        if (response.ok) {
          const updatedFarmer =
            data.farmer || data;

          setFarmer(
            updatedFarmer
          );

          setProfileForm({
            name:
              updatedFarmer.name ||
              "",

            phone:
              updatedFarmer.phone ||
              "",

            location:
              updatedFarmer.location ||
              "",

            farmName:
              updatedFarmer.farmName ||
              ""
          });

          const savedUser =
            localStorage.getItem(
              "UzhavarSetuUser"
            );

          if (savedUser) {
            const user =
              JSON.parse(
                savedUser
              );

            localStorage.setItem(
              "UzhavarSetuUser",
              JSON.stringify({
                ...user,
                ...updatedFarmer,
                role: "farmer"
              })
            );
          }

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
      }
    };

  /* ================================
     MARKET PRICE
  ================================= */

  const handleMarketPrice =
    () => {
      if (!marketCrop.trim()) {
        setMarketPrice("");

        setStatusMessage(
          "Enter a crop name"
        );

        return;
      }

      const crop =
        marketCrop
          .toLowerCase()
          .trim();

      const samplePrices = {
        tomato: 30,
        onion: 35,
        potato: 28,
        carrot: 45,
        cabbage: 25,
        brinjal: 32,
        banana: 42,
        rice: 38
      };

      const price =
        samplePrices[crop] ||
        30;

      setMarketPrice(
        price
      );

      setStatusMessage("");
    };

  /* ================================
     UPDATE BID STATUS
  ================================= */

  const updateBidStatus =
    async (
      bidId,
      status
    ) => {
      try {
        const response =
          await fetch(
            `${API_URL}/api/bids/${bidId}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                status,
                by: "Farmer"
              })
            }
          );

        const data =
          await response.json();

        if (response.ok) {
          setBids(
            (oldBids) =>
              oldBids.map(
                (bid) =>
                  bid._id === bidId
                    ? data.bid
                    : bid
              )
          );

          setStatusMessage(
            `Bid ${status.toLowerCase()} successfully`
          );
        } else {
          setStatusMessage(
            data.message ||
              "Failed to update bid"
          );
        }
      } catch (error) {
        console.log(error);

        setStatusMessage(
          "Unable to update bid"
        );
      }
    };

  /* ================================
     COUNTER OFFER
  ================================= */

  const handleCounterOffer =
    async () => {
      if (!negotiatingBid)
        return;

      if (
        !counterPrice ||
        Number(counterPrice) <=
          0
      ) {
        setStatusMessage(
          "Enter a valid counter offer price"
        );

        return;
      }

      if (
        Number(counterPrice) <=
        Number(
          negotiatingBid.bidPrice
        )
      ) {
        setStatusMessage(
          "Counter offer should be higher than the current bid"
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

                by: "Farmer"
              })
            }
          );

        const data =
          await response.json();

        if (response.ok) {
          setBids(
            (oldBids) =>
              oldBids.map(
                (bid) =>
                  bid._id ===
                  negotiatingBid._id
                    ? data.bid
                    : bid
              )
          );

          setStatusMessage(
            "Counter offer sent successfully"
          );

          setNegotiatingBid(
            null
          );

          setCounterPrice("");
          setNegotiationMessage(
            ""
          );
        } else {
          setStatusMessage(
            data.message ||
              "Failed to send counter offer"
          );
        }
      } catch (error) {
        console.log(error);

        setStatusMessage(
          "Unable to send counter offer"
        );
      }
    };

  /* ================================
     RECEIVED BIDS
  ================================= */

  const receivedBids =
    bids.filter((bid) =>
      produceList.some(
        (produce) =>
          String(
            produce._id
          ) ===
          String(
            bid.produceId
          )
      )
    );

  const displayedProduce = showAllProduce
    ? produceList
    : produceList.slice(0, 3);

  const activePendingBids = receivedBids.filter((bid) =>
    ["Pending", "Negotiation", "Counter Offer"].includes(bid.status) || bid.status === "Pending"
  );

  const previousBids = receivedBids.filter(
    (bid) => !["Pending", "Negotiation", "Counter Offer"].includes(bid.status) && bid.status !== "Pending"
  );

  const displayedPastBids = showAllBids
    ? previousBids
    : previousBids.slice(0, 3);

  /* ================================
     SUMMARY
  ================================= */

  const totalQuantity =
    produceList.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );

  const totalProduceValue =
    produceList.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ) *
          Number(
            item.expectedPrice ||
              0
          ),
      0
    );

  const totalEarnings =
    receivedBids
      .filter(
        (bid) =>
          bid.status ===
          "Accepted"
      )
      .reduce(
        (total, bid) =>
          total +
          Number(
            bid.quantity || 0
          ) *
            Number(
              bid.bidPrice || 0
            ),
        0
      );

  const pendingBids =
    receivedBids.filter(
      (bid) =>
        bid.status ===
        "Pending"
    ).length;

  const pendingBidValue =
    receivedBids
      .filter(
        (bid) =>
          bid.status ===
          "Pending"
      )
      .reduce(
        (total, bid) =>
          total +
          Number(
            bid.quantity || 0
          ) *
            Number(
              bid.bidPrice || 0
            ),
        0
      );

  return (
    <div className="dashboard-page">

      {/* HEADER + PROFILE */}

      <div className="dashboard-header">

        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src="/logo.png" alt="Logo" style={{ width: "38px", height: "38px", borderRadius: "8px", objectFit: "contain", background: "#fff", padding: "2px" }} />
            {t("appName")}
          </h1>

          <p>
            {t("farmerPortalSub")}
          </p>
        </div>

        <div className="profile-wrapper" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <LanguageSelector />
          <button
            className="profile-button"
            onClick={() => {
              setProfileOpen(
                !profileOpen
              );

              setEditProfile(
                false
              );
            }}
          >

            <div className="profile-avatar">
              👨‍🌾
            </div>

            <div className="profile-name">

              <strong>
                {farmer?.name ||
                  "Farmer"}
              </strong>

              <small>
                {farmer?.farmName ||
                  "My Farm"}
              </small>

            </div>

            <span>
              {profileOpen
                ? "▲"
                : "▼"}
            </span>

          </button>

          {profileOpen && (

            <div className="profile-dropdown">

              {!editProfile ? (

                <>

                  <div className="profile-top">

                    <div className="large-avatar">
                      👨‍🌾
                    </div>

                    <div>

                      <h3>
                        {farmer?.name ||
                          "Farmer"}
                      </h3>

                      <p>
                        {farmer?.farmName ||
                          "My Farm"}
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
                          {farmer?.phone ||
                            "Not added"}
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
                          {farmer?.location ||
                            "Not added"}
                        </p>

                      </div>

                    </div>

                    <div>

                      <span>
                        🌾
                      </span>

                      <div>

                        <small>
                          Farm Name
                        </small>

                        <p>
                          {farmer?.farmName ||
                            "My Farm"}
                        </p>

                      </div>

                    </div>

                  </div>

                  <button
                    className="edit-profile-btn"
                    onClick={() => navigate("/farmer-profile")}
                  >
                    ✏️ Edit Profile & Bank Details
                  </button>

                  <button
                    className="logout-btn"
                    onClick={
                      handleLogout
                    }
                  >
                    🚪 Logout
                  </button>

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
                    placeholder="Enter phone number"
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
                    placeholder="Enter location"
                  />

                  <label>
                    Farm Name
                  </label>

                  <input
                    type="text"
                    name="farmName"
                    value={
                      profileForm.farmName
                    }
                    onChange={
                      handleProfileChange
                    }
                    placeholder="My Farm"
                  />

                  <div className="edit-actions">

                    <button
                      className="save-profile-btn"
                      onClick={
                        handleSaveProfile
                      }
                    >
                      💾 Save Changes
                    </button>

                    <button
                      className="cancel-profile-btn"
                      onClick={() =>
                        setEditProfile(
                          false
                        )
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

      {/* STATUS */}

      {statusMessage && (

        <div className="status-message">
          {statusMessage}
        </div>

      )}

      {/* SUMMARY */}

      <div className="farmer-summary-grid">

        <div className="summary-card">

          <span>
            🌾 Listed Produce
          </span>

          <strong>
            {produceList.length}
          </strong>

          <small>
            Active listings
          </small>

        </div>

        <div className="summary-card">

          <span>
            📦 Total Quantity
          </span>

          <strong>
            {totalQuantity} kg
          </strong>

          <small>
            Available produce
          </small>

        </div>

        <div className="summary-card">

          <span>
            💰 Expected Value
          </span>

          <strong>
            ₹
            {totalProduceValue.toLocaleString(
              "en-IN"
            )}
          </strong>

          <small>
            Based on expected price
          </small>

        </div>

        <div
          className="summary-card"
          onClick={scrollToPendingBids}
          style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
          title="Click to jump to Received Bids"
        >

          <span>
            ⏳ Pending Bids
          </span>

          <strong>
            {pendingBids}
          </strong>

          <small style={{ color: "#2F5233", fontWeight: "600" }}>
            Waiting for response ↓
          </small>

        </div>

      </div>

      {/* ADD PRODUCE */}

      <div ref={addProduceFormRef} id="add-produce-form-section" className="farmer-section">

        <div className="section-header">

          <div>

            <h2>
              {t("addProduce")}
            </h2>

            <p>
              {t("addProduceDesc")}
            </p>

          </div>

          <button
            className="primary-btn"
            onClick={() => {
              if (showForm) {
                setShowForm(false);
              } else {
                handleOpenAddProduce();
              }
            }}
          >
            {showForm
              ? t("closeForm")
              : t("addProduceBtn")}
          </button>

        </div>

        {showForm && (

          <div className="produce-form-card">

            <h2>
              {editingId
                ? "✏️ Edit Produce"
                : "🌾 Add New Produce"}
            </h2>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-grid">

                <div>

                  <label>
                    Crop
                  </label>

                  <input
                    type="text"
                    name="crop"
                    value={
                      formData.crop
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Tomato"
                    required
                  />

                </div>

                <div>

                  <label>
                    Quantity (kg)
                  </label>

                  <input
                    type="number"
                    name="quantity"
                    value={
                      formData.quantity
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="500"
                    min="1"
                    required
                  />

                </div>

                <div>

                  <label>
                    Quality
                  </label>

                  <select
                    name="quality"
                    value={
                      formData.quality
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select Quality
                    </option>

                    <option value="Grade A">
                      Grade A
                    </option>

                    <option value="Grade B">
                      Grade B
                    </option>

                    <option value="Grade C">
                      Grade C
                    </option>

                  </select>

                </div>

                <div>

                  <label>
                    Harvest Date
                  </label>

                  <input
                    type="date"
                    name="harvestDate"
                    value={
                      formData.harvestDate
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div>

                  <label>
                    Location
                  </label>

                  <input
                    type="text"
                    name="location"
                    value={
                      formData.location
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Coimbatore"
                    required
                  />

                </div>

                <div>

                  <label>
                    Expected Price (₹/kg)
                  </label>

                  <input
                    type="number"
                    name="expectedPrice"
                    value={
                      formData.expectedPrice
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="28"
                    min="1"
                    required
                  />

                </div>

              </div>

              <div className="photo-upload">

                <label>
                  📷 Upload Produce Photo
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handlePhotoChange
                  }
                />

                {formData.photo && (

                  <div className="photo-preview">

                    <img
                      src={
                        formData.photo
                      }
                      alt="Produce preview"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          photo: ""
                        })
                      }
                    >
                      Remove Photo
                    </button>

                  </div>

                )}

              </div>

              <div className="form-actions">

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "💾 Update Produce"
                    : "🌾 Add Produce"}
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={
                    resetForm
                  }
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        )}

      </div>

      {/* MY PRODUCE */}

      <div className="my-produce-list">

        <div className="section-header">

          <div>

            <h2>
              {t("myProduceListings")}
            </h2>

            <p>
              {t("myProduceListingsDesc")}
            </p>

          </div>

        </div>

        {loading ? (

          <p>
            Loading produce...
          </p>

        ) : produceList.length ===
          0 ? (

          <div className="empty-state">

            <h3>
              No produce added yet
            </h3>

            <p>
              Add your first produce
              to start selling directly.
            </p>

          </div>

        ) : (
          <>
            <div className="compact-produce-grid">
              {displayedProduce.map((item) => (
                <div className="compact-produce-card" key={item._id}>
                  <div className="compact-card-header">
                    <div className="crop-title-group">
                      {item.photo ? (
                        <img src={item.photo} alt={item.crop} className="compact-thumb" />
                      ) : (
                        <span className="crop-icon-badge">🌾</span>
                      )}
                      <div>
                        <h3>{item.crop}</h3>
                        <p className="crop-qty-grade">{item.quantity} kg · {item.quality || "Grade A"}</p>
                      </div>
                    </div>
                    <span className="compact-status-tag">Active</span>
                  </div>

                  <div className="compact-card-body">
                    <div className="compact-meta-row">
                      <span>📍 {item.location || "Location not set"}</span>
                      <strong className="compact-price">₹{item.expectedPrice}/kg</strong>
                    </div>
                  </div>

                  <button
                    className="view-details-btn"
                    onClick={() => setSelectedProduce(item)}
                  >
                    🔍 View Details
                  </button>
                </div>
              ))}
            </div>

            {produceList.length > 3 && (
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <button
                  className="secondary-btn"
                  onClick={() => setShowAllProduce(!showAllProduce)}
                  style={{ padding: "10px 22px", fontSize: "14px", borderRadius: "10px", fontWeight: "600" }}
                >
                  {showAllProduce
                    ? "▲ Show Less Produce"
                    : `▼ View More Produce (${produceList.length - 3} more)`}
                </button>
              </div>
            )}
          </>
        )}

      </div>

      {/* AI FORECAST */}

      <div className="farmer-section">

        <div className="section-header">

          <div>

            <h2>
              {t("aiPriceForecast")}
            </h2>

            <p>
              Get AI-powered price forecast & recommendations
            </p>

          </div>

        </div>

        <div className="produce-form-card">

          <div className="form-grid">

            <div>

              <label>
                Crop
              </label>

              <input
                type="text"
                value={
                  formData.crop
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    crop:
                      e.target.value
                  })
                }
                placeholder="Tomato"
              />

            </div>

            <div>

              <label>
                Quantity (kg)
              </label>

              <input
                type="number"
                value={
                  formData.quantity
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity:
                      e.target.value
                  })
                }
                placeholder="500"
              />

            </div>

            <div>

              <label>
                Quality
              </label>

              <select
                value={
                  formData.quality
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quality:
                      e.target.value
                  })
                }
              >

                <option value="">
                  Select Quality
                </option>

                <option value="Grade A">
                  Grade A
                </option>

                <option value="Grade B">
                  Grade B
                </option>

                <option value="Grade C">
                  Grade C
                </option>

              </select>

            </div>

            <div>

              <label>
                Harvest Date
              </label>

              <input
                type="date"
                value={
                  formData.harvestDate
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    harvestDate:
                      e.target.value
                  })
                }
              />

            </div>

            <div>

              <label>
                Location
              </label>

              <input
                type="text"
                value={
                  formData.location
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location:
                      e.target.value
                  })
                }
                placeholder="Coimbatore"
              />

            </div>

            <div>

              <label>
                Expected Price (₹/kg)
              </label>

              <input
                type="number"
                value={
                  formData.expectedPrice
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expectedPrice:
                      e.target.value
                  })
                }
                placeholder="28"
              />

            </div>

          </div>

          <div className="form-actions">

            <button
              className="ai-btn"
              onClick={
                handleForecast
              }
              disabled={
                forecastLoading
              }
            >
              {forecastLoading
                ? "🤖 Analyzing..."
                : "🤖 Analyze with AI"}
            </button>

          </div>

        </div>

        {forecast && (

          <div className="forecast-card">

            <div className="forecast-header">

              <div>

                <h3>
                  🤖 UzhavarSetu AI Forecast
                </h3>

                <p>
                  AI-powered selling
                  recommendation
                </p>

              </div>

              <span>
                {
                  forecast.confidence
                }%
                Confidence
              </span>

            </div>

            <div className="forecast-grid">

              <div>

                <small>
                  Predicted Price
                </small>

                <strong>
                  ₹
                  {
                    forecast.predictedPrice
                  }
                  /kg
                </strong>

              </div>

              <div>

                <small>
                  Recommended Price
                </small>

                <strong>
                  ₹
                  {
                    forecast.recommendedPrice
                  }
                  /kg
                </strong>

              </div>

              <div>

                <small>
                  Demand
                </small>

                <strong>
                  {
                    forecast.demand
                  }
                </strong>

              </div>

              <div>

                <small>
                  Recommendation
                </small>

                <strong>
                  {
                    forecast.recommendation
                  }
                </strong>

              </div>

            </div>

            <div className="forecast-reason">

              <strong>
                Why?
              </strong>

              <p>
                {
                  forecast.reason
                }
              </p>

            </div>

            <div className="forecast-action">

              <strong>
                💡 Action
              </strong>

              <p>
                {
                  forecast.action
                }
              </p>

            </div>

          </div>

        )}

      </div>

      {/* MARKET PRICE */}

      <div className="market-price-section">

        <div className="section-header">

          <div>

            <h2>
              📊 Market Price
            </h2>

            <p>
              Check indicative market prices
            </p>

          </div>

        </div>

        <div className="market-price-form">

          <input
            type="text"
            value={
              marketCrop
            }
            onChange={(e) =>
              setMarketCrop(
                e.target.value
              )
            }
            placeholder="Enter crop name"
          />

          <input
            type="text"
            value="₹ / kg"
            readOnly
          />

          <button
            className="primary-btn"
            onClick={
              handleMarketPrice
            }
          >
            🔍 Check Price
          </button>

        </div>

        {marketPrice && (

          <div className="market-price-result">

            <span>
              Indicative price for{" "}
              {marketCrop}
            </span>

            <strong>
              ₹
              {marketPrice}
              /kg
            </strong>

            <small>
              Market price may vary by
              location, quality and demand.
            </small>

          </div>

        )}

      </div>

      {/* MONEY */}

      <div className="money-section">

        <div className="section-header">

          <div>

            <h2>
              💰 Money
            </h2>

            <p>
              Track your produce and
              bid values
            </p>

          </div>

        </div>

        <div className="money-grid">

          <div className="money-card">

            <span>
              💵 Accepted Bid Earnings
            </span>

            <strong>
              ₹
              {totalEarnings.toLocaleString(
                "en-IN"
              )}
            </strong>

            <small>
              Accepted buyer bids
            </small>

          </div>

          <div className="money-card">

            <span>
              🌾 Listed Produce Value
            </span>

            <strong>
              ₹
              {totalProduceValue.toLocaleString(
                "en-IN"
              )}
            </strong>

            <small>
              Based on expected price
            </small>

          </div>

          <div className="money-card">

            <span>
              ⏳ Pending Bid Value
            </span>

            <strong>
              ₹
              {pendingBidValue.toLocaleString(
                "en-IN"
              )}
            </strong>

            <small>
              Waiting for your decision
            </small>

          </div>

        </div>

      </div>

      {/* RECEIVED BIDS */}
      <div ref={receivedBidsRef} id="received-bids-section" className="received-bids-section">

        {/* SECTION 1: ACTIVE PENDING BIDS */}
        <div style={{ marginBottom: "32px" }}>
          <div className="received-bids-header" style={{ marginBottom: "16px" }}>
            <div>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                ⏳ Pending Bids
              </h2>
              <p style={{ margin: "4px 0 0 0" }}>
                Action required — Buyers waiting for your approval
              </p>
            </div>

            <span className="bid-count" style={{ background: activePendingBids.length > 0 ? "#FEE2E2" : "#E2E8F0", color: activePendingBids.length > 0 ? "#991B1B" : "#475569" }}>
              {activePendingBids.length} Pending
            </span>
          </div>

          {bidLoading ? (
            <p>Loading bids...</p>
          ) : activePendingBids.length === 0 ? (
            <div style={{ background: "#F0FDF4", border: "1px dashed #86EFAC", padding: "16px 20px", borderRadius: "12px", color: "#166534", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>✓</span> No pending bids waiting for your decision right now.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {activePendingBids.map((bid) => (
                <div className="bid-card" key={bid._id} style={{ borderLeft: "5px solid #E53E3E", background: "#FFFFFF", padding: "18px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #E2E8F0", borderLeftWidth: "5px" }}>
                  <div className="bid-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div className="bid-crop-info" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "24px" }}>🌾</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "18px", color: "#1A202C" }}>{bid.crop} — {bid.quantity} kg</h3>
                        <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#4A5568" }}>Buyer: <strong>{bid.buyerName || "Buyer"}</strong></p>
                      </div>
                    </div>
                    <span className={`bid-status ${bid.status.toLowerCase().replace(" ", "-")}`}>
                      {bid.status}
                    </span>
                  </div>

                  <div className="bid-details" style={{ display: "flex", gap: "24px", background: "#F7FAFC", padding: "12px 16px", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "14px" }}>
                    <div>
                      <span style={{ fontSize: "12px", color: "#718096", display: "block" }}>Offered Price</span>
                      <strong style={{ fontSize: "18px", color: "#2F5233" }}>₹{bid.bidPrice}/kg</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "12px", color: "#718096", display: "block" }}>Total Order Value</span>
                      <strong style={{ fontSize: "18px", color: "#1A202C" }}>₹{(bid.quantity * bid.bidPrice).toLocaleString("en-IN")}</strong>
                    </div>
                  </div>

                  {bid.status === "Pending" && (
                    <div className="bid-actions" style={{ display: "flex", gap: "10px" }}>
                      <button
                        className="accept-bid-btn"
                        onClick={() => updateBidStatus(bid._id, "Accepted")}
                        style={{ padding: "8px 18px", fontSize: "13px", fontWeight: "700" }}
                      >
                        ✓ Accept Bid
                      </button>
                      <button
                        className="reject-bid-btn"
                        onClick={() => updateBidStatus(bid._id, "Rejected")}
                        style={{ padding: "8px 18px", fontSize: "13px" }}
                      >
                        ✕ Reject
                      </button>
                      <button
                        className="negotiate-bid-btn"
                        onClick={() => {
                          setNegotiatingBid(bid);
                          setCounterPrice(bid.bidPrice);
                          setNegotiationMessage("");
                        }}
                        style={{ padding: "8px 18px", fontSize: "13px" }}
                      >
                        💬 Counter Offer
                      </button>
                    </div>
                  )}

                  {bid.status === "Counter Offer" && (
                    <div style={{ background: "#EDF2F7", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
                      <strong>Your Counter Offer: ₹{bid.counterOfferPrice}/kg</strong>
                      {bid.negotiationMessage && <p style={{ margin: "4px 0 0", color: "#4A5568" }}>💬 "{bid.negotiationMessage}"</p>}
                      <small style={{ color: "#718096", display: "block", marginTop: "4px" }}>Waiting for buyer response...</small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: PREVIOUS BIDS HISTORY */}
        <div style={{ paddingTop: "20px", borderTop: "1px dashed #CBD5E0" }}>
          <div className="received-bids-header" style={{ marginBottom: "16px" }}>
            <div>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                📜 Previous Bids History
              </h2>
              <p style={{ margin: "4px 0 0 0" }}>
                History of accepted and rejected buyer bids
              </p>
            </div>
            <span className="bid-count" style={{ background: "#E2E8F0", color: "#475569" }}>
              {previousBids.length} Total History
            </span>
          </div>

          {bidLoading ? (
            <p>Loading history...</p>
          ) : previousBids.length === 0 ? (
            <div className="no-bids" style={{ padding: "20px" }}>
              <p>No previous bids history yet.</p>
            </div>
          ) : (
            <>
              <div className="compact-bids-grid">
                {displayedPastBids.map((bid) => (
                  <div className="compact-bid-card" key={bid._id}>
                    <div className="compact-bid-top">
                      <div className="compact-bid-crop-info">
                        <span className="compact-bid-icon">🌾</span>
                        <div>
                          <h3>{bid.crop} — {bid.quantity} kg</h3>
                          <p className="compact-buyer-name">Buyer: <strong>{bid.buyerName || "Buyer"}</strong></p>
                        </div>
                      </div>
                      <span className={`bid-status ${bid.status.toLowerCase().replace(" ", "-")}`}>
                        {bid.status}
                      </span>
                    </div>

                    <div className="compact-bid-middle">
                      <div className="compact-bid-stat">
                        <small>Offered Bid</small>
                        <strong>₹{bid.bidPrice}/kg</strong>
                      </div>
                      <div className="compact-bid-stat">
                        <small>Total Bid Value</small>
                        <strong>₹{(bid.quantity * bid.bidPrice).toLocaleString("en-IN")}</strong>
                      </div>
                    </div>

                    <button
                      className="view-bid-details-btn"
                      onClick={() => setSelectedBid(bid)}
                    >
                      📄 View Bid Details
                    </button>
                  </div>
                ))}
              </div>

              {previousBids.length > 3 && (
                <div style={{ textAlign: "center", marginTop: "16px" }}>
                  <button
                    className="secondary-btn"
                    onClick={() => setShowAllBids(!showAllBids)}
                    style={{ padding: "10px 22px", fontSize: "14px", borderRadius: "10px", fontWeight: "600" }}
                  >
                    {showAllBids
                      ? "▲ Show Less Bids"
                      : `▼ View More Bids (${previousBids.length - 3} more)`}
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
                  💬 Negotiate Bid
                </h3>

                <p>
                  Discuss a better price
                  with{" "}
                  {
                    negotiatingBid.buyerName
                  }
                </p>

              </div>

              <button
                className="close-btn"
                onClick={() => {

                  setNegotiatingBid(
                    null
                  );

                  setCounterPrice(
                    ""
                  );

                  setNegotiationMessage(
                    ""
                  );

                }}
              >
                ×
              </button>

            </div>

            <div className="negotiation-details">

              <div>

                <span>
                  Crop
                </span>

                <strong>
                  🌾{" "}
                  {
                    negotiatingBid.crop
                  }
                </strong>

              </div>

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
                  Current Bid
                </span>

                <strong>
                  ₹
                  {
                    negotiatingBid.bidPrice
                  }
                  /kg
                </strong>

              </div>

            </div>

            <div className="negotiation-form">

              <label>
                Your Counter Offer (₹/kg)
              </label>

              <input
                type="number"
                value={
                  counterPrice
                }
                onChange={(e) =>
                  setCounterPrice(
                    e.target.value
                  )
                }
                placeholder="Example: 40"
                min="1"
              />

              <label>
                Message
              </label>

              <textarea
                value={
                  negotiationMessage
                }
                onChange={(e) =>
                  setNegotiationMessage(
                    e.target.value
                  )
                }
                placeholder="Example: Your bid is low. Please increase the price."
                rows="3"
              />

              <div className="negotiation-actions">

                <button
                  className="secondary-btn"
                  onClick={() => {

                    setNegotiatingBid(
                      null
                    );

                    setCounterPrice(
                      ""
                    );

                    setNegotiationMessage(
                      ""
                    );

                  }}
                >
                  Cancel
                </button>

                <button
                  className="negotiate-bid-btn"
                  onClick={
                    handleCounterOffer
                  }
                >
                  💬 Send Counter Offer
                </button>

              </div>

            </div>

          </div>

        )}

        {/* PRODUCE DETAILS MODAL */}
        {selectedProduce && (
          <div className="modal-overlay" onClick={() => setSelectedProduce(null)}>
            <div className="modal-card detail-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>🌾 {selectedProduce.crop} Details</h2>
                  <p className="modal-subtitle">Full produce listing details</p>
                </div>
                <button className="close-btn" onClick={() => setSelectedProduce(null)}>✕</button>
              </div>

              <div className="modal-body">
                {selectedProduce.photo && (
                  <div className="modal-photo-wrapper">
                    <img src={selectedProduce.photo} alt={selectedProduce.crop} className="modal-produce-photo" />
                  </div>
                )}

                <div className="details-grid">
                  <div className="detail-item">
                    <small>Crop Name</small>
                    <strong>{selectedProduce.crop}</strong>
                  </div>
                  <div className="detail-item">
                    <small>Quantity</small>
                    <strong>{selectedProduce.quantity} kg</strong>
                  </div>
                  <div className="detail-item">
                    <small>Quality / Grade</small>
                    <strong>{selectedProduce.quality || "Grade A"}</strong>
                  </div>
                  <div className="detail-item">
                    <small>Harvest Date</small>
                    <strong>{selectedProduce.harvestDate}</strong>
                  </div>
                  <div className="detail-item">
                    <small>Location</small>
                    <strong>📍 {selectedProduce.location}</strong>
                  </div>
                  <div className="detail-item">
                    <small>Expected Price</small>
                    <strong>₹{selectedProduce.expectedPrice}/kg</strong>
                  </div>
                  <div className="detail-item">
                    <small>Total Estimated Value</small>
                    <strong className="highlight-green">₹{(Number(selectedProduce.quantity || 0) * Number(selectedProduce.expectedPrice || 0)).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="detail-item">
                    <small>Listing Status</small>
                    <span className="compact-status-tag">Active</span>
                  </div>
                  {selectedProduce.createdAt && (
                    <div className="detail-item">
                      <small>Listed Date</small>
                      <strong>{new Date(selectedProduce.createdAt).toLocaleDateString()}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer-actions">
                <button
                  className="secondary-btn"
                  onClick={() => {
                    const itemToEdit = selectedProduce;
                    setSelectedProduce(null);
                    handleEdit(itemToEdit);
                  }}
                >
                  ✏️ Edit Produce
                </button>
                <button
                  className="danger-btn"
                  onClick={() => {
                    const idToDelete = selectedProduce._id;
                    setSelectedProduce(null);
                    handleDelete(idToDelete);
                  }}
                >
                  🗑️ Delete Produce
                </button>
                <button
                  className="close-modal-btn"
                  onClick={() => setSelectedProduce(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BID DETAILS MODAL */}
        {selectedBid && (
          <div className="modal-overlay" onClick={() => setSelectedBid(null)}>
            <div className="modal-card detail-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>💰 Bid Details — {selectedBid.crop}</h2>
                  <p className="modal-subtitle">Buyer offer & negotiation information</p>
                </div>
                <button className="close-btn" onClick={() => setSelectedBid(null)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="details-grid">
                  <div className="detail-item">
                    <small>Produce Crop</small>
                    <strong>🌾 {selectedBid.crop}</strong>
                  </div>
                  <div className="detail-item">
                    <small>Quantity</small>
                    <strong>{selectedBid.quantity} kg</strong>
                  </div>
                  <div className="detail-item">
                    <small>Buyer Name</small>
                    <strong>👨‍💼 {selectedBid.buyerName || "Buyer"}</strong>
                  </div>
                  {selectedBid.buyerLocation && (
                    <div className="detail-item">
                      <small>Buyer Location</small>
                      <strong>📍 {selectedBid.buyerLocation}</strong>
                    </div>
                  )}
                  <div className="detail-item">
                    <small>Offered Price</small>
                    <strong>₹{selectedBid.bidPrice}/kg</strong>
                  </div>
                  <div className="detail-item">
                    <small>Total Bid Amount</small>
                    <strong className="highlight-green" style={{ fontSize: '18px' }}>
                      ₹{(Number(selectedBid.quantity || 0) * Number(selectedBid.bidPrice || 0)).toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div className="detail-item">
                    <small>Bid Status</small>
                    <span className={`bid-status ${selectedBid.status.toLowerCase().replace(" ", "-")}`}>
                      {selectedBid.status}
                    </span>
                  </div>
                  {selectedBid.createdAt && (
                    <div className="detail-item">
                      <small>Bid Date</small>
                      <strong>{new Date(selectedBid.createdAt).toLocaleDateString()}</strong>
                    </div>
                  )}
                </div>

                {/* Counter Offer Info */}
                {selectedBid.status === "Counter Offer" && (
                  <div className="counter-offer-info" style={{ marginTop: '16px' }}>
                    <strong>💬 Counter Offer Sent</strong>
                    <p>Your counter offer: <strong>₹{selectedBid.counterOfferPrice}/kg</strong></p>
                    {selectedBid.negotiationMessage && (
                      <p>"{selectedBid.negotiationMessage}"</p>
                    )}
                    <small>Waiting for buyer response.</small>
                  </div>
                )}

                {/* Negotiation History */}
                {selectedBid.negotiationHistory && selectedBid.negotiationHistory.length > 0 && (
                  <div className="negotiation-history" style={{ marginTop: '16px' }}>
                    <strong>💬 Negotiation History</strong>
                    {selectedBid.negotiationHistory.map((history, index) => (
                      <div key={index} className="history-item">
                        <span>{history.by === "Farmer" ? "👨‍🌾 Farmer" : "👨‍💼 Buyer"}</span>
                        <strong>₹{history.price}/kg</strong>
                        {history.message && <small>{history.message}</small>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer-actions">
                {selectedBid.status === "Pending" && (
                  <>
                    <button
                      className="accept-bid-btn"
                      onClick={() => {
                        const bId = selectedBid._id;
                        updateBidStatus(bId, "Accepted");
                        setSelectedBid((prev) => prev ? { ...prev, status: "Accepted" } : null);
                      }}
                    >
                      ✓ Accept Bid
                    </button>
                    <button
                      className="reject-bid-btn"
                      onClick={() => {
                        const bId = selectedBid._id;
                        updateBidStatus(bId, "Rejected");
                        setSelectedBid((prev) => prev ? { ...prev, status: "Rejected" } : null);
                      }}
                    >
                      ✕ Reject Bid
                    </button>
                    <button
                      className="negotiate-bid-btn"
                      onClick={() => {
                        const bidToNegotiate = selectedBid;
                        setSelectedBid(null);
                        setNegotiatingBid(bidToNegotiate);
                        setCounterPrice(bidToNegotiate.bidPrice);
                        setNegotiationMessage("");
                      }}
                    >
                      💬 Negotiate
                    </button>
                  </>
                )}
                <button
                  className="close-modal-btn"
                  onClick={() => setSelectedBid(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOGISTICS & AI ROUTE OPTIMIZATION MODULE */}
        <div style={{ marginTop: "35px" }}>
          <LogisticsModule userRole="farmer" userId={farmer?._id} />
        </div>

      </div>

    </div>
  );
}

export default FarmerDashboard;