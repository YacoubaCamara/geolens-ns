"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      color: "#666", fontSize: "14px"
    }}>
      Loading map...
    </div>
  ),
});

export default function MapPage() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      backgroundColor: "#0f0f0f", color: "#f0f0f0",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid #222",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#fff" }}>
            GeoLens NS — Mineral Map
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#666" }}>
            Nova Scotia mineral deposits and geology
          </p>
        </div>
        <Link href="/" style={{
          padding: "8px 16px", borderRadius: "8px", border: "1px solid #2a2a2a",
          color: "#888", fontSize: "13px", textDecoration: "none"
        }}>
          Ask AI ↗
        </Link>
      </div>
      <MapComponent />
    </div>
  );
}