CREATE OR REPLACE FUNCTION public.excluir_conta(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = _user_id
  ) THEN
    RAISE EXCEPTION 'Conta não encontrada';
  END IF;

  DELETE FROM public.favoritos WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE id = _user_id;
  DELETE FROM auth.users WHERE id = _user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Não foi possível remover a conta de autenticação';
  END IF;
END
$$;

REVOKE ALL ON FUNCTION public.excluir_conta(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.excluir_conta(uuid) TO service_role;
