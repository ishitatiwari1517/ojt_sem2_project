import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000/api",
  timeout: 15000,
});

// Attach token to requests automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(err);
  }
);

// ─── Usage ──────────────────────────────────────────────
export const fetchUsage = (params = {}) => API.get("/usage", { params });
export const addUsage = (data) => API.post("/usage", data);
export const fetchUsageById = (id) => API.get(`/usage/${id}`);
export const updateUsage = (id, data) => API.put(`/usage/${id}`, data);
export const deleteUsage = (id) => API.delete(`/usage/${id}`);
export const uploadCSV = (formData) =>
  API.post("/usage/upload-csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ─── Dashboard ──────────────────────────────────────────
export const fetchDashboard = () => API.get("/dashboard");

// ─── Analysis ───────────────────────────────────────────
export const fetchApplianceAnalysis = () => API.get("/analysis/appliance");
export const fetchAnalysisSummary = () => API.get("/analysis/summary");

// ─── Predictions ────────────────────────────────────────
export const fetchPrediction = (days) => API.get("/predict", { params: { days } });

// ─── Alerts ─────────────────────────────────────────────
export const fetchAlerts = () => API.get("/alerts");
export const resolveAlert = (id) => API.put(`/alerts/${id}/resolve`);

// ─── Auth ───────────────────────────────────────────────
export const loginUser = (data) => API.post("/auth/login", data);
export const signupUser = (data) => API.post("/auth/signup", data);
export const fetchMe = () => API.get("/auth/me");
export const googleAuthLogin = (data) => API.post("/auth/google", data);

// ─── Appliances ─────────────────────────────────────────
export const fetchAppliances = (params = {}) => API.get("/appliances", { params });
export const addAppliance = (data) => API.post("/appliances", data);
export const updateAppliance = (id, data) => API.put(`/appliances/${id}`, data);
export const deleteAppliance = (id) => API.delete(`/appliances/${id}`);

// ─── Household ──────────────────────────────────────────
export const fetchHousehold = () => API.get("/household");
export const upsertHousehold = (data) => API.post("/household", data);
export const updateHousehold = (id, data) => API.put(`/household/${id}`, data);
export const deleteHousehold = (id) => API.delete(`/household/${id}`);

// ─── Bills ──────────────────────────────────────────────
export const fetchBills = (params = {}) => API.get("/bills", { params });
export const calculateBill = (data) => API.post("/bills/calculate", data);
export const fetchBillById = (id) => API.get(`/bills/${id}`);
export const deleteBill = (id) => API.delete(`/bills/${id}`);
export const fetchTariffs = () => API.get("/bills/tariffs");

// ─── Subscription ───────────────────────────────────────
export const fetchPlans = () => API.get("/subscription/plans");
export const upgradePlan = () => API.put("/subscription/upgrade");
export const downgradePlan = () => API.put("/subscription/downgrade");

// ─── Insights / Recommendations ─────────────────────────
export const fetchRecommendations = () => API.get("/insights/recommendations");

// ─── Seasonal Analysis ───────────────────────────────────
export const fetchSeasonalAnalysis = () => API.get("/analysis/seasonal");

// ─── Export ─────────────────────────────────────────────
export const exportUsageCSV = (params = {}) =>
  API.get("/export/usage", { params, responseType: "blob" });
export const exportBillsCSV = (params = {}) =>
  API.get("/export/bills", { params, responseType: "blob" });

export default API;
