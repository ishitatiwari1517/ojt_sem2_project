import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Zap,
  Database,
  BarChart2,
  Activity,
  Receipt,
  TrendingUp,
  Bell,
  Crown,
  Lightbulb,
  CloudSun,
  Shield,
  LogOut,
} from "lucide-react";
import SubscriptionModal from "./SubscriptionModal";

const freeItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/appliances", icon: Zap, label: "Appliances" },
  { to: "/data-input", icon: Database, label: "Data Input" },
  { to: "/analysis", icon: BarChart2, label: "Analysis" },
  { to: "/seasonal", icon: CloudSun, label: "Seasonal" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/insights", icon: Lightbulb, label: "Insights" },
  { to: "/warranty", icon: Shield, label: "Warranty" },
];

const premiumItems = [
  { to: "/bills", icon: Receipt, label: "Bills", premium: true },
  { to: "/predictions", icon: TrendingUp, label: "Predictions", premium: true },
];

export default function Sidebar() {
  const [showModal, setShowModal] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isPremium = user.subscription === "premium";
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <>
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <Activity size={20} color="#0d1117" strokeWidth={2.5} />
          </div>
          <div>
            <div style={styles.logoName}>EnergyLens</div>
            <div style={styles.logoTag}>Household Insights</div>
          </div>
        </div>

        <div style={styles.divider} />
        <div style={styles.navLabel}>NAVIGATION</div>

        <nav style={styles.nav}>
          {/* Free nav items */}
          {freeItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) =>
                isActive ? { ...styles.navItem, ...styles.navItemActive } : styles.navItem
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} color={isActive ? "#00e676" : "#9aa0ac"} strokeWidth={isActive ? 2 : 1.5} />
                  <span style={{ color: isActive ? "#00e676" : "#9aa0ac" }}>{label}</span>
                  {isActive && <div style={styles.activeIndicator} />}
                </>
              )}
            </NavLink>
          ))}

          {/* Premium section divider */}
          <div style={{ ...styles.navLabel, marginTop: "16px", marginBottom: "4px" }}>
            PREMIUM
          </div>

          {premiumItems.map(({ to, icon: Icon, label }) => {
            if (isPremium) {
              return (
                <NavLink
                  key={to}
                  to={to}
                  style={({ isActive }) =>
                    isActive ? { ...styles.navItem, ...styles.navItemActive } : styles.navItem
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} color={isActive ? "#fbbf24" : "#9aa0ac"} strokeWidth={isActive ? 2 : 1.5} />
                      <span style={{ color: isActive ? "#fbbf24" : "#9aa0ac" }}>{label}</span>
                      {isActive && <div style={{ ...styles.activeIndicator, background: "#fbbf24", boxShadow: "0 0 8px #fbbf24" }} />}
                    </>
                  )}
                </NavLink>
              );
            }
            return (
              <button key={to} style={styles.lockedItem} onClick={() => setShowModal(true)}>
                <Icon size={18} color="#5c6370" strokeWidth={1.5} />
                <span style={{ color: "#5c6370" }}>{label}</span>
                <Crown size={12} color="#fbbf24" style={{ marginLeft: "auto" }} />
              </button>
            );
          })}
          
          <div style={{ marginTop: "auto", marginBottom: "8px" }}>
            <button style={styles.logoutBtn} onClick={handleLogout}>
              <LogOut size={18} color="#f87171" strokeWidth={1.5} />
              <span style={{ color: "#f87171" }}>Log Out</span>
            </button>
          </div>
        </nav>

        {/* Subscription Status */}
        <div style={styles.footer}>
          <div style={{ ...styles.footerDot, background: isPremium ? "#fbbf24" : "#00e676", boxShadow: `0 0 8px rgba(${isPremium ? "251,191,36" : "0,230,118"},0.6)` }} />
          <div>
            <div style={styles.footerTitle}>{isPremium ? "Premium Plan" : "Free Plan"}</div>
            {!isPremium && (
              <button style={styles.upgradeLink} onClick={() => setShowModal(true)}>
                Upgrade ↗
              </button>
            )}
          </div>
        </div>
      </aside>

      <SubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onUpgradeSuccess={() => window.location.reload()}
      />
    </>
  );
}

const styles = {
  sidebar: {
    position: "fixed", top: 0, left: 0, bottom: 0, width: "240px",
    background: "#111827", borderRight: "1px solid #1e2d40",
    display: "flex", flexDirection: "column", padding: "24px 0", zIndex: 100,
    overflowY: "auto",
  },
  logo: { display: "flex", alignItems: "center", gap: "12px", padding: "0 20px", marginBottom: "8px" },
  logoIcon: {
    width: "38px", height: "38px", borderRadius: "10px",
    background: "linear-gradient(135deg, #00e676, #00bcd4)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  logoName: { fontSize: "1rem", fontWeight: "700", color: "#e8eaed", letterSpacing: "-0.3px" },
  logoTag: { fontSize: "0.65rem", color: "#5c6370", fontWeight: "500", marginTop: "1px", textTransform: "uppercase", letterSpacing: "0.5px" },
  divider: { height: "1px", background: "#1e2d40", margin: "16px 0" },
  navLabel: { fontSize: "0.65rem", fontWeight: "700", color: "#5c6370", letterSpacing: "1px", padding: "0 20px", marginBottom: "8px" },
  nav: { display: "flex", flexDirection: "column", gap: "2px", padding: "0 12px", flex: 1 },
  navItem: {
    display: "flex", alignItems: "center", gap: "12px", padding: "11px 12px",
    borderRadius: "8px", textDecoration: "none", fontSize: "0.875rem", fontWeight: "500",
    position: "relative", transition: "background 0.15s", color: "#9aa0ac",
  },
  navItemActive: { background: "rgba(0,230,118,0.08)", color: "#00e676" },
  lockedItem: {
    display: "flex", alignItems: "center", gap: "12px", padding: "11px 12px",
    borderRadius: "8px", fontSize: "0.875rem", fontWeight: "500", cursor: "pointer",
    background: "none", border: "none", width: "100%", textAlign: "left", color: "#5c6370",
  },
  logoutBtn: {
    display: "flex", alignItems: "center", gap: "12px", padding: "11px 12px",
    borderRadius: "8px", fontSize: "0.875rem", fontWeight: "500", cursor: "pointer",
    background: "rgba(248, 113, 113, 0.08)", border: "1px solid rgba(248, 113, 113, 0.2)",
    width: "100%", textAlign: "left", transition: "all 0.2s ease",
  },
  activeIndicator: {
    position: "absolute", right: "12px", width: "6px", height: "6px",
    borderRadius: "50%", background: "#00e676", boxShadow: "0 0 8px #00e676",
  },
  footer: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "16px 20px", borderTop: "1px solid #1e2d40", marginTop: "auto",
  },
  footerDot: { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  footerTitle: { fontSize: "0.8rem", fontWeight: "600", color: "#e8eaed" },
  upgradeLink: {
    background: "none", border: "none", padding: 0, cursor: "pointer",
    color: "#fbbf24", fontSize: "0.7rem", fontWeight: "600",
  },
};
