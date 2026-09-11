import { useEffect, useState } from "react";

function BuyerDashboard() {
  const [buyer, setBuyer] = useState(null);
  const [produceList, setProduceList] = useState([]);
  const [myBids, setMyBids] = useState([]);

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

  const API_URL = "https://agridirectai-backend.onrender.com";

  const [profileForm, setProfileForm] =
    useState({
      name: "",
      businessName: "",
      phone: "",
      location: "",
      buyerType: "",
      interestedCrops: ""
    });

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
          <h1>
            🌾 UzhavarSetu
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

                    <button
                      className="edit-profile-btn"
                      onClick={() =>
                        setEditProfile(
                          true
                        )
                      }
                    >
                      ✏️ Edit Profile
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

        <div className="bid-form-card">

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

        <h2>
          💰 My Bids
        </h2>

        {myBids.length === 0 ? (

          <p>
            You haven't placed any bids yet.
          </p>

        ) : (

          myBids.map(
            (bid) => (

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

                {bid.status ===
                  "Accepted" && (

                  <div className="bid-success-info">
                    ✓ Deal accepted successfully
                  </div>

                )}

                {bid.status ===
                  "Rejected" && (

                  <div className="bid-rejected-info">
                    ✕ This bid was rejected
                  </div>

                )}

              </div>

            )
          )

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

    </div>
  );
}

export default BuyerDashboard;