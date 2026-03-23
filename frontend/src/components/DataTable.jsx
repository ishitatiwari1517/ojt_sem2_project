import React, { useState } from "react";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * DataTable - generic paginated table
 * Props: columns [{key, label, render?}], data [], onDelete?, loading
 */
export default function DataTable({ columns = [], data = [], onDelete, loading = false, pageSize = 10 }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const paginated = data.slice((page - 1) * pageSize, page * pageSize);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Loading data...</span>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <p style={{ fontSize: "0.9rem", marginTop: "8px" }}>No records found</p>
        <p style={{ fontSize: "0.8rem", color: "#5c6370", marginTop: "4px" }}>Add data using the form or upload a CSV</p>
      </div>
    );
  }

  return (
    <div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              {onDelete && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr key={row._id || i}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                  </td>
                ))}
                {onDelete && (
                  <td>
                    <button
                      className="btn btn-danger"
                      style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                      onClick={() => onDelete(row._id)}
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <span style={styles.pageInfo}>
            Page {page} of {totalPages} · {data.length} records
          </span>
          <div style={styles.pageButtons}>
            <button
              className="btn btn-secondary"
              style={{ padding: "6px 12px" }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: "6px 12px" }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "16px",
    padding: "12px 0 0",
    borderTop: "1px solid #1e2d40",
  },
  pageInfo: { fontSize: "0.8rem", color: "#9aa0ac" },
  pageButtons: { display: "flex", gap: "8px" },
};
