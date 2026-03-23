import React, { useRef, useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { uploadCSV } from "../services/api";

export default function UploadForm({ onSuccess }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // {type: 'success'|'error', message}
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      setStatus({ type: "error", message: "Please upload a valid .csv file." });
      return;
    }
    setFile(f);
    setStatus(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadCSV(formData);
      const { inserted, failed } = res.data.data || {};
      setStatus({
        type: "success",
        message: `✅ ${inserted} records imported${failed ? `, ${failed} skipped` : ""}.`,
      });
      setFile(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      setStatus({
        type: "error",
        message: err.response?.data?.message || "Upload failed. Check your CSV format.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        className={`upload-zone ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <Upload size={36} />
        <p style={{ color: "#e8eaed", fontWeight: "600", marginBottom: "4px" }}>
          {file ? file.name : "Drop CSV file here"}
        </p>
        <p style={{ fontSize: "0.8rem", color: "#9aa0ac" }}>
          {file ? `${(file.size / 1024).toFixed(1)} KB · Click to change` : "or click to browse · .csv only"}
        </p>
      </div>

      {/* CSV format hint */}
      <div style={styles.hint}>
        <FileText size={13} />
        <span>
          Required columns: <code>applianceName</code>, <code>date</code> (YYYY-MM-DD),{" "}
          <code>units</code>, <code>durationHours</code>
        </span>
      </div>

      {/* Status message */}
      {status && (
        <div
          style={{
            ...styles.statusMsg,
            background: status.type === "success" ? "rgba(0,230,118,0.08)" : "rgba(244,67,54,0.08)",
            borderColor: status.type === "success" ? "#00e676" : "#ef5350",
          }}
        >
          {status.type === "success" ? (
            <CheckCircle size={16} color="#00e676" />
          ) : (
            <AlertCircle size={16} color="#ef5350" />
          )}
          <span>{status.message}</span>
          <button
            onClick={() => setStatus(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#9aa0ac" }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Upload button */}
      {file && (
        <button
          className="btn btn-primary"
          style={{ marginTop: "16px", width: "100%", justifyContent: "center" }}
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload & Process CSV"}
        </button>
      )}
    </div>
  );
}

const styles = {
  hint: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.78rem",
    color: "#9aa0ac",
    marginTop: "12px",
  },
  statusMsg: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid",
    fontSize: "0.85rem",
    color: "#e8eaed",
    marginTop: "12px",
  },
};
