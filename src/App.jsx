import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FarmerDashboard from "./pages/FarmerDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import TransporterDashboard from "./pages/TransporterDashboard";
import ProfileEdit from "./pages/ProfileEdit";
import SplashScreen from "./components/SplashScreen";

function App() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && <SplashScreen onFinish={() => setLoading(false)} duration={2000} />}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
          <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
          <Route path="/transporter-dashboard" element={<TransporterDashboard />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/farmer-profile" element={<ProfileEdit />} />
          <Route path="/buyer-profile" element={<ProfileEdit />} />
          <Route path="/transporter-profile" element={<ProfileEdit />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;