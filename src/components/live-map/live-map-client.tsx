"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Map as MapIcon, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon issue with Webpack
import L from "leaflet";
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";

interface LiveTrip {
  id: string;
  code: string;
  source: string;
  destination: string;
  sourceLat: number;
  sourceLng: number;
  destLat: number;
  destLng: number;
  routeGeoJson: any;
  cargoWeightKg: number;
  vehicle: { regNo: string; name: string };
  driver: { name: string };
}

// A sub-component to auto-fit the map to all routes
function FitBounds({ trips }: { trips: LiveTrip[] }) {
  const map = useMap();
  useEffect(() => {
    if (trips.length > 0) {
      const bounds = L.latLngBounds([]);
      trips.forEach((trip) => {
        bounds.extend([trip.sourceLat, trip.sourceLng]);
        bounds.extend([trip.destLat, trip.destLng]);
      });
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [trips, map]);
  return null;
}

export default function LiveMapClient() {
  const [trips, setTrips] = useState<LiveTrip[]>([]);
  const [loading, setLoading] = useState(true);

  // Setup Leaflet icons on the client
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: iconRetinaUrl,
      iconUrl: iconUrl,
      shadowUrl: shadowUrl,
    });
  }, []);

  async function fetchTrips() {
    setLoading(true);
    try {
      const res = await fetch("/api/live-map");
      const data = await res.json();
      setTrips(data.trips ?? []);
    } catch (err) {
      console.error("Failed to fetch live trips:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrips();
    // Auto refresh every 60 seconds
    const interval = setInterval(fetchTrips, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapIcon size={24} className="text-primary-600" />
            Live Map
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tracking {trips.length} active {trips.length === 1 ? "trip" : "trips"}
          </p>
        </div>
        <button onClick={fetchTrips} disabled={loading} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Map Container */}
      <div className="flex-1 rounded-2xl overflow-hidden border shadow-sm relative" style={{ borderColor: "var(--color-border)" }}>
        {loading && trips.length === 0 && (
          <div className="absolute inset-0 z-[1000] bg-white/50 flex items-center justify-center backdrop-blur-sm">
            <Loader2 size={32} className="animate-spin text-primary-600" />
          </div>
        )}
        
        {trips.length === 0 && !loading ? (
          <div className="absolute inset-0 z-[1000] bg-gray-50 flex flex-col items-center justify-center text-gray-500">
            <MapIcon size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">No Active Trips</p>
            <p className="text-sm">Trips will appear here once dispatched.</p>
          </div>
        ) : null}

        <MapContainer
          center={[20.5937, 78.9629]} // Center of India default
          zoom={5}
          className="w-full h-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds trips={trips} />

          {trips.map((trip) => (
            <div key={trip.id}>
              {/* Route Line */}
              {trip.routeGeoJson && (
                <GeoJSON
                  data={trip.routeGeoJson}
                  pathOptions={{ color: "#714b67", weight: 4, opacity: 0.8 }}
                />
              )}

              {/* Source Marker */}
              <Marker position={[trip.sourceLat, trip.sourceLng]}>
                <Popup>
                  <div className="p-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 block mb-1">Source</span>
                    <strong className="block mb-1">{trip.source}</strong>
                    <span className="text-xs text-gray-500">Trip: {trip.code}</span>
                  </div>
                </Popup>
              </Marker>

              {/* Destination Marker */}
              <Marker position={[trip.destLat, trip.destLng]}>
                <Popup>
                  <div className="p-1 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Destination</span>
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{trip.code}</span>
                    </div>
                    <strong className="block text-sm mb-2 pb-2 border-b">{trip.destination}</strong>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-gray-500">Vehicle:</span> <span className="font-medium">{trip.vehicle.regNo}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Driver:</span> <span className="font-medium">{trip.driver.name}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Cargo:</span> <span className="font-medium">{trip.cargoWeightKg} kg</span></div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </div>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
