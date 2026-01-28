-- ELECTRIX - Supabase Database Schema
-- Ejecuta este script completo en el SQL Editor de Supabase

-- ============================================
-- TABLAS
-- ============================================

-- Tabla de clientes
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Constructora', 'Particular', 'Empresa')),
  puede_ver_fotos BOOLEAN DEFAULT false,
  usuario_id UUID REFERENCES trabajadores(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de proyectos
CREATE TABLE proyectos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de viviendas
CREATE TABLE viviendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  factibilidad BOOLEAN DEFAULT false,
  te1 BOOLEAN DEFAULT false,
  empalme BOOLEAN DEFAULT false,
  tda BOOLEAN DEFAULT false,
  canalizacion BOOLEAN DEFAULT false,
  cableado BOOLEAN DEFAULT false,
  detalles TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de transacciones
CREATE TABLE transacciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  monto NUMERIC NOT NULL CHECK (monto >= 0),
  descripcion TEXT NOT NULL,
  fecha DATE NOT NULL,
  categoria_gasto TEXT CHECK (categoria_gasto IN ('bomba_agua', 'soldadura', 'artefactado', 'pruebas_electricas', 'rotulado', 'otro')),
  comentarios TEXT,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_proyectos_cliente ON proyectos(cliente_id);
CREATE INDEX idx_viviendas_proyecto ON viviendas(proyecto_id);
CREATE INDEX idx_transacciones_fecha ON transacciones(fecha);
CREATE INDEX idx_transacciones_cliente ON transacciones(cliente_id);
CREATE INDEX idx_transacciones_proyecto ON transacciones(proyecto_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE viviendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS DE ACCESO - CLIENTES
-- ============================================

CREATE POLICY "Usuarios autenticados pueden ver clientes" ON clientes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear clientes" ON clientes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar clientes" ON clientes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar clientes" ON clientes
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- POLÍTICAS DE ACCESO - PROYECTOS
-- ============================================

CREATE POLICY "Usuarios autenticados pueden ver proyectos" ON proyectos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear proyectos" ON proyectos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar proyectos" ON proyectos
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar proyectos" ON proyectos
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- POLÍTICAS DE ACCESO - VIVIENDAS
-- ============================================

CREATE POLICY "Usuarios autenticados pueden ver viviendas" ON viviendas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear viviendas" ON viviendas
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar viviendas" ON viviendas
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar viviendas" ON viviendas
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- POLÍTICAS DE ACCESO - TRANSACCIONES
-- ============================================

CREATE POLICY "Usuarios autenticados pueden ver transacciones" ON transacciones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear transacciones" ON transacciones
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar transacciones" ON transacciones
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar transacciones" ON transacciones
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- Descomentar las siguientes líneas si quieres datos de ejemplo

-- INSERT INTO clientes (nombre, tipo) VALUES
--   ('Constructora Sygma', 'Constructora'),
--   ('Empresa Eléctrica del Sur', 'Empresa');

-- INSERT INTO proyectos (nombre, cliente_id) VALUES
--   ('Viviendas boyeco 4', (SELECT id FROM clientes WHERE nombre = 'Constructora Sygma' LIMIT 1));

-- INSERT INTO viviendas (nombre, proyecto_id, factibilidad, te1) VALUES
--   ('Vivienda 1', (SELECT id FROM proyectos WHERE nombre = 'Viviendas boyeco 4' LIMIT 1), true, true),
--   ('Vivienda 2', (SELECT id FROM proyectos WHERE nombre = 'Viviendas boyeco 4' LIMIT 1), true, false);

-- INSERT INTO transacciones (tipo, monto, descripcion, fecha, cliente_id, proyecto_id) VALUES
--   ('ingreso', 1500000, 'Pago inicial proyecto Boyeco', CURRENT_DATE, 
--    (SELECT id FROM clientes WHERE nombre = 'Constructora Sygma' LIMIT 1),
--    (SELECT id FROM proyectos WHERE nombre = 'Viviendas boyeco 4' LIMIT 1));
