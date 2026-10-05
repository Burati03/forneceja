ALTER TABLE public.pedidos
  ADD COLUMN comprador_aceitou boolean NOT NULL DEFAULT false,
  ADD COLUMN fornecedor_aceitou boolean NOT NULL DEFAULT false,
  ADD COLUMN preco_unitario numeric(12,2),
  ADD COLUMN pagamento_status text NOT NULL DEFAULT 'nao_iniciado'
    CHECK (pagamento_status IN ('nao_iniciado', 'pendente', 'pago', 'falhou', 'estornado')),
  ADD COLUMN mercado_pago_preferencia_id text,
  ADD COLUMN mercado_pago_pagamento_id text;

UPDATE public.pedidos
SET comprador_aceitou = true,
    fornecedor_aceitou = status IN ('Aguardando envio', 'Enviado'),
    preco_unitario = produtos.preco
FROM public.produtos
WHERE produtos.id = pedidos.produto_id;

ALTER TABLE public.pedidos
  ALTER COLUMN preco_unitario SET NOT NULL,
  ADD CONSTRAINT pedidos_preco_unitario_check CHECK (preco_unitario > 0);

ALTER TABLE public.pedidos DROP CONSTRAINT pedidos_status_check;
ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_status_check
  CHECK (status IN ('Em negociação', 'Aguardando pagamento', 'Aguardando envio', 'Pago', 'Enviado', 'Recusado'));

DROP POLICY "ped insert" ON public.pedidos;
CREATE POLICY "ped insert" ON public.pedidos FOR INSERT TO authenticated WITH CHECK (
  empresario_id = auth.uid()
  AND public.meu_tipo() = 'e'
  AND status = 'Em negociação'
  AND NOT comprador_aceitou
  AND NOT fornecedor_aceitou
  AND pagamento_status = 'nao_iniciado'
  AND mercado_pago_preferencia_id IS NULL
  AND mercado_pago_pagamento_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.produtos p
    WHERE p.id = produto_id AND p.preco = preco_unitario
  )
);

CREATE TABLE public.mercado_pago_contas (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  mp_user_id text NOT NULL UNIQUE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mercado_pago_contas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mercado_pago_contas FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.mercado_pago_contas TO service_role;

CREATE TABLE public.mercado_pago_oauth_states (
  state text PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
ALTER TABLE public.mercado_pago_oauth_states ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mercado_pago_oauth_states FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.mercado_pago_oauth_states TO service_role;

CREATE OR REPLACE FUNCTION public.mercado_pago_conectado()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.mercado_pago_contas WHERE profile_id = auth.uid())
$$;
REVOKE EXECUTE ON FUNCTION public.mercado_pago_conectado() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mercado_pago_conectado() TO authenticated;

CREATE OR REPLACE FUNCTION public.aceitar_negociacao(_id bigint)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.pedidos o
  SET comprador_aceitou = CASE WHEN o.empresario_id = auth.uid() THEN true ELSE o.comprador_aceitou END,
      fornecedor_aceitou = CASE WHEN p.fornecedor_id = auth.uid() THEN true ELSE o.fornecedor_aceitou END
  FROM public.produtos p
  WHERE o.id = _id
    AND p.id = o.produto_id
    AND o.status = 'Em negociação'
    AND (o.empresario_id = auth.uid() OR p.fornecedor_id = auth.uid());

  IF NOT FOUND THEN RAISE EXCEPTION 'Negociação indisponível'; END IF;

  UPDATE public.pedidos
  SET status = 'Aguardando pagamento'
  WHERE id = _id
    AND comprador_aceitou
    AND fornecedor_aceitou
    AND status = 'Em negociação';
END
$$;
REVOKE EXECUTE ON FUNCTION public.aceitar_negociacao(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aceitar_negociacao(bigint) TO authenticated;

CREATE OR REPLACE FUNCTION public.mudar_status(_id bigint, _status text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF _status NOT IN ('Enviado', 'Recusado') THEN RAISE EXCEPTION 'Status inválido'; END IF;

  UPDATE public.pedidos o
  SET status = _status
  FROM public.produtos p
  WHERE o.id = _id
    AND p.id = o.produto_id
    AND p.fornecedor_id = auth.uid()
    AND (
      (_status = 'Recusado' AND o.status = 'Em negociação')
      OR (_status = 'Enviado' AND (
        (o.status = 'Pago' AND o.pagamento_status = 'pago')
        OR o.status = 'Aguardando envio'
      ))
    );

  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido indisponível para esta ação'; END IF;
END
$$;
REVOKE EXECUTE ON FUNCTION public.mudar_status(bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mudar_status(bigint, text) TO authenticated;