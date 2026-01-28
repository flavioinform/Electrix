-- ============================================
-- MIGRACIÓN: Mejoras al Sistema de Flujo de Caja
-- Ejecutar este script en Supabase SQL Editor
-- ============================================

-- 1. Agregar campo 'rol' a tabla trabajadores
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

-- 2. Agregar campos a tabla transacciones
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transacciones' AND column_name = 'categoria_gasto'
    ) THEN
        ALTER TABLE transacciones 
        ADD COLUMN categoria_gasto TEXT 
        CHECK (categoria_gasto IN ('bomba_agua', 'soldadura', 'artefactado', 'pruebas_electricas', 'rotulado', 'otro'));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transacciones' AND column_name = 'comentarios'
    ) THEN
        ALTER TABLE transacciones 
        ADD COLUMN comentarios TEXT;
    END IF;
END $$;

-- 3. Agregar campos a tabla clientes
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

-- 4. Crear tabla de imágenes de transacciones
CREATE TABLE IF NOT EXISTS transaccion_imagenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaccion_id UUID NOT NULL REFERENCES transacciones(id) ON DELETE CASCADE,
  imagen_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Crear índice para mejor rendimiento
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_transaccion_imagenes_transaccion'
    ) THEN
        CREATE INDEX idx_transaccion_imagenes_transaccion ON transaccion_imagenes(transaccion_id);
    END IF;
END $$;

-- 6. Habilitar RLS en nueva tabla
ALTER TABLE transaccion_imagenes ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas de acceso para imágenes (eliminar si existen primero)
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver imágenes" ON transaccion_imagenes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear imágenes" ON transaccion_imagenes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar imágenes" ON transaccion_imagenes;

CREATE POLICY "Usuarios autenticados pueden ver imágenes" ON transaccion_imagenes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear imágenes" ON transaccion_imagenes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar imágenes" ON transaccion_imagenes
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

-- -- Usuario Cliente
-- INSERT INTO trabajadores (nombre, rut, telefono, especialidad, rol, activo) 
-- VALUES ('Cliente Prueba', '33333333-3', '+56933333333', NULL, 'cliente', true)
-- ON CONFLICT (rut) DO NOTHING;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las columnas se agregaron correctamente
SELECT 'Verificando columna rol en trabajadores...' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trabajadores' AND column_name = 'rol';

SELECT 'Verificando columnas en transacciones...' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transacciones' AND column_name IN ('categoria_gasto', 'comentarios');

SELECT 'Verificando columnas en clientes...' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clientes' AND column_name IN ('puede_ver_fotos', 'usuario_id');

SELECT 'Verificando tabla transaccion_imagenes...' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'transaccion_imagenes';

SELECT 'Verificando políticas RLS...' as status;
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'transaccion_imagenes';

-- ============================================
-- CONFIGURACIÓN DE STORAGE (MANUAL)
-- ============================================

-- IMPORTANTE: Después de ejecutar este script, debes:
-- 1. Ir a Supabase Dashboard → Storage
-- 2. Crear un nuevo bucket llamado 'transacciones'
-- 3. Configurarlo como público
-- 4. Ejecutar las siguientes políticas en la pestaña "Policies" de Storage:

/*
-- Política para subir archivos
CREATE POLICY "Usuarios autenticados pueden subir imágenes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'transacciones');

-- Política para ver archivos
CREATE POLICY "Imágenes son públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'transacciones');

-- Política para eliminar archivos
CREATE POLICY "Usuarios autenticados pueden eliminar imágenes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'transacciones');
*/
