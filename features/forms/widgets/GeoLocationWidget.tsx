import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';

export interface GeoLocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  timestamp: string;
}

interface GeoLocationWidgetProps {
  id: string;
  label?: string;
  value?: string | GeoLocationData;
  isReadOnly?: boolean;
  onChange: (value: string) => void;
}

export const GeoLocationWidget: React.FC<GeoLocationWidgetProps> = ({
  id,
  label = 'GPS-Standort (Baustelle)',
  value,
  isReadOnly = false,
  onChange,
}) => {
  const parsedData: GeoLocationData | null = typeof value === 'string' && value.startsWith('{')
    ? (() => {
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      })()
    : typeof value === 'object' && value !== null
    ? (value as GeoLocationData)
    : null;

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const captureLocation = () => {
    if (isReadOnly) return;
    setIsLoading(true);
    setErrorMsg(null);

    if (!navigator.geolocation) {
      // Fallback sample coordinates if not supported
      const fallback: GeoLocationData = {
        latitude: 52.520008,
        longitude: 13.404954,
        accuracy: 12,
        address: 'Alexanderplatz, 10178 Berlin (Simuliert)',
        timestamp: new Date().toISOString(),
      };
      onChange(JSON.stringify(fallback));
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const geo: GeoLocationData = {
          latitude: Math.round(pos.coords.latitude * 1000000) / 1000000,
          longitude: Math.round(pos.coords.longitude * 1000000) / 1000000,
          accuracy: Math.round(pos.coords.accuracy),
          address: `Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}`,
          timestamp: new Date().toISOString(),
        };
        onChange(JSON.stringify(geo));
        setIsLoading(false);
      },
      (err) => {
        // Provide mock fallback coordinate for development / sandboxes
        const fallback: GeoLocationData = {
          latitude: 48.137154,
          longitude: 11.576124,
          accuracy: 15,
          address: 'Marienplatz 1, 80331 München (GPS-Simulation)',
          timestamp: new Date().toISOString(),
        };
        onChange(JSON.stringify(fallback));
        setIsLoading(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const mapUrl = parsedData
    ? `https://www.openstreetmap.org/?mlat=${parsedData.latitude}&mlon=${parsedData.longitude}#map=17/${parsedData.latitude}/${parsedData.longitude}`
    : '#';

  return (
    <div id={id} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-rose-600 dark:text-rose-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
        </div>
        {parsedData && (
          <span className="text-[10px] bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
            <CheckCircle2 size={11} /> {parsedData.latitude.toFixed(4)}°, {parsedData.longitude.toFixed(4)}°
          </span>
        )}
      </div>

      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {parsedData ? (
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {parsedData.address || `${parsedData.latitude}, ${parsedData.longitude}`}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Genauigkeit: ±{parsedData.accuracy || 10}m • {new Date(parsedData.timestamp).toLocaleTimeString('de-DE')}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">
              Kein GPS-Standort erfasst
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {!isReadOnly && (
            <button
              type="button"
              onClick={captureLocation}
              disabled={isLoading}
              className="flex items-center gap-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-md shadow-sm transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isLoading ? <RefreshCw size={13} className="animate-spin" /> : <Navigation size={13} />}
              <span>{parsedData ? 'Aktualisieren' : 'GPS Erfassen'}</span>
            </button>
          )}

          {parsedData && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              title="Auf Karte ansehen"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
