'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Map as LeafletMap, Layer as LeafletLayer } from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@bayou/supabase';
import type { Database } from '@bayou/supabase/types';
import { colors } from '@bayou/ui/tokens';
import { ACCEPTED_IMAGE_ACCEPT, prepareUploadFile } from '@/lib/uploads';

interface LeafletDivElement extends HTMLDivElement {
  _leaflet_id?: number;
}

type Pin = Database['public']['Tables']['pins']['Row'] & {
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

type Season = 'All' | 'Spring' | 'Summer' | 'Fall' | 'Winter';

interface PinsMapProps {
  userId: string;
  role: 'member' | 'guide' | 'admin';
}

declare global {
  interface Window {
    __deletePin?: (id: string) => Promise<void>;
  }
}

const SEASONS: Season[] = ['All', 'Spring', 'Summer', 'Fall', 'Winter'];

const SEASON_MONTHS: Record<Season, number[]> = {
  All: [],
  Spring: [3, 4, 5],
  Summer: [6, 7, 8],
  Fall: [9, 10, 11],
  Winter: [12, 1, 2],
};

export function PinsMap({ userId, role }: PinsMapProps) {
  const mapRef = useRef<LeafletDivElement>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [season, setSeason] = useState<Season>('All');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [mapCenter, setMapCenter] = useState({ lat: 29.5955, lng: -89.9067 });
  const [mapZoom, setMapZoom] = useState(11);
  const [showDropForm, setShowDropForm] = useState(false);
  const [newPin, setNewPin] = useState({
    caption: '',
    location_name: '',
    species: '',
    catch_date: new Date().toISOString().slice(0, 10),
  });
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [clickedLatLng, setClickedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [pinPhoto, setPinPhoto] = useState<File | null>(null);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const pendingMarkerRef = useRef<unknown>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const loadPins = useCallback(async () => {
    let query = supabase
      .from('pins')
      .select('*, profiles(display_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (season !== 'All') {
      const months = SEASON_MONTHS[season];
      // Filter by catch_date month within the selected year
      const monthFilters = months.map((m) => {
        const padded = String(m).padStart(2, '0');
        const start = `${year}-${padded}-01`;
        const endMonth = m === 12 ? 1 : m + 1;
        const endYear = m === 12 ? year + 1 : year;
        const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
        return `and(catch_date.gte.${start},catch_date.lt.${end})`;
      });
      query = query.or(monthFilters.join(','));
    } else {
      query = query.gte('catch_date', `${year}-01-01`).lt('catch_date', `${year + 1}-01-01`);
    }

    const { data } = await query;
    if (data) setPins(data as Pin[]);
  }, [season, year, supabase]);

  useEffect(() => {
    loadPins();
  }, [loadPins]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current) return;
    let map: unknown;

    import('leaflet').then((L) => {
      // Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Fix default icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current) return;
      if (mapRef.current._leaflet_id) return;

      map = L.map(mapRef.current).setView([mapCenter.lat, mapCenter.lng], mapZoom);

      // Esri World Imagery satellite tiles
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri &mdash; Source: Esri, USGS, NOAA',
          maxZoom: 19,
        }
      ).addTo(map as LeafletMap);

      // Track center/zoom for FisherMap deep-link
      (map as LeafletMap).on('moveend', () => {
        const c = (map as LeafletMap).getCenter();
        const z = (map as LeafletMap).getZoom();
        setMapCenter({ lat: c.lat, lng: c.lng });
        setMapZoom(z);
      });

      // Click to drop pin
      (map as LeafletMap).on('click', (e: L.LeafletMouseEvent) => {
        setClickedLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
        setShowDropForm(true);
      });

      setMapInstance(map as LeafletMap);
    });

    return () => {
      if (map) {
        (map as LeafletMap).remove();
      }
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wire window.__deletePin for popup delete buttons
  useEffect(() => {
    window.__deletePin = async (id: string) => {
      await supabase.from('pins').delete().eq('id', id);
      await loadPins();
    };
    return () => {
      delete window.__deletePin;
    };
  }, [supabase, loadPins]);

  // Add markers when pins or map changes
  useEffect(() => {
    if (!mapInstance) return;
    import('leaflet').then((L) => {
      // Clear existing markers
      mapInstance.eachLayer((layer: L.Layer) => {
        if (layer instanceof L.Marker) {
          mapInstance.removeLayer(layer);
        }
      });

      pins.forEach((pin) => {
        const name = pin.profiles?.display_name ?? 'Member';
        const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

        const icon = L.divIcon({
          html: `<div style="width:32px;height:32px;border-radius:50%;background:${colors['gold']};display:flex;align-items:center;justify-content:center;font-family:serif;font-size:11px;font-weight:600;color:${colors['green-deep']};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${initials}</div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const canDelete = role === 'admin' || pin.user_id === userId;

        const popupEl = document.createElement('div');

        if (pin.photo_url) {
          try {
            const url = new URL(pin.photo_url);
            if (url.protocol === 'https:') {
              const img = document.createElement('img');
              img.src = pin.photo_url;
              img.style.cssText = 'width:100%;max-height:120px;object-fit:cover;border-radius:8px;margin-bottom:6px';
              popupEl.appendChild(img);
            }
          } catch { /* invalid URL — skip image */ }
        }

        const caption = document.createElement('strong');
        caption.textContent = pin.caption ?? '';
        caption.style.fontFamily = 'serif';
        popupEl.appendChild(caption);

        if (pin.location_name) {
          popupEl.appendChild(document.createElement('br'));
          const location = document.createElement('span');
          location.textContent = pin.location_name;
          location.style.cssText = 'font-family:serif;font-size:12px';
          popupEl.appendChild(location);
        }

        if (canDelete) {
          popupEl.appendChild(document.createElement('br'));
          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = 'Delete';
          deleteBtn.style.cssText = 'margin-top:6px;padding:3px 10px;background:#e8923a;color:white;border:none;border-radius:12px;font-family:serif;font-size:11px;cursor:pointer';
          deleteBtn.onclick = () => window.__deletePin?.(pin.id);
          popupEl.appendChild(deleteBtn);
        }

        L.marker([pin.lat, pin.lng], { icon })
          .addTo(mapInstance)
          .bindPopup(popupEl);
      });
    });
  }, [mapInstance, pins, role, userId]);

  async function handleDropPin() {
    if (!clickedLatLng || !newPin.caption.trim()) return;
    if (!pinPhoto) {
      alert('Photo required — Please select a photo to post.');
      return;
    }
    const preparedPhoto = await prepareUploadFile(pinPhoto);
    if (preparedPhoto.error) {
      alert(preparedPhoto.error);
      return;
    }
    const photo = preparedPhoto.file;
    const today = new Date().toISOString().slice(0, 10);
    if (newPin.catch_date > today) {
      alert('Catch date cannot be in the future.');
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.from('pins').insert({
      user_id: userId,
      caption: newPin.caption.trim(),
      location_name: newPin.location_name.trim() || null,
      species: newPin.species.trim() || null,
      catch_date: newPin.catch_date || today,
      lat: clickedLatLng.lat,
      lng: clickedLatLng.lng,
      flagged: false,
    }).select();
    if (!error) {
      if (data && data[0]) {
        const ext = photo.type === 'image/jpeg' ? 'jpg' : (photo.name.split('.').pop() ?? 'jpg');
        const path = `${userId}/${data[0].id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('pin-photos')
          .upload(path, photo, { upsert: false });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('pin-photos').getPublicUrl(path);
          await supabase.from('pins').update({ photo_url: urlData.publicUrl }).eq('id', data[0].id);
        }
      }
      setShowDropForm(false);
      setNewPin({ caption: '', location_name: '', species: '', catch_date: new Date().toISOString().slice(0, 10) });
      setClickedLatLng(null);
      setPinPhoto(null);
      await loadPins();
    }
    setSubmitting(false);
  }

  // Update pending marker on map when clickedLatLng changes
  useEffect(() => {
    if (!mapInstance || !clickedLatLng) {
      // Remove pending marker if no location
      if (pendingMarkerRef.current && mapInstance) {
        mapInstance.removeLayer(pendingMarkerRef.current as LeafletLayer);
        pendingMarkerRef.current = null;
      }
      return;
    }

    import('leaflet').then((L) => {
      // Remove old pending marker
      if (pendingMarkerRef.current) {
        mapInstance.removeLayer(pendingMarkerRef.current as LeafletLayer);
      }

      const pendingIcon = L.divIcon({
        html: `<div style="width:40px;height:40px;border-radius:50%;background:${colors['amber']};display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid white;box-shadow:0 0 12px rgba(232,146,58,0.8),0 4px 12px rgba(0,0,0,0.3);animation:pulse 1.5s ease-in-out infinite">📍</div>`,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([clickedLatLng.lat, clickedLatLng.lng], {
        icon: pendingIcon,
        draggable: true,
      }).addTo(mapInstance);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setClickedLatLng({ lat: pos.lat, lng: pos.lng });
      });

      pendingMarkerRef.current = marker;
    });
  }, [mapInstance, clickedLatLng]);

  function handleRequestGeolocation() {
    if (!navigator.geolocation) {
      setGeoStatus('Click the map to place your pin.');
      return;
    }
    setGeoStatus('Locating…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setClickedLatLng({ lat: latitude, lng: longitude });
        mapInstance?.setView([latitude, longitude], 14);
        setShowDropForm(true);
        setGeoStatus('Located! Drag the pin to adjust.');
      },
      () => {
        setGeoStatus('Click the map to place your pin.');
      },
      { timeout: 8000 },
    );
  }

  function handleSearchLocation(query: string) {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim()) return;

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&email=info@bayoucharity.org`
        );
        const data = await res.json();
        if (data[0]) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setClickedLatLng({ lat, lng: lon });
          mapInstance?.setView([lat, lon], 14);
          setShowDropForm(true);
          setGeoStatus('Located! Drag the pin to adjust.');
        }
      } catch {
        // geocoding failed silently
      }
      setSearching(false);
    }, 300);
  }

  const fisherMapUrl = `https://fishermap.org/?lat=${mapCenter.lat.toFixed(4)}&lng=${mapCenter.lng.toFixed(4)}&zoom=${mapZoom}`;

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }
      `}</style>
      {/* Season + year filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 flex-wrap">
          {SEASONS.map((s) => (
            <button
              key={s}
              onClick={() => setSeason(s)}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-serif transition-colors',
                season === s
                  ? 'bg-gold text-green-deep font-semibold'
                  : 'bg-cream dark:bg-green-water text-text-mid dark:text-cream/70 hover:text-amber',
              ].join(' ')}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="ml-auto px-3 py-1.5 rounded-full text-xs font-serif bg-cream dark:bg-green-water text-text-dark dark:text-cream border border-gold/20 focus:outline-none focus:ring-2 focus:ring-amber/40"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Search + Geolocation bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search location…"
            value={searchQuery}
            onChange={(e) => handleSearchLocation(e.target.value)}
            className="w-full bg-cream dark:bg-green-deep/60 rounded-full px-4 py-2 font-serif text-text-dark dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-amber/40 pr-8"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-mid">…</span>
          )}
        </div>
        <button
          onClick={handleRequestGeolocation}
          className="px-4 py-2 bg-green-water/20 hover:bg-green-water/40 text-green-water dark:text-cream font-serif text-sm rounded-full transition-colors"
        >
          Use My Location
        </button>
        {geoStatus && (
          <span className="text-xs text-text-mid dark:text-cream/60 font-serif">{geoStatus}</span>
        )}
      </div>

      {/* Map container */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-md border border-gold/10"
        style={{ height: 'calc(100vh - 14rem)', isolation: 'isolate' }}
      >
        <div ref={mapRef} className="w-full h-full" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] text-center">
          <p className="text-xs text-white/80 bg-green-deep/60 backdrop-blur-sm rounded-full px-3 py-1 font-serif">
            {clickedLatLng
              ? `📍 ${clickedLatLng.lat.toFixed(5)}, ${clickedLatLng.lng.toFixed(5)}`
              : 'Click the map to place your pin.'}
          </p>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <button
          onClick={() => { handleRequestGeolocation(); setShowDropForm(true); }}
          className="px-4 py-2 bg-amber hover:bg-amber/90 text-white font-serif text-sm rounded-full transition-all hover:scale-[1.02]"
        >
          + Drop a Pin &amp; Post a Catch
        </button>
        <a
          href={fisherMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber hover:underline font-serif text-sm"
        >
          View Depth Chart on FisherMap ↗
        </a>
      </div>

      {/* Drop pin form */}
      <AnimatePresence>
        {showDropForm && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="bg-white dark:bg-green-water rounded-2xl p-5 border border-gold/10 space-y-3"
          >
            <h3 className="font-display text-lg text-green-deep dark:text-cream">Drop a Pin</h3>
            {clickedLatLng && (
              <p className="text-xs text-text-mid dark:text-cream/60 font-serif">
                Location: {clickedLatLng.lat.toFixed(4)}, {clickedLatLng.lng.toFixed(4)}
              </p>
            )}
            <input
              type="text"
              placeholder="What'd you catch? (e.g. Redfish)"
              value={newPin.caption}
              onChange={(e) => setNewPin((p) => ({ ...p, caption: e.target.value }))}
              className="w-full bg-cream dark:bg-green-deep/60 rounded-xl px-4 py-2.5 font-serif text-text-dark dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-amber/40"
            />
            <input
              type="text"
              placeholder="What species?"
              value={newPin.species}
              onChange={(e) => setNewPin((p) => ({ ...p, species: e.target.value }))}
              className="w-full bg-cream dark:bg-green-deep/60 rounded-xl px-4 py-2.5 font-serif text-text-dark dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-amber/40"
            />
            <div>
              <label className="block text-xs font-semibold text-text-mid dark:text-cream/60 mb-1">Catch date</label>
              <input
                type="date"
                value={newPin.catch_date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setNewPin((p) => ({ ...p, catch_date: e.target.value }))}
                className="w-full bg-cream dark:bg-green-deep/60 rounded-xl px-4 py-2.5 font-serif text-text-dark dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-amber/40"
              />
            </div>
            <textarea
              placeholder="Location name (optional)"
              value={newPin.location_name}
              onChange={(e) => setNewPin((p) => ({ ...p, location_name: e.target.value }))}
              rows={2}
              className="w-full bg-cream dark:bg-green-deep/60 rounded-xl px-4 py-2.5 font-serif text-text-dark dark:text-cream text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber/40"
            />
            <div>
              <label className="block text-xs font-semibold text-text-mid dark:text-cream/60 mb-1">Photo <span className="text-amber">*</span></label>
              <input
                type="file"
                accept={ACCEPTED_IMAGE_ACCEPT}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (!file) {
                    setPinPhoto(null);
                    return;
                  }
                  void prepareUploadFile(file).then((prepared) => {
                    if (prepared.error) {
                      alert(prepared.error);
                      e.target.value = '';
                      setPinPhoto(null);
                      return;
                    }
                    setPinPhoto(prepared.file);
                  });
                }}
                className="block w-full text-sm text-text-dark file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber/20 file:text-amber hover:file:bg-amber/30"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDropPin}
                disabled={submitting || !newPin.caption.trim() || !pinPhoto}
                className="px-5 py-2 bg-amber hover:bg-amber/90 text-white font-serif text-sm rounded-full transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving…' : 'Post Pin'}
              </button>
              <button
                onClick={() => { setShowDropForm(false); setClickedLatLng(null); }}
                className="px-5 py-2 bg-cream dark:bg-green-deep text-text-mid dark:text-cream/70 font-serif text-sm rounded-full transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

