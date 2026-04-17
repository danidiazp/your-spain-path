import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { toast } from "sonner";

const Profile = () => {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        if (!cancelled) setProfile(data ?? {});
      } catch (e) {
        console.error("profile load error", e);
        if (!cancelled) setProfile({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      nationality: profile.nationality,
      current_country: profile.current_country,
      main_goal: profile.main_goal,
      preferred_language: profile.preferred_language,
    }).eq("id", user.id);
    if (error) toast.error("No se pudo guardar", { description: error.message });
    else toast.success("Perfil actualizado");
    setSaving(false);
  };

  const handleSignOut = async () => { await signOut(); nav("/"); };

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container py-10 lg:py-14 max-w-2xl space-y-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-1.5">Perfil y ajustes</h1>
          <p className="text-muted-foreground">Mantén tu información actualizada para recibir orientación más precisa.</p>
        </div>

        <SubscriptionCard />
        <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-elegant space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input id="full_name" value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nationality">Nacionalidad</Label>
              <Input id="nationality" value={profile.nationality ?? ""} onChange={(e) => setProfile({ ...profile, nationality: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="current_country">País de residencia</Label>
              <Input id="current_country" value={profile.current_country ?? ""} onChange={(e) => setProfile({ ...profile, current_country: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Objetivo migratorio</Label>
            <Select value={profile.main_goal ?? ""} onValueChange={(v) => setProfile({ ...profile, main_goal: v })}>
              <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="study">Estudiar</SelectItem>
                <SelectItem value="work">Trabajar</SelectItem>
                <SelectItem value="family">Reagrupación familiar</SelectItem>
                <SelectItem value="explore">Aún explorando</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Idioma preferido</Label>
            <Select value={profile.preferred_language ?? "es"} onValueChange={(v) => setProfile({ ...profile, preferred_language: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en" disabled>English (próximamente)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <Button variant="hero" onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>
            <Button variant="ghost" onClick={handleSignOut}>Cerrar sesión</Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Profile;
