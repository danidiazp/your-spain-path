import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { HeroGlobe } from "@/components/HeroGlobe";
import { GraduationCap, Briefcase, Users, ShieldCheck, Compass, ListChecks, Map } from "lucide-react";
import { track } from "@/lib/analytics";

const ROUTES_PREVIEW = [
  {
    slug: "estudios",
    icon: GraduationCap,
    name: "Estudios",
    desc: "Visado de estancia para cursar estudios reglados en España.",
    accent: "from-primary/10 to-primary/5",
  },
  {
    slug: "trabajo",
    icon: Briefcase,
    name: "Trabajo",
    desc: "Autorización de residencia y trabajo iniciada por el empleador.",
    accent: "from-accent/15 to-accent/5",
  },
  {
    slug: "reagrupacion-familiar",
    icon: Users,
    name: "Reagrupación familiar",
    desc: "Vía para que un residente legal traiga a familiares directos.",
    accent: "from-primary/10 to-accent/10",
  },
];

const STEPS = [
  { icon: Compass, title: "Cuéntanos tu situación", desc: "Responde un diagnóstico breve sobre tu perfil y objetivo migratorio." },
  { icon: Map, title: "Recibe tu ruta personalizada", desc: "Te recomendamos la vía principal y alternativas según tu contexto." },
  { icon: ListChecks, title: "Avanza paso a paso", desc: "Checklist documental, timeline y recursos oficiales en un solo lugar." },
];

const Index = () => {
  useEffect(() => {
    track("landing_viewed");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-60 pointer-events-none" />
        <div className="container relative pt-12 pb-20 lg:pt-20 lg:pb-32 grid lg:grid-cols-12 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            className="lg:col-span-6 space-y-7 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary border border-border text-xs font-medium text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Tu plan migratorio, claro desde el primer paso
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.15] tracking-tight text-balance">
              Encuentra tu mejor camino para venir a{" "}
              <span className="relative inline-block whitespace-nowrap text-primary">
                España
                <svg
                  aria-hidden
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  className="absolute left-0 right-0 -bottom-1 w-full h-2 text-accent/70"
                >
                  <path
                    d="M2 8 Q 50 2, 100 6 T 198 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 text-pretty">
              Descubre qué opción encaja contigo, qué documentos necesitas y qué pasos seguir para convertir tu plan en una realidad.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
              <Button asChild variant="hero" size="xl">
                <Link to="/diagnostico">
                  Empezar diagnóstico
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/rutas/estudios">Explorar rutas</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-center lg:justify-start pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Información de fuentes oficiales</div>
              <div className="flex items-center gap-2"><Compass className="h-4 w-4 text-primary" />Sin compromiso, sin coste</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="lg:col-span-6"
          >
            <HeroGlobe />
          </motion.div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="container py-20 lg:py-28">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-primary uppercase tracking-[0.18em] mb-3">Cómo funciona</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
            De la incertidumbre a un plan claro en tres pasos
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative bg-card border border-border rounded-3xl p-7 hover:shadow-premium transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-7 right-7 font-display text-5xl font-semibold text-secondary leading-none">0{i + 1}</div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-primary grid place-items-center mb-6 shadow-elegant">
                <s.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* RUTAS */}
      <section className="container py-20 lg:py-28 border-t border-border/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary uppercase tracking-[0.18em] mb-3">Rutas disponibles</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
              Tres vías reales para empezar tu vida en España
            </h2>
          </div>
          <p className="text-muted-foreground max-w-md">
            Cada ruta tiene sus propios requisitos, tiempos y documentos. Te ayudamos a identificar la que mejor encaja con tu perfil.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {ROUTES_PREVIEW.map((r, i) => (
            <motion.div
              key={r.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Link
                to={`/rutas/${r.slug}`}
                className="group block h-full bg-card border border-border rounded-3xl p-7 hover:shadow-premium transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
              >
                <div className={`absolute -top-20 -right-20 h-48 w-48 rounded-full bg-gradient-to-br ${r.accent} blur-2xl`} />
                <div className="relative">
                  <div className="h-12 w-12 rounded-2xl bg-secondary border border-border grid place-items-center mb-6 group-hover:bg-primary group-hover:border-primary transition-colors">
                    <r.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-2">{r.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">{r.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 transition-all">
                    Ver detalles <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* DASHBOARD BENEFITS */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="bg-gradient-primary rounded-[2rem] p-10 lg:p-16 relative overflow-hidden shadow-deep">
            <div className="absolute top-0 right-0 h-72 w-72 bg-accent/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 bg-primary-glow/40 rounded-full blur-3xl" />
            <div className="relative grid lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-5 text-primary-foreground">
                <p className="text-sm font-medium uppercase tracking-[0.18em] opacity-80">Tu dashboard personal</p>
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
                  Todo tu proceso en un solo lugar
                </h2>
                <p className="opacity-85 text-lg max-w-xl">
                  Crea una cuenta gratuita y obtén un panel con tu ruta elegida, checklist documental, próximos pasos y recursos oficiales.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <Button asChild variant="accent" size="lg">
                    <Link to="/diagnostico">Empezar gratis</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                    <Link to="/auth">Ya tengo cuenta</Link>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {["Resumen del caso", "Checklist documental", "Timeline del proceso", "Recursos oficiales", "Próximo paso", "Tareas personales"].map((m) => (
                  <div key={m} className="bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/15 rounded-2xl p-4 text-primary-foreground text-sm font-medium">
                    {m}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONFIANZA */}
      <section className="container py-16 border-t border-border/60">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <p className="text-sm font-medium text-primary uppercase tracking-[0.18em]">Información oficial</p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold">
            Construido sobre fuentes oficiales del Gobierno de España
          </h2>
          <p className="text-muted-foreground text-pretty">
            Trabajamos con la información publicada por el Ministerio de Asuntos Exteriores, el Portal de Inmigración, la Sede Electrónica de Administraciones Públicas y la Policía Nacional.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          {["Ministerio de Asuntos Exteriores", "Portal de Inmigración", "Sede Electrónica AGE", "Policía Nacional", "Ministerio de Justicia"].map((s) => (
            <span key={s} className="px-4 py-2 rounded-full bg-secondary border border-border">{s}</span>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="container py-20 lg:py-24">
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
            ¿Listo para descubrir tu ruta?
          </h2>
          <p className="text-lg text-muted-foreground">
            En menos de 2 minutos sabrás cuál es la vía más adecuada para tu situación.
          </p>
          <Button asChild variant="hero" size="xl">
            <Link to="/diagnostico">Empezar mi diagnóstico <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Index;
