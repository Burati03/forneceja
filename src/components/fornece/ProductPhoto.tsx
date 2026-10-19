import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export function ProductPhoto({ path, alt, fallback }: { path: string | null; alt: string; fallback: ReactNode }) {
  const [photo, setPhoto] = useState<{ path: string; url: string } | null>(null);
  useEffect(() => {
    if (!path) return;
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.storage.from("fotos-produtos").createSignedUrl(path, 3600);
      if (active && !error && data) setPhoto({ path, url: data.signedUrl });
    };
    void load();
    const refresh = window.setInterval(() => void load(), 3000000);
    return () => { active = false; window.clearInterval(refresh); };
  }, [path]);
  return photo?.path === path ? <img src={photo.url} alt={alt} /> : <>{fallback}</>;
}