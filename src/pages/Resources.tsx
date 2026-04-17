import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { supabase } from "@/integrations/supabase/client";

type Resource = { id: string; title: string; category: string; institution: string | null; url: string };

const Resources = () => {
  const [items, setItems] = useState<Resource[]>([]);
  const [filter, setFilter] = useState<string>("Todos");
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("resources").select("*").order("category").then(({ data }) => setItems((data as Resource[]) ?? []));
  }, []);

  const categories = useMemo(() => ["Todos", ...Array.from(new Set(items.map((i) => i.category)))], [items]);
  const filtered = items.filter((i) => (filter === "Todos" || i.category === filter) && (q === "" || i.title.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-gradient-hero border-b border-border/60">
          <div className="container py-12 lg:py-16 max-w-4xl space-y-4">
            <p className="text-sm font-medium text-primary uppercase tracking-[0.18em]">Biblioteca</p>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold tracking-tight text-balance">Recursos oficiales</h1>
            <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
              Enlaces verificados del Gobierno de España, organismos competentes y plataformas oficiales para tus trámites migratorios.
            </p>
          </div>
        </section>

        <div className="container py-10 max-w-5xl space-y-6">
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar recurso…" className="pl-10 h-11" />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Button key={c} variant={filter === c ? "default" : "soft"} size="sm" onClick={() => setFilter(c)}>
                  {c}
                </Button>
              ))}
            </div>
          </div>

          {/* Lista */}
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.map((r) => (
              <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
                 className="group bg-card border border-border rounded-2xl p-5 hover:shadow-elegant hover:border-primary/30 transition-all flex justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{r.category}</p>
                  <p className="font-medium group-hover:text-primary transition-colors">{r.title}</p>
                  {r.institution && <p className="text-xs text-muted-foreground truncate">{r.institution}</p>}
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              </a>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12 col-span-2">No encontramos recursos con esos filtros.</p>
            )}
          </div>

          <LegalDisclaimer />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Resources;
