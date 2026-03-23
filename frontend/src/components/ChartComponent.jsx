import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
} from "chart.js";
import { Pie, Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler
);

const PALETTE = [
  "#00e676", "#00bcd4", "#7c3aed", "#ff9800", "#2196f3",
  "#e91e63", "#4caf50", "#ff5722", "#9c27b0", "#03a9f4",
];

const tooltipStyle = {
  backgroundColor: "#1a2235",
  borderColor: "#1e2d40",
  borderWidth: 1,
  titleColor: "#e8eaed",
  bodyColor: "#9aa0ac",
  padding: 12,
  cornerRadius: 8,
  displayColors: true,
};

const legendStyle = {
  labels: {
    color: "#9aa0ac",
    font: { family: "Inter", size: 12 },
    padding: 16,
    usePointStyle: true,
    pointStyleWidth: 8,
  },
};

// --- LINE CHART ---
export function LineChart({ labels = [], datasets = [], title }) {
  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color || PALETTE[i],
      backgroundColor: `${ds.color || PALETTE[i]}20`,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: ds.color || PALETTE[i],
      pointRadius: 4,
      pointHoverRadius: 7,
      borderWidth: 2,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: legendStyle,
      tooltip: tooltipStyle,
    },
    scales: {
      x: {
        grid: { color: "#1e2d4060", drawBorder: false },
        ticks: { color: "#9aa0ac", font: { family: "Inter", size: 11 } },
      },
      y: {
        grid: { color: "#1e2d4060", drawBorder: false },
        ticks: { color: "#9aa0ac", font: { family: "Inter", size: 11 } },
      },
    },
  };

  return (
    <div className="card">
      {title && <h3 className="section-title">{title}</h3>}
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

// --- PIE CHART ---
export function PieChart({ labels = [], values = [], title }) {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: PALETTE.slice(0, labels.length).map((c) => `${c}cc`),
        borderColor: PALETTE.slice(0, labels.length),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { ...legendStyle, position: "right" },
      tooltip: tooltipStyle,
    },
  };

  return (
    <div className="card">
      {title && <h3 className="section-title">{title}</h3>}
      <div className="chart-container">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
}

// --- DOUGHNUT ---
export function DoughnutChart({ labels = [], values = [], title, centerText }) {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: PALETTE.slice(0, labels.length).map((c) => `${c}bb`),
        borderColor: "#1a2235",
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: { ...legendStyle, position: "right" },
      tooltip: tooltipStyle,
    },
  };

  return (
    <div className="card">
      {title && <h3 className="section-title">{title}</h3>}
      <div className="chart-container">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
}

// --- BAR CHART ---
export function BarChart({ labels = [], datasets = [], title }) {
  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: `${ds.color || PALETTE[i]}99`,
      borderColor: ds.color || PALETTE[i],
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: legendStyle,
      tooltip: tooltipStyle,
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#9aa0ac", font: { family: "Inter", size: 11 } },
      },
      y: {
        grid: { color: "#1e2d4060", drawBorder: false },
        ticks: { color: "#9aa0ac", font: { family: "Inter", size: 11 } },
      },
    },
  };

  return (
    <div className="card">
      {title && <h3 className="section-title">{title}</h3>}
      <div className="chart-container">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
