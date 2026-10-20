CREATE OR REPLACE FUNCTION public.excluir_conta(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _peds bigint[]; _prods bigint[];
BEGIN
  IF _user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'Conta não encontrada';
  END IF;
  SELECT coalesce(array_agg(id),'{}') INTO _prods FROM public.produtos WHERE fornecedor_id = _user_id;
  SELECT coalesce(array_agg(id),'{}') INTO _peds FROM public.pedidos WHERE empresario_id = _user_id OR produto_id = ANY(_prods);
  DELETE FROM public.notificacoes WHERE user_id = _user_id OR pedido_id = ANY(_peds)
    OR mensagem_id IN (SELECT id FROM public.mensagens WHERE de_id = _user_id OR para_id = _user_id)
    OR avaliacao_id IN (SELECT id FROM public.avaliacoes WHERE empresario_id = _user_id OR fornecedor_id = _user_id OR pedido_id = ANY(_peds));
  DELETE FROM public.avaliacoes WHERE empresario_id = _user_id OR fornecedor_id = _user_id OR pedido_id = ANY(_peds);
  DELETE FROM public.pedidos WHERE id = ANY(_peds);
  DELETE FROM public.mensagens WHERE de_id = _user_id OR para_id = _user_id;
  DELETE FROM public.favoritos WHERE user_id = _user_id OR produto_id = ANY(_prods);
  DELETE FROM public.fornecedores_favoritos WHERE comprador_id = _user_id OR fornecedor_id = _user_id;
  DELETE FROM public.buscas WHERE user_id = _user_id;
  DELETE FROM public.buscas_usuario WHERE user_id = _user_id;
  DELETE FROM public.mercado_pago_oauth_states WHERE profile_id = _user_id;
  DELETE FROM public.mercado_pago_contas WHERE profile_id = _user_id;
  DELETE FROM public.produtos WHERE id = ANY(_prods);
  DELETE FROM public.profiles_private WHERE id = _user_id;
  DELETE FROM public.profiles WHERE id = _user_id;
  DELETE FROM auth.users WHERE id = _user_id;
END $$;
REVOKE ALL ON FUNCTION public.excluir_conta(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.excluir_conta(uuid) TO service_role;