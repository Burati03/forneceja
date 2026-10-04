ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS telefone_publico text,
  ADD COLUMN IF NOT EXISTS endereco text;

UPDATE public.profiles p
SET cnpj = CASE
      WHEN length(regexp_replace(coalesce(pp.documento, ''), '[^0-9]', '', 'g')) = 14
        THEN regexp_replace(pp.documento, '[^0-9]', '', 'g')
      ELSE NULL
    END,
    telefone_publico = pp.telefone
FROM public.profiles_private pp
WHERE pp.id = p.id
  AND p.tipo = 'f'
  AND pp.documento_tipo = 'cnpj';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_supplier_business_fields_check
  CHECK (
    tipo = 'f'
    OR (cnpj IS NULL AND telefone_publico IS NULL AND endereco IS NULL)
  ) NOT VALID,
  ADD CONSTRAINT profiles_cnpj_format_check
  CHECK (cnpj IS NULL OR cnpj ~ '^[0-9]{14}$') NOT VALID,
  ADD CONSTRAINT profiles_business_contact_length_check
  CHECK (
    (telefone_publico IS NULL OR length(telefone_publico) <= 30)
    AND (endereco IS NULL OR length(endereco) <= 250)
  ) NOT VALID;

CREATE OR REPLACE FUNCTION public.proteger_tipo_conta()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tipo IS DISTINCT FROM OLD.tipo OR NEW.is_seed IS DISTINCT FROM OLD.is_seed THEN
    RAISE EXCEPTION 'O tipo de conta não pode ser alterado';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER trg_proteger_tipo_conta
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.proteger_tipo_conta();

REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (
  id, tipo, empresa, categoria, cidade, is_seed, criado_em, descricao,
  avatar_path, atuacao, cnpj, telefone_publico, endereco
) ON public.profiles TO authenticated;

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS imagem_path text,
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;
ALTER TABLE public.produtos
  ADD CONSTRAINT produtos_text_limits_check
  CHECK (length(nome) BETWEEN 1 AND 120 AND (descricao IS NULL OR length(descricao) <= 1000)) NOT VALID;

UPDATE public.produtos SET qtd_min = 1 WHERE qtd_min < 1;
ALTER TABLE public.produtos
  ADD CONSTRAINT produtos_qtd_min_positive CHECK (qtd_min > 0);

DROP POLICY IF EXISTS "fav own" ON public.favoritos;
CREATE POLICY "fav own" ON public.favoritos
  FOR ALL TO authenticated
  USING (user_id = auth.uid() AND public.meu_tipo() = 'e')
  WITH CHECK (user_id = auth.uid() AND public.meu_tipo() = 'e');

DROP POLICY IF EXISTS "msg send" ON public.mensagens;
CREATE POLICY "msg send" ON public.mensagens
  FOR INSERT TO authenticated
  WITH CHECK (
    de_id = auth.uid()
    AND para_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles recipient
      WHERE recipient.id = para_id
        AND recipient.tipo <> public.meu_tipo()
    )
  );

DROP POLICY IF EXISTS "produtos update" ON public.produtos;
CREATE POLICY "produtos update" ON public.produtos
  FOR UPDATE TO authenticated
  USING (fornecedor_id = auth.uid() AND public.meu_tipo() = 'f')
  WITH CHECK (fornecedor_id = auth.uid() AND public.meu_tipo() = 'f');

DROP POLICY IF EXISTS "produtos delete" ON public.produtos;
CREATE POLICY "produtos delete" ON public.produtos
  FOR DELETE TO authenticated
  USING (fornecedor_id = auth.uid() AND public.meu_tipo() = 'f');
REVOKE DELETE ON public.produtos FROM authenticated;

DROP POLICY IF EXISTS "ped insert" ON public.pedidos;
CREATE POLICY "ped insert" ON public.pedidos
  FOR INSERT TO authenticated
  WITH CHECK (
    empresario_id = auth.uid()
    AND public.meu_tipo() = 'e'
    AND status = 'Em negociação'
    AND comprador_aceitou
    AND NOT fornecedor_aceitou
    AND pagamento_status = 'nao_iniciado'
    AND mercado_pago_preferencia_id IS NULL
    AND mercado_pago_pagamento_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.produtos p
      WHERE p.id = produto_id
        AND p.ativo
        AND preco_unitario > 0
        AND qtd >= p.qtd_min
        AND p.fornecedor_id <> auth.uid()
    )
  );

ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;
ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_status_check
  CHECK (status IN (
    'Em negociação', 'Contraproposta', 'Aguardando pagamento',
    'Aguardando envio', 'Pago', 'Enviado', 'Recusado'
  ));
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS mensagem_proposta text;
ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_mensagem_proposta_check
  CHECK (mensagem_proposta IS NULL OR length(mensagem_proposta) <= 1000);

CREATE TABLE IF NOT EXISTS public.fornecedores_favoritos (
  comprador_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  fornecedor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comprador_id, fornecedor_id),
  CHECK (comprador_id <> fornecedor_id)
);
ALTER TABLE public.fornecedores_favoritos ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.fornecedores_favoritos TO authenticated;
REVOKE ALL ON public.fornecedores_favoritos FROM PUBLIC, anon;
CREATE POLICY "supplier favorites own" ON public.fornecedores_favoritos
  FOR ALL TO authenticated
  USING (
    comprador_id = auth.uid()
    AND public.meu_tipo() = 'e'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = fornecedor_id AND p.tipo = 'f')
  )
  WITH CHECK (
    comprador_id = auth.uid()
    AND public.meu_tipo() = 'e'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = fornecedor_id AND p.tipo = 'f')
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fotos-produtos', 'fotos-produtos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "product photos read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'fotos-produtos');
CREATE POLICY "product photos upload own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'fotos-produtos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.meu_tipo() = 'f'
  );
CREATE POLICY "product photos replace own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'fotos-produtos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.meu_tipo() = 'f'
  )
  WITH CHECK (
    bucket_id = 'fotos-produtos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.meu_tipo() = 'f'
  );
CREATE POLICY "product photos delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'fotos-produtos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.meu_tipo() = 'f'
  );

CREATE TABLE IF NOT EXISTS public.notificacoes (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN (
    'nova_proposta', 'contraproposta', 'proposta_aceita',
    'proposta_recusada', 'nova_mensagem', 'nova_avaliacao'
  )),
  titulo text NOT NULL,
  texto text NOT NULL,
  pedido_id bigint REFERENCES public.pedidos(id) ON DELETE SET NULL,
  mensagem_id bigint REFERENCES public.mensagens(id) ON DELETE SET NULL,
  avaliacao_id bigint REFERENCES public.avaliacoes(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  lida_em timestamptz
);
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.notificacoes TO authenticated;
REVOKE UPDATE ON public.notificacoes FROM authenticated;
GRANT UPDATE (lida_em) ON public.notificacoes TO authenticated;
CREATE POLICY "notifications read own" ON public.notificacoes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications mark own" ON public.notificacoes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS notificacoes_user_created_idx
  ON public.notificacoes (user_id, criado_em DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notificacoes'
    ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes';
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.notificar_eventos_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _fornecedor uuid;
  _destinatario uuid;
  _tipo text;
  _titulo text;
  _texto text;
  _produto text;
BEGIN
  SELECT p.fornecedor_id, p.nome
  INTO _fornecedor, _produto
  FROM public.produtos p
  WHERE p.id = NEW.produto_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notificacoes (user_id, tipo, titulo, texto, pedido_id)
    VALUES (_fornecedor, 'nova_proposta', 'Nova proposta', 'Você recebeu uma nova proposta para ' || _produto || '.', NEW.id);
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'Contraproposta' THEN
      _destinatario := NEW.empresario_id;
      _tipo := 'contraproposta';
      _titulo := 'Nova contraproposta';
      _texto := 'O fornecedor enviou uma contraproposta para ' || _produto || '.';
    ELSIF NEW.status = 'Aguardando pagamento' THEN
      _destinatario := CASE WHEN auth.uid() = NEW.empresario_id THEN _fornecedor ELSE NEW.empresario_id END;
      _tipo := 'proposta_aceita';
      _titulo := 'Proposta aceita';
      _texto := 'A negociação de ' || _produto || ' foi aceita.';
    ELSIF NEW.status = 'Recusado' THEN
      _destinatario := CASE WHEN auth.uid() = NEW.empresario_id THEN _fornecedor ELSE NEW.empresario_id END;
      _tipo := 'proposta_recusada';
      _titulo := 'Proposta recusada';
      _texto := 'A negociação de ' || _produto || ' foi recusada.';
    END IF;

    IF _destinatario IS NOT NULL THEN
      INSERT INTO public.notificacoes (user_id, tipo, titulo, texto, pedido_id)
      VALUES (_destinatario, _tipo, _titulo, _texto, NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER trg_notificar_eventos_pedido
AFTER INSERT OR UPDATE OF status ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.notificar_eventos_pedido();

CREATE OR REPLACE FUNCTION public.notificar_nova_mensagem()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notificacoes (user_id, tipo, titulo, texto, mensagem_id)
  VALUES (NEW.para_id, 'nova_mensagem', 'Nova mensagem', NEW.texto, NEW.id);
  RETURN NEW;
END
$$;

CREATE TRIGGER trg_notificar_nova_mensagem
AFTER INSERT ON public.mensagens
FOR EACH ROW EXECUTE FUNCTION public.notificar_nova_mensagem();

CREATE OR REPLACE FUNCTION public.notificar_nova_avaliacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notificacoes (user_id, tipo, titulo, texto, avaliacao_id)
  VALUES (NEW.fornecedor_id, 'nova_avaliacao', 'Nova avaliação', 'Você recebeu uma nova avaliação.', NEW.id);
  RETURN NEW;
END
$$;

CREATE TRIGGER trg_notificar_nova_avaliacao
AFTER INSERT ON public.avaliacoes
FOR EACH ROW EXECUTE FUNCTION public.notificar_nova_avaliacao();

CREATE OR REPLACE FUNCTION public.contrapropor_negociacao(
  _id bigint,
  _quantidade integer,
  _preco numeric,
  _mensagem text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _comprador uuid;
  _produto bigint;
  _fornecedor uuid;
  _minimo integer;
  _nome text;
  _unidade text;
BEGIN
  IF _preco IS NULL OR _preco <= 0 OR _quantidade IS NULL OR _quantidade <= 0
    OR _mensagem IS NULL OR length(trim(_mensagem)) NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'Informe quantidade, preço e mensagem válidos';
  END IF;

  SELECT o.empresario_id, o.produto_id, p.fornecedor_id, p.qtd_min, p.nome, p.unidade
  INTO _comprador, _produto, _fornecedor, _minimo, _nome, _unidade
  FROM public.pedidos o
  JOIN public.produtos p ON p.id = o.produto_id
  WHERE o.id = _id AND o.status = 'Em negociação';

  IF NOT FOUND OR _fornecedor <> auth.uid() THEN
    RAISE EXCEPTION 'Negociação indisponível para esta conta';
  END IF;
  IF _quantidade < _minimo THEN
    RAISE EXCEPTION 'A quantidade precisa respeitar o mínimo do produto';
  END IF;

  UPDATE public.pedidos
  SET qtd = _quantidade,
      preco_unitario = _preco,
      status = 'Contraproposta',
      comprador_aceitou = false,
      fornecedor_aceitou = true
  WHERE id = _id;

  INSERT INTO public.mensagens (de_id, para_id, texto)
  VALUES (
    auth.uid(),
    _comprador,
    'Contraproposta para ' || _nome || ': ' || _quantidade || ' ' || _unidade || ' a R$ ' ||
      to_char(_preco, 'FM999999990.00') || '. ' || trim(_mensagem)
  );
END
$$;
REVOKE EXECUTE ON FUNCTION public.contrapropor_negociacao(bigint, integer, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contrapropor_negociacao(bigint, integer, numeric, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.responder_contraproposta(_id bigint, _aceitar boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _aceitar IS NULL THEN
    RAISE EXCEPTION 'Informe se deseja aceitar a contraproposta';
  END IF;

  UPDATE public.pedidos
  SET status = CASE WHEN _aceitar THEN 'Aguardando pagamento' ELSE 'Recusado' END,
      comprador_aceitou = _aceitar,
      fornecedor_aceitou = _aceitar
  WHERE id = _id
    AND empresario_id = auth.uid()
    AND public.meu_tipo() = 'e'
    AND status = 'Contraproposta';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contraproposta indisponível para esta conta';
  END IF;
END
$$;
REVOKE EXECUTE ON FUNCTION public.responder_contraproposta(bigint, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.responder_contraproposta(bigint, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.criar_proposta(
  _produto_id bigint,
  _quantidade integer,
  _preco numeric,
  _mensagem text
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pedido_id bigint;
  _fornecedor uuid;
  _produto text;
  _minimo integer;
  _unidade text;
BEGIN
  IF public.meu_tipo() IS DISTINCT FROM 'e' OR _quantidade IS NULL OR _preco IS NULL
    OR _preco <= 0 OR _quantidade <= 0
    OR _mensagem IS NULL OR length(trim(_mensagem)) NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'Informe quantidade, valor e mensagem válidos';
  END IF;

  SELECT fornecedor_id, nome, qtd_min, unidade
  INTO _fornecedor, _produto, _minimo, _unidade
  FROM public.produtos
  WHERE id = _produto_id AND ativo;

  IF NOT FOUND OR _fornecedor = auth.uid() THEN
    RAISE EXCEPTION 'Produto indisponível para esta conta';
  END IF;
  IF _quantidade < _minimo THEN
    RAISE EXCEPTION 'A quantidade precisa respeitar o mínimo do produto';
  END IF;

  INSERT INTO public.pedidos (
    produto_id, empresario_id, qtd, preco_unitario, comprador_aceitou,
    fornecedor_aceitou, mensagem_proposta
  )
  VALUES (
    _produto_id, auth.uid(), _quantidade, _preco, true, false, trim(_mensagem)
  )
  RETURNING id INTO _pedido_id;

  INSERT INTO public.mensagens (de_id, para_id, texto)
  VALUES (
    auth.uid(),
    _fornecedor,
    'Proposta para ' || _produto || ': ' || _quantidade || ' ' || _unidade || ' a R$ ' ||
      to_char(_preco, 'FM999999990.00') || '. ' || trim(_mensagem)
  );

  RETURN _pedido_id;
END
$$;
REVOKE EXECUTE ON FUNCTION public.criar_proposta(bigint, integer, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.criar_proposta(bigint, integer, numeric, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.aceitar_negociacao(_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.mudar_status(_id bigint, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      (_status = 'Recusado' AND o.status IN ('Em negociação', 'Contraproposta'))
      OR (_status = 'Enviado' AND (
        (o.status = 'Pago' AND o.pagamento_status = 'pago')
        OR o.status = 'Aguardando envio'
      ))
    );

  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido indisponível para esta ação'; END IF;
END
$$;
