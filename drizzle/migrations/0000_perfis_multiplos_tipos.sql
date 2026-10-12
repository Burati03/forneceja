ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tipos text[] NOT NULL DEFAULT '{}';
UPDATE public.profiles SET tipos = ARRAY[tipo] WHERE cardinality(tipos) = 0;
CREATE OR REPLACE FUNCTION public.profiles_tipos_sync() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.tipo NOT IN ('f','e') THEN RAISE EXCEPTION 'tipo inválido'; END IF;
  NEW.tipos := ARRAY(SELECT DISTINCT x FROM unnest(coalesce(NEW.tipos,'{}') || ARRAY[NEW.tipo]) x WHERE x IN ('f','e'));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_profiles_tipos ON public.profiles;
CREATE TRIGGER trg_profiles_tipos BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_tipos_sync();