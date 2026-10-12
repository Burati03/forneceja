ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tipos text[] NOT NULL DEFAULT '{}';

UPDATE public.profiles
SET tipos = ARRAY[tipo]
WHERE cardinality(tipos) = 0;

CREATE OR REPLACE FUNCTION public.profiles_tipos_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tipo NOT IN ('f', 'e') THEN
    RAISE EXCEPTION 'tipo inválido';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF auth.role() = 'service_role' THEN
      NEW.tipos := ARRAY(
        SELECT DISTINCT role_name
        FROM unnest(coalesce(NEW.tipos, '{}'::text[]) || ARRAY[NEW.tipo]) AS role_name
        WHERE role_name IN ('f', 'e')
      );
    ELSE
      NEW.tipos := ARRAY[NEW.tipo];
    END IF;
  ELSIF auth.role() = 'service_role' THEN
    NEW.tipos := ARRAY(
      SELECT DISTINCT role_name
      FROM unnest(coalesce(NEW.tipos, OLD.tipos) || ARRAY[NEW.tipo]) AS role_name
      WHERE role_name IN ('f', 'e')
    );
  ELSE
    IF NEW.tipo IS DISTINCT FROM OLD.tipo
      AND NOT (NEW.tipo = ANY(coalesce(OLD.tipos, '{}'::text[]))) THEN
      RAISE EXCEPTION 'Este tipo de perfil não está habilitado para a conta';
    END IF;
    NEW.tipos := OLD.tipos;
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_profiles_tipos ON public.profiles;
CREATE TRIGGER trg_profiles_tipos
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_tipos_sync();

CREATE OR REPLACE FUNCTION public.proteger_tipo_conta()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_seed IS DISTINCT FROM OLD.is_seed THEN
    RAISE EXCEPTION 'O tipo de conta não pode ser alterado';
  END IF;
  IF NEW.tipo IS DISTINCT FROM OLD.tipo
    AND NOT (NEW.tipo = ANY(coalesce(OLD.tipos, '{}'::text[])))
    AND auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Este tipo de perfil não está habilitado para a conta';
  END IF;
  IF NEW.tipos IS DISTINCT FROM OLD.tipos
    AND auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Os tipos de perfil não podem ser alterados diretamente';
  END IF;
  RETURN NEW;
END
$$;

CREATE OR REPLACE FUNCTION public.trocar_tipo_perfil(_tipo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'É necessário entrar na conta';
  END IF;
  IF _tipo NOT IN ('f', 'e') THEN
    RAISE EXCEPTION 'Tipo de perfil inválido';
  END IF;

  UPDATE public.profiles
  SET tipo = _tipo
  WHERE id = auth.uid()
    AND _tipo = ANY(tipos);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este tipo de perfil não está habilitado para a conta';
  END IF;
END
$$;

REVOKE ALL ON FUNCTION public.trocar_tipo_perfil(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.trocar_tipo_perfil(text) TO authenticated;
GRANT SELECT (tipos) ON public.profiles TO authenticated;
