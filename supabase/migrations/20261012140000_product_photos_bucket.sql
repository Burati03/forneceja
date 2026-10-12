INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fotos-produtos', 'fotos-produtos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "product photos read" ON storage.objects;
CREATE POLICY "product photos read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'fotos-produtos');

DROP POLICY IF EXISTS "product photos upload own" ON storage.objects;
CREATE POLICY "product photos upload own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'fotos-produtos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.meu_tipo() = 'f'
  );

DROP POLICY IF EXISTS "product photos replace own" ON storage.objects;
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

DROP POLICY IF EXISTS "product photos delete own" ON storage.objects;
CREATE POLICY "product photos delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'fotos-produtos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.meu_tipo() = 'f'
  );
