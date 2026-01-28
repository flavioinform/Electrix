-- ============================================
-- MIGRACIÓN: Sistema de Comentarios e Imágenes para Viviendas
-- Y Sistema de Usuarios Cliente
-- Ejecutar este script en Supabase SQL Editor
-- ============================================

-- 1. Agregar campo 'rol' a tabla trabajadores (para usuarios cliente)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trabajadores' AND column_name = 'rol'
    ) THEN
        ALTER TABLE trabajadores 
        ADD COLUMN rol TEXT DEFAULT 'trabajador' 
        CHECK (rol IN ('admin', 'trabajador', 'cliente'));
    END IF;
END $$;

-- 2. Agregar campos a tabla clientes (para vincular usuario y permisos de fotos)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' AND column_name = 'puede_ver_fotos'
    ) THEN
        ALTER TABLE clientes 
        ADD COLUMN puede_ver_fotos BOOLEAN DEFAULT false;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' AND column_name = 'usuario_id'
    ) THEN
        ALTER TABLE clientes 
        ADD COLUMN usuario_id UUID REFERENCES trabajadores(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Agregar campo de comentarios a tabla viviendas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'viviendas' AND column_name = 'comentarios'
    ) THEN
        ALTER TABLE viviendas 
        ADD COLUMN comentarios TEXT;
    END IF;
END $$;

-- 4. Crear tabla de imágenes de viviendas
CREATE TABLE IF NOT EXISTS vivienda_imagenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vivienda_id UUID NOT NULL REFERENCES viviendas(id) ON DELETE CASCADE,
  imagen_url TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Crear índice para mejor rendimiento
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_vivienda_imagenes_vivienda'
    ) THEN
        CREATE INDEX idx_vivienda_imagenes_vivienda ON vivienda_imagenes(vivienda_id);
    END IF;
END $$;

-- 6. Habilitar RLS en nueva tabla
ALTER TABLE vivienda_imagenes ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas de acceso para imágenes (eliminar si existen primero)
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver imágenes" ON vivienda_imagenes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear imágenes" ON vivienda_imagenes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar imágenes" ON vivienda_imagenes;

CREATE POLICY "Usuarios autenticados pueden ver imágenes" ON vivienda_imagenes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear imágenes" ON vivienda_imagenes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar imágenes" ON vivienda_imagenes
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- Descomentar para crear usuarios de prueba

-- -- Usuario Admin
-- INSERT INTO trabajadores (nombre, rut, telefono, especialidad, rol, activo) 
-- VALUES ('Admin Sistema', '11111111-1', '+56911111111', 'Supervisor', 'admin', true)
-- ON CONFLICT (rut) DO NOTHING;

-- -- Usuario Trabajador
-- INSERT INTO trabajadores (nombre, rut, telefono, especialidad, rol, activo) 
-- VALUES ('Trabajador Prueba', '22222222-2', '+56922222222', 'Electricista', 'trabajador', true)
-- ON CONFLICT (rut) DO NOTHING;

-- -- Usuario Cliente (vinculado a Constructora Sygma)
-- INSERT INTO trabajadores (nombre, rut, telefono, especialidad, rol, activo) 
-- VALUES ('Cliente Sygma', '33333333-3', '+56933333333', NULL, 'cliente', true)
-- ON CONFLICT (rut) DO NOTHING;

-- -- Vincular cliente con usuario y habilitar fotos
-- UPDATE clientes 
-- SET usuario_id = (SELECT id FROM trabajadores WHERE rut = '33333333-3'),
--     puede_ver_fotos = true
-- WHERE nombre = 'Constructora Sygma';

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT 'Verificando columna rol en trabajadores...' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trabajadores' AND column_name = 'rol';

SELECT 'Verificando columnas en clientes...' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clientes' AND column_name IN ('puede_ver_fotos', 'usuario_id');

SELECT 'Verificando columna comentarios en viviendas...' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'viviendas' AND column_name = 'comentarios';

SELECT 'Verificando tabla vivienda_imagenes...' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'vivienda_imagenes';

SELECT 'Verificando políticas RLS...' as status;
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'vivienda_imagenes';

-- ============================================
-- CONFIGURACIÓN DE STORAGE (MANUAL)
-- ============================================

-- IMPORTANTE: Después de ejecutar este script, debes:
-- 1. Ir a Supabase Dashboard → Storage
-- 2. Crear un nuevo bucket llamado 'viviendas'
-- 3. Configurarlo como público
-- 4. Ejecutar las siguientes políticas en la pestaña "Policies" de Storage:

/*
-- Política para subir archivos
CREATE POLICY "Usuarios autenticados pueden subir imágenes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'viviendas');

-- Política para ver archivos
CREATE POLICY "Imágenes son públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'viviendas');

-- Política para eliminar archivos
CREATE POLICY "Usuarios autenticados pueden eliminar imágenes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'viviendas');
*/
