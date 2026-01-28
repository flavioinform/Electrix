-- ELECTRIX - Actualización: Agregar Trabajadores
-- Ejecuta este script DESPUÉS del schema principal

-- ============================================
-- TABLA DE TRABAJADORES
-- ============================================

-- Tabla de trabajadores
CREATE TABLE trabajadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  rut TEXT NOT NULL UNIQUE,
  telefono TEXT,
  especialidad TEXT CHECK (especialidad IN ('Electricista', 'Ayudante', 'Supervisor', 'Técnico')),
  rol TEXT DEFAULT 'trabajador' CHECK (rol IN ('admin', 'trabajador', 'cliente')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de asignaciones de trabajadores a viviendas
CREATE TABLE vivienda_trabajadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vivienda_id UUID NOT NULL REFERENCES viviendas(id) ON DELETE CASCADE,
  trabajador_id UUID NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
  fecha_asignacion DATE DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(vivienda_id, trabajador_id)
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_trabajadores_rut ON trabajadores(rut);
CREATE INDEX idx_trabajadores_activo ON trabajadores(activo);
CREATE INDEX idx_vivienda_trabajadores_vivienda ON vivienda_trabajadores(vivienda_id);
CREATE INDEX idx_vivienda_trabajadores_trabajador ON vivienda_trabajadores(trabajador_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE trabajadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE vivienda_trabajadores ENABLE ROW LEVEL SECURITY;

-- Políticas para trabajadores
CREATE POLICY "Usuarios autenticados pueden ver trabajadores" ON trabajadores
  FOR SELECT TO authenticated USING (true);

-- Permitir que usuarios anónimos (durante registro) puedan crear su perfil
CREATE POLICY "Usuarios pueden crear su propio perfil" ON trabajadores
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar trabajadores" ON trabajadores
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar trabajadores" ON trabajadores
  FOR DELETE TO authenticated USING (true);

-- Políticas para asignaciones
CREATE POLICY "Usuarios autenticados pueden ver asignaciones" ON vivienda_trabajadores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear asignaciones" ON vivienda_trabajadores
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar asignaciones" ON vivienda_trabajadores
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar asignaciones" ON vivienda_trabajadores
  FOR DELETE TO authenticated USING (true);

-- Tabla de imágenes de transacciones
CREATE TABLE transaccion_imagenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaccion_id UUID NOT NULL REFERENCES transacciones(id) ON DELETE CASCADE,
  imagen_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- ÍNDICES ADICIONALES
-- ============================================

CREATE INDEX idx_transaccion_imagenes_transaccion ON transaccion_imagenes(transaccion_id);

-- ============================================
-- RLS PARA IMÁGENES
-- ============================================

ALTER TABLE transaccion_imagenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver imágenes" ON transaccion_imagenes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear imágenes" ON transaccion_imagenes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar imágenes" ON transaccion_imagenes
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- Descomentar para agregar trabajadores de ejemplo

-- INSERT INTO trabajadores (nombre, rut, telefono, especialidad, rol, activo) VALUES
--   ('Juan Pérez', '12345678-9', '+56912345678', 'Electricista', 'admin', true),
--   ('María González', '98765432-1', '+56987654321', 'Técnico', 'trabajador', true),
--   ('Pedro Rodríguez', '11223344-5', '+56911223344', 'Ayudante', 'trabajador', true),
--   ('Ana Martínez', '55667788-9', '+56955667788', 'Supervisor', 'trabajador', true);
