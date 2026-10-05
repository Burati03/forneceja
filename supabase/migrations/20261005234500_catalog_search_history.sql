CREATE TABLE public.buscas_usuario (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consulta text NOT NULL CHECK (length(btrim(consulta)) BETWEEN 3 AND 600),
  pesquisado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, consulta)
);

CREATE INDEX buscas_usuario_recent_idx
  ON public.buscas_usuario (user_id, pesquisado_em DESC);

GRANT SELECT, INSERT, UPDATE ON public.buscas_usuario TO authenticated;
ALTER TABLE public.buscas_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buscas_usuario own read"
  ON public.buscas_usuario FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "buscas_usuario own insert"
  ON public.buscas_usuario FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND length(btrim(consulta)) BETWEEN 3 AND 600
  );

CREATE POLICY "buscas_usuario own update"
  ON public.buscas_usuario FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND length(btrim(consulta)) BETWEEN 3 AND 600
  );
