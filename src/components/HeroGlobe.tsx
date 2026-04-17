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

const StaticFallback = () => (
  <div className="relative w-full aspect-square max-w-[600px] mx-auto">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/15 rounded-full blur-3xl" />
    <div className="absolute inset-6 rounded-full bg-gradient-to-br from-secondary via-card to-accent-soft border border-border shadow-elegant grid place-items-center">
      <div className="text-center space-y-2 px-6">
        <div className="text-6xl">🌍</div>
        <p className="font-display text-xl font-semibold text-primary">Tu camino a España</p>
        <p className="text-xs text-muted-foreground">Conectando perfiles globales con vías oficiales</p>
      </div>
    </div>
  </div>
);

export const HeroGlobe = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [GlobeComp, setGlobeComp] = useState<any>(null);
  const [size, setSize] = useState({ w: 600, h: 600 });
  const [shouldRender, setShouldRender] = useState<boolean | null>(null);

  // Decide if 3D globe should render: skip on small screens, reduced motion, or no canvas.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isSmall = window.matchMedia("(max-width: 768px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setShouldRender(!isSmall && !reduced);
  }, []);

  // Lazy import only when we will render
  useEffect(() => {
    if (!shouldRender) return;
    let mounted = true;
    // Defer to idle to avoid blocking first paint
    const load = () => import("react-globe.gl").then((m) => { if (mounted) setGlobeComp(() => m.default); });
    if ("requestIdleCallback" in window) (window as any).requestIdleCallback(load, { timeout: 1500 });
    else setTimeout(load, 200);
    return () => { mounted = false; };
  }, [shouldRender]);

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
      controls.autoRotate = false; // Empieza quieto, enfoca España
      controls.autoRotateSpeed = 0.25;
      controls.enableZoom = false;
    }
    // Foco inicial: Madrid / Europa occidental
    globeRef.current.pointOfView({ lat: 40.4168, lng: -3.7038, altitude: 2.0 }, 0);
    // Activa rotación suave después de 2.5s para no robar protagonismo al titular
    const t = setTimeout(() => {
      if (controls) controls.autoRotate = true;
    }, 2500);
    return () => clearTimeout(t);
  }, [GlobeComp]);

  if (shouldRender === false) return <StaticFallback />;

  return (
    <div ref={containerRef} className="globe-container relative w-full aspect-square max-w-[600px] mx-auto">
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

