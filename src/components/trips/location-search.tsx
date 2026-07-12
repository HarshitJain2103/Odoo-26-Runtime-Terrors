"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";

interface LocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (name: string, lat?: number, lng?: number) => void;
  error?: string;
}

export function LocationSearch({ label, placeholder, value, onChange, error }: LocationSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync prop value to local query if it changes externally
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (!query || query === value) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        console.error("Nominatim error:", err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, value]);

  function handleSelect(result: LocationResult) {
    // Simplify display name (first 3 parts usually)
    const parts = result.display_name.split(", ");
    const shortName = parts.slice(0, 3).join(", ");
    
    setQuery(shortName);
    onChange(shortName, Number(result.lat), Number(result.lon));
    setIsOpen(false);
  }

  function handleBlur() {
    // If they typed but didn't select, we just keep the text
    // (They might be entering a manual location without coordinates)
    if (query !== value) {
      onChange(query);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="form-label">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`form-input pl-9 pr-10 ${error ? "error" : ""}`}
        />
        {loading && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            <Loader2 size={16} className="animate-spin text-gray-400" />
          </div>
        )}
      </div>
      
      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto" style={{ borderColor: "var(--color-border)" }}>
          {results.map((result) => (
            <button
              key={result.place_id}
              type="button"
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-start gap-2 border-b last:border-0 transition-colors"
              style={{ borderColor: "var(--color-border)" }}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevents input onBlur from firing
                handleSelect(result);
              }}
            >
              <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <span className="text-gray-700">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
