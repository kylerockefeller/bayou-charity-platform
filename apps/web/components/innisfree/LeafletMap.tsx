'use client'

/**
 * LeafletMap — Client Component island for INNISFREE page.
 * Esri Dark Gray Canvas tiles. Three markers: Home Base, INNISFREE, Sam's Bait By You.
 * Permanent tooltips + legend.
 */

import { useEffect, useRef } from 'react'

interface Marker {
  lat: number
  lng: number
  label: string
  letter: string
  color: string
  borderColor: string
  textColor: string
  direction: 'top' | 'bottom' | 'left' | 'right'
}

const MARKERS: Marker[] = [
  { lat: 29.5955, lng: -89.9067, label: 'Home Base',         letter: 'H', color: '#0d2b3e', borderColor: '#e8923a', textColor: '#e8923a', direction: 'right'  },
  { lat: 29.5534, lng: -89.9539, label: 'INNISFREE',         letter: 'I', color: '#e8923a', borderColor: '#0d2b3e', textColor: '#0d2b3e', direction: 'left'   },
  { lat: 29.5549, lng: -89.9545, label: "Sam's Bait By You", letter: 'S', color: '#e8923a', borderColor: '#0d2b3e', textColor: '#0d2b3e', direction: 'bottom' },
]

export default function LeafletMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (instanceRef.current || !mapRef.current) return
    let mounted = true

    // Dynamic import — Leaflet is SSR-unsafe
    void (async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (!mounted || !mapRef.current) return

      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl

      const center: [number, number] = [29.574, -89.930]
      const map = L.map(mapRef.current as HTMLElement, {
        center,
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false,
      })

      // CARTO's raster basemap now returns an "API KEY REQUIRED" tile, so this uses Esri's keyless dark canvas.
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri, HERE, Garmin, FAO, NOAA, USGS',
          maxZoom: 16,
        }
      ).addTo(map)
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 16, pane: 'overlayPane' }
      ).addTo(map)

      MARKERS.forEach((m) => {
        const { lat, lng, label } = m
        const icon = L.divIcon({
          html: `<div style="
            width:22px;height:22px;border-radius:50%;
            background:${m.color};
            border:2px solid ${m.borderColor};
            box-shadow:0 0 8px rgba(232,146,58,0.5), 0 2px 4px rgba(0,0,0,0.4);
            display:flex;align-items:center;justify-content:center;
            font-family:'Playfair Display',serif;
            font-size:11px;font-weight:700;
            color:${m.textColor};
            letter-spacing:0;
            user-select:none;
          ">${m.letter}</div>`,
          className: '',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          popupAnchor: [0, -13],
        })
        const marker = L.marker([lat, lng], { icon }).addTo(map)
        marker.bindPopup(
          `<strong style="font-family:'Playfair Display',serif;color:#0d2b3e">${label}</strong>`,
          { maxWidth: 180 }
        )
        marker.bindTooltip(label, {
          permanent: true,
          direction: m.direction,
          offset: m.direction === 'top'    ? L.point(0, -12)
                : m.direction === 'bottom' ? L.point(0,   8)
                : m.direction === 'left'   ? L.point(-12, 0)
                :                            L.point( 12, 0),
          className: 'leaflet-label',
        })
      })

      instanceRef.current = map
    })()

    return () => {
      mounted = false
      if (instanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(instanceRef.current as any).remove()
        instanceRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ isolation: 'isolate' }}>
      <style>{`
        .leaflet-tooltip.leaflet-label {
          background: rgba(13, 43, 62, 0.95);
          color: #eef6fb;
          border: 1px solid rgba(201, 168, 76, 0.5);
          border-radius: 6px;
          padding: 6px 14px;
          font-family: 'Lora', serif;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          letter-spacing: 0.02em;
        }
        .leaflet-tooltip.leaflet-label::before {
          display: none;
        }
      `}</style>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-3 text-sm font-serif font-semibold text-text-dark dark:text-cream">
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
            style={{ background: '#0d2b3e', border: '2px solid #e8923a', color: '#e8923a' }}>H</span>
          Home Base
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
            style={{ background: '#e8923a', border: '2px solid #0d2b3e', color: '#0d2b3e' }}>I</span>
          INNISFREE
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
            style={{ background: '#e8923a', border: '2px solid #0d2b3e', color: '#0d2b3e' }}>S</span>
          Sam&rsquo;s Bait By You
        </span>
      </div>
      <div
        ref={mapRef}
        className="w-full rounded-2xl overflow-hidden shadow-xl"
        style={{ height: '420px' }}
        aria-label="Map showing Home Base, INNISFREE, and Sam's Bait By You locations"
        role="region"
      />
    </div>
  )
}
