import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Appliances from "./pages/Appliances";
import DataInput from "./pages/DataInput";
import Analysis from "./pages/Analysis";
import Bills from "./pages/Bills";
import Predictions from "./pages/Predictions";
import Alerts from "./pages/Alerts";
import Insights from "./pages/Insights";
import SeasonalAnalysis from "./pages/SeasonalAnalysis";
import Warranty from "./pages/Warranty";
import "./index.css";

function App() {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* App routes */}
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="appliances" element={<Appliances />} />
          <Route path="data-input" element={<DataInput />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="bills" element={<Bills />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="insights" element={<Insights />} />
          <Route path="seasonal" element={<SeasonalAnalysis />} />
          <Route path="warranty" element={<Warranty />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;