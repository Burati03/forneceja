ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS imagens text[] NOT NULL DEFAULT '{}';
UPDATE public.produtos SET imagens = ARRAY[imagem_path] WHERE imagem_path IS NOT NULL AND cardinality(imagens) = 0;
ALTER TABLE public.produtos ADD CONSTRAINT produtos_imagens_max20 CHECK (cardinality(imagens) <= 20);