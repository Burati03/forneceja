REVOKE EXECUTE ON FUNCTION public.meu_tipo() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_resposta() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ver_produto(bigint) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mudar_status(bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.meu_tipo() TO authenticated;