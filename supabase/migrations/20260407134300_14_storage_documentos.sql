-- ============================================================
-- MIGRACIÓN 14: Storage — Bucket 'documentos' y políticas RLS
-- ============================================================

-- 1. Crear bucket privado para documentos de solicitudes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  FALSE,
  5242880, -- 5MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política: usuarios autenticados pueden subir archivos
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documentos');

-- 3. Política: usuarios autenticados pueden ver archivos del bucket
CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documentos');

-- 4. Política: usuarios autenticados pueden actualizar sus archivos
CREATE POLICY "Authenticated users can update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documentos');
