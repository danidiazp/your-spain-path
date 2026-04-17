import { useEffect, useRef, useState } from "react";

// Origen → Madrid (lat 40.4168, lon -3.7038)
const ARCS = [
  { startLat: 19.4326, startLng: -99.1332, label: "Ciudad de México" },
  { startLat: -34.6037, startLng: -58.3816, label: "Buenos Aires" },
  { startLat: 4.7110, startLng: -74.0721, label: "Bogotá" },
  { startLat: -12.0464, startLng: -77.0428, label: "Lima" },
  { startLat: -23.5505, startLng: -46.6333, label: "São Paulo" },
  { startLat: 6.5244, startLng: 3.3792, label: "Lagos" },
  { startLat: 33.5731, startLng: -7.5898, label: "Casablanca" },
  { startLat: 28.6139, startLng: 77.2090, label: "Nueva Delhi" },
  { startLat: 31.2304, startLng: 121.4737, label: "Shanghái" },
  { startLat: 41.0082, startLng: 28.9784, label: "Estambul" },
  { startLat: 14.5995, startLng: 120.9842, label: "Manila" },
].map((c) => ({
  ...c,
  endLat: 40.4168,
  endLng: -3.7038,
  color: ["hsl(184, 50%, 50%)", "hsl(18, 55%, 65%)"],
}));

const POINTS = [
  { lat: 40.4168, lng: -3.7038, label: "Madrid", size: 0.9, color: "hsl(18, 55%, 58%)" },
  ...ARCS.map((a) => ({ lat: a.startLat, lng: a.startLng, label: a.label, size: 0.4, color: "hsl(188, 60%, 35%)" })),
];

export const HeroGlobe = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [GlobeComp, setGlobeComp] = useState<any>(null);
  const [size, setSize] = useState({ w: 600, h: 600 });

  // Lazy import to avoid blocking initial render
  useEffect(() => {
    let mounted = true;
    import("react-globe.gl").then((m) => {
      if (mounted) setGlobeComp(() => m.default);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setSize({ w, h: w });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.45;
      controls.enableZoom = false;
    }
    globeRef.current.pointOfView({ lat: 25, lng: -10, altitude: 2.2 }, 0);
  }, [GlobeComp]);

  return (
    <div ref={containerRef} className="globe-container relative w-full aspect-square max-w-[600px] mx-auto">
      {/* Soft glow backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 rounded-full blur-3xl" />
      {GlobeComp ? (
        <GlobeComp
          ref={globeRef}
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere
          atmosphereColor="hsl(184, 50%, 60%)"
          atmosphereAltitude={0.18}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
          arcsData={ARCS}
          arcColor={"color"}
          arcAltitudeAutoScale={0.4}
          arcStroke={0.4}
          arcDashLength={0.5}
          arcDashGap={1.2}
          arcDashAnimateTime={2800}
          pointsData={POINTS}
          pointColor={"color"}
          pointAltitude={0.012}
          pointRadius={"size"}
          pointsMerge={true}
        />
      ) : (
        <div className="absolute inset-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
      )}
    </div>
  );
};
