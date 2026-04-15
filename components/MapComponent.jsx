"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";

export default function MapComponent() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (mapInstanceRef.current) return;
    if (!mapRef.current) return;

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) return;
      if (!mapRef.current) return;

      const L = require("leaflet");

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, {
        center: [45.0, -63.0],
        zoom: 7,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      function getMineralColor(commodity) {
        if (!commodity) return "#888";
        const c = commodity.toLowerCase();
        if (c.includes("gold")) return "#f59e0b";
        if (c.includes("gypsum")) return "#60a5fa";
        if (c.includes("coal")) return "#6b7280";
        if (c.includes("barite")) return "#a78bfa";
        if (c.includes("manganese")) return "#f87171";
        if (c.includes("antimony")) return "#34d399";
        if (c.includes("copper")) return "#fb923c";
        if (c.includes("granite") || c.includes("slate")) return "#94a3b8";
        return "#e2e8f0";
      }

      function makeIcon(commodity) {
        const color = getMineralColor(commodity);
        return L.divIcon({
          className: "",
          html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 4px ${color};"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });
      }

      const sites = [
        { name: "Moose River Gold Mine", commodity: "Gold", county: "Halifax", lat: 44.95, lng: -63.45, status: "Historic" },
        { name: "Walton Barite Deposit", commodity: "Barite", county: "Hants", lat: 45.23, lng: -64.02, status: "Past producer" },
        { name: "Stirling Gypsum Mine", commodity: "Gypsum", county: "Hants", lat: 45.1, lng: -63.85, status: "Active" },
        { name: "Tennycape Manganese", commodity: "Manganese", county: "Hants", lat: 45.18, lng: -63.92, status: "Historic" },
        { name: "West Gore Antimony", commodity: "Antimony", county: "Hants", lat: 45.12, lng: -63.72, status: "Historic" },
        { name: "Cape Breton Coal", commodity: "Coal", county: "Cape Breton", lat: 46.15, lng: -60.18, status: "Past producer" },
        { name: "Millet Brook Gold", commodity: "Gold", county: "Pictou", lat: 45.62, lng: -62.88, status: "Exploration" },
        { name: "Musquodoboit Granite", commodity: "Granite", county: "Halifax", lat: 44.97, lng: -63.12, status: "Active" },
        { name: "Goldenville Gold District", commodity: "Gold", county: "Guysborough", lat: 45.18, lng: -61.68, status: "Historic" },
        { name: "Cape Breton Limestone", commodity: "Limestone", county: "Cape Breton", lat: 46.0, lng: -60.5, status: "Active" },
        { name: "Antigonish Copper", commodity: "Copper", county: "Antigonish", lat: 45.62, lng: -61.98, status: "Historic" },
        { name: "Meat Cove Manganese", commodity: "Manganese", county: "Victoria", lat: 47.02, lng: -60.57, status: "Historic" },
        { name: "Londonderry Iron Mine", commodity: "Iron", county: "Colchester", lat: 45.48, lng: -63.58, status: "Historic" },
        { name: "Brookfield Gold", commodity: "Gold", county: "Colchester", lat: 45.35, lng: -63.08, status: "Exploration" },
        { name: "Windsor Salt Mine", commodity: "Salt", county: "Hants", lat: 44.99, lng: -64.13, status: "Active" },
        { name: "Five Islands Zeolite", commodity: "Zeolite", county: "Cumberland", lat: 45.38, lng: -64.07, status: "Historic" },
        { name: "Margaree Copper", commodity: "Copper", county: "Inverness", lat: 46.38, lng: -61.08, status: "Historic" },
        { name: "Lochaber Lake Gold", commodity: "Gold", county: "Antigonish", lat: 45.55, lng: -61.78, status: "Historic" },
        { name: "North Mountain Basalt", commodity: "Basalt", county: "Annapolis", lat: 44.98, lng: -65.12, status: "Active" },
        { name: "Yarmouth Granite", commodity: "Granite", county: "Yarmouth", lat: 43.83, lng: -66.12, status: "Active" },
      ];

      sites.forEach((site) => {
        const marker = L.marker([site.lat, site.lng], { icon: makeIcon(site.commodity) });
        marker.on("click", () => setSelected(site));
        marker.addTo(map);
      });

    }, 300);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  function handleAskAI() {
    if (!selected) return;
    const query = `Tell me about ${selected.name} in ${selected.county} County — what ${selected.commodity} deposits are there and what is the significance?`;
    localStorage.setItem("geolens_prefill", query);
    router.push("/");
  }

  return (
    <div style={{ flex: 1, position: "relative", height: "calc(100vh - 65px)" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      <div style={{
        position: "absolute", bottom: "24px", left: "12px", zIndex: 1000,
        backgroundColor: "#1a1a1aee", border: "1px solid #2a2a2a",
        borderRadius: "10px", padding: "12px 16px", fontSize: "12px", color: "#aaa",
      }}>
        {[
          ["#f59e0b", "Gold"],
          ["#60a5fa", "Gypsum"],
          ["#a78bfa", "Barite"],
          ["#34d399", "Antimony"],
          ["#f87171", "Manganese"],
          ["#fb923c", "Copper"],
          ["#6b7280", "Coal"],
          ["#94a3b8", "Other"],
        ].map(([color, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>

      {selected && (
        <div style={{
          position: "absolute", top: "16px", right: "16px", zIndex: 1000,
          backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a",
          borderRadius: "12px", padding: "20px", width: "280px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#fff", flex: 1, marginRight: "8px" }}>
              {selected.name}
            </h3>
            <button onClick={() => setSelected(null)} style={{
              background: "none", border: "none", color: "#666",
              cursor: "pointer", fontSize: "18px", lineHeight: 1,
            }}>×</button>
          </div>

          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              ["Mineral", selected.commodity],
              ["Status", selected.status],
              ["County", selected.county],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#666" }}>{label}</span>
                <span style={{ fontSize: "12px", color: "#ccc", fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>

          <button onClick={handleAskAI} style={{
            marginTop: "16px", width: "100%", padding: "10px",
            borderRadius: "8px", border: "none", backgroundColor: "#c9a84c",
            color: "#0f0f0f", fontSize: "13px", fontWeight: 600, cursor: "pointer",
          }}>
            Ask AI about this site ↗
          </button>
        </div>
      )}
    </div>
  );
}