import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function FarmerDashboard() {
  const API_URL = "https://agridirectai-backend.onrender.com";
  const navigate = useNavigate();

  const [farmer, setFarmer] = useState(null);
  const [farmerId, setFarmerId] = useState(null);

  const [produceList, setProduceList] = useState([]);
  const [bids, setBids] = useState([]);

  const [showForm, setShowForm] = useState(false);
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

  /* ================================
     LOAD LOGGED-IN FARMER
  ================================= */

  useEffect(() => {
    const savedUser =
      localStorage.getItem(
        "agriDirectUser"
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
          "agriDirectUser"
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
        "agriDirectUser"
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
      "agriDirectUser"
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
              "agriDirectUser"
            );

          if (savedUser) {
            const user =
              JSON.parse(
                savedUser
              );

            localStorage.setItem(
              "agriDirectUser",
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
          <h1>
            🌾 AgriDirect AI
          </h1>

          <p>
            Farmer Dashboard
          </p>
        </div>

        <div className="profile-wrapper">

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
                    onClick={() => {

                      setProfileForm({
                        name:
                          farmer?.name ||
                          "",

                        phone:
                          farmer?.phone ||
                          "",

                        location:
                          farmer?.location ||
                          "",

                        farmName:
                          farmer?.farmName ||
                          ""
                      });

                      setEditProfile(
                        true
                      );
                    }}
                  >
                    ✏️ Edit Profile
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

        <div className="summary-card">

          <span>
            ⏳ Pending Bids
          </span>

          <strong>
            {pendingBids}
          </strong>

          <small>
            Waiting for response
          </small>

        </div>

      </div>

      {/* ADD PRODUCE */}

      <div className="farmer-section">

        <div className="section-header">

          <div>

            <h2>
              🌾 Add Produce
            </h2>

            <p>
              List your crops directly
              for buyers
            </p>

          </div>

          <button
            className="primary-btn"
            onClick={() => {

              setShowForm(
                !showForm
              );

              setEditingId(
                null
              );

              setForecast(
                null
              );

              setStatusMessage("");

            }}
          >
            {showForm
              ? "✕ Close"
              : "＋ Add Produce"}
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
              🌾 My Produce
            </h2>

            <p>
              Your currently listed crops
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

          produceList.map(
            (item) => (

              <div
                className="produce-item"
                key={
                  item._id
                }
              >

                {item.photo && (

                  <img
                    src={
                      item.photo
                    }
                    alt={
                      item.crop
                    }
                    className="produce-photo"
                  />

                )}

                <div className="produce-info">

                  <h3>
                    🌾{" "}
                    {item.crop}
                  </h3>

                  <p>
                    📦{" "}
                    {item.quantity}{" "}
                    kg
                  </p>

                  <p>
                    ⭐{" "}
                    {item.quality}
                  </p>

                </div>

                <div className="produce-info">

                  <p>
                    📍{" "}
                    {item.location}
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
                    className="secondary-btn"
                    onClick={() =>
                      handleEdit(
                        item
                      )
                    }
                  >
                    ✏️ Edit
                  </button>

                  <button
                    className="danger-btn"
                    onClick={() =>
                      handleDelete(
                        item._id
                      )
                    }
                  >
                    🗑️ Delete
                  </button>

                </div>

              </div>

            )
          )

        )}

      </div>

      {/* AI FORECAST */}

      <div className="farmer-section">

        <div className="section-header">

          <div>

            <h2>
              🤖 AI Forecast
            </h2>

            <p>
              Get AI-powered selling
              recommendations
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
                  🤖 AgriDirect AI Forecast
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

      <div className="received-bids-section">

        <div className="received-bids-header">

          <div>

            <h2>
              💰 Received Bids
            </h2>

            <p>
              Buyers interested in
              your produce
            </p>

          </div>

          <span className="bid-count">
            {pendingBids} Pending
          </span>

        </div>

        {bidLoading ? (

          <p>
            Loading bids...
          </p>

        ) : receivedBids.length ===
          0 ? (

          <div className="no-bids">

            <div className="no-bids-icon">
              💰
            </div>

            <h3>
              No bids yet
            </h3>

            <p>
              Buyer bids will appear
              here when someone places
              a bid on your produce.
            </p>

          </div>

        ) : (

          <div className="bids-list">

            {receivedBids.map(
              (bid) => (

                <div
                  className="bid-card"
                  key={
                    bid._id
                  }
                >

                  <div className="bid-main">

                    <div className="bid-crop">

                      <div className="bid-crop-icon">
                        🌾
                      </div>

                      <div>

                        <h3>
                          {
                            bid.crop
                          }
                        </h3>

                        <p>
                          Buyer:{" "}
                          {
                            bid.buyerName
                          }
                        </p>

                      </div>

                    </div>

                    <span
                      className={`bid-status ${bid.status
                        .toLowerCase()
                        .replace(
                          " ",
                          "-"
                        )}`}
                    >
                      {
                        bid.status
                      }
                    </span>

                  </div>

                  <div className="bid-details">

                    <div>

                      <small>
                        Quantity
                      </small>

                      <strong>
                        {
                          bid.quantity
                        }{" "}
                        kg
                      </strong>

                    </div>

                    <div>

                      <small>
                        Current Bid
                      </small>

                      <strong>
                        ₹
                        {
                          bid.bidPrice
                        }
                        /kg
                      </strong>

                    </div>

                    <div>

                      <small>
                        Total Value
                      </small>

                      <strong>
                        ₹
                        {(
                          bid.quantity *
                          bid.bidPrice
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>

                  </div>

                  {bid.negotiationHistory &&
                    bid
                      .negotiationHistory
                      .length >
                      0 && (

                      <div className="negotiation-history">

                        <strong>
                          💬 Negotiation History
                        </strong>

                        {bid.negotiationHistory.map(
                          (
                            history,
                            index
                          ) => (

                            <div
                              key={
                                index
                              }
                              className="history-item"
                            >

                              <span>
                                {history.by ===
                                "Farmer"
                                  ? "👨‍🌾 Farmer"
                                  : "👨‍💼 Buyer"}
                              </span>

                              <strong>
                                ₹
                                {
                                  history.price
                                }
                                /kg
                              </strong>

                              {history.message && (
                                <small>
                                  {
                                    history.message
                                  }
                                </small>
                              )}

                            </div>

                          )
                        )}

                      </div>

                    )}

                  {bid.status ===
                    "Pending" && (

                    <div className="bid-actions">

                      <button
                        className="accept-bid-btn"
                        onClick={() =>
                          updateBidStatus(
                            bid._id,
                            "Accepted"
                          )
                        }
                      >
                        ✓ Accept Bid
                      </button>

                      <button
                        className="reject-bid-btn"
                        onClick={() =>
                          updateBidStatus(
                            bid._id,
                            "Rejected"
                          )
                        }
                      >
                        ✕ Reject Bid
                      </button>

                      <button
                        className="negotiate-bid-btn"
                        onClick={() => {

                          setNegotiatingBid(
                            bid
                          );

                          setCounterPrice(
                            bid.bidPrice
                          );

                          setNegotiationMessage(
                            ""
                          );

                        }}
                      >
                        💬 Negotiate
                      </button>

                    </div>

                  )}

                  {bid.status ===
                    "Counter Offer" && (

                    <div className="counter-offer-info">

                      <strong>
                        💬 Counter Offer Sent
                      </strong>

                      <p>
                        Your counter offer:
                      </p>

                      <strong>
                        ₹
                        {
                          bid.counterOfferPrice
                        }
                        /kg
                      </strong>

                      {bid.negotiationMessage && (

                        <p>
                          "
                          {
                            bid.negotiationMessage
                          }
                          "
                        </p>

                      )}

                      <small>
                        Waiting for buyer response.
                      </small>

                    </div>

                  )}

                </div>

              )
            )}

          </div>

        )}

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

      </div>

    </div>
  );
}

export default FarmerDashboard;