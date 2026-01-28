# Guía de Configuración de Supabase para ELECTRIX

Esta guía te ayudará a configurar Supabase paso a paso para la aplicación ELECTRIX.

## 📥 Paso 1: Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en **"Start your project"** o **"Sign in"** si ya tienes cuenta
3. Crea una cuenta o inicia sesión (puedes usar GitHub)
4. Haz clic en **"New Project"**
5. Completa los datos:
   - **Name**: `electrix` (o el nombre que prefieras)
   - **Database Password**: Elige una contraseña segura (¡guárdala!)
   - **Region**: Selecciona la más cercana a Chile (ej: South America - São Paulo)
   - **Pricing Plan**: Free (suficiente para 6-10 usuarios)
6. Haz clic en **"Create new project"**
7. Espera 1-2 minutos mientras se crea el proyecto

## 🔑 Paso 2: Obtener las Credenciales

1. Una vez creado el proyecto, ve a **Settings** (⚙️) en la barra lateral
2. Haz clic en **API**
3. Copia los siguientes valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (clave larga)

4. Abre el archivo `.env` en la raíz del proyecto
5. Reemplaza los valores:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 📋 Paso 3: Crear las Tablas

### Opción A: Usando el Editor SQL (Recomendado)

1. En Supabase, ve a **SQL Editor** en la barra lateral
2. Haz clic en **"New query"**
3. Copia y pega el siguiente SQL:

```sql
-- Tabla de clientes
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Constructora', 'Particular', 'Empresa')),
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
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_proyectos_cliente ON proyectos(cliente_id);
CREATE INDEX idx_viviendas_proyecto ON viviendas(proyecto_id);
CREATE INDEX idx_transacciones_fecha ON transacciones(fecha);
CREATE INDEX idx_transacciones_cliente ON transacciones(cliente_id);
CREATE INDEX idx_transacciones_proyecto ON transacciones(proyecto_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE viviendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (permitir todo para usuarios autenticados)
CREATE POLICY "Usuarios autenticados pueden ver clientes" ON clientes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden crear clientes" ON clientes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden actualizar clientes" ON clientes
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden eliminar clientes" ON clientes
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden ver proyectos" ON proyectos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden crear proyectos" ON proyectos
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden actualizar proyectos" ON proyectos
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden eliminar proyectos" ON proyectos
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden ver viviendas" ON viviendas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden crear viviendas" ON viviendas
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden actualizar viviendas" ON viviendas
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden eliminar viviendas" ON viviendas
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden ver transacciones" ON transacciones
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden crear transacciones" ON transacciones
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden actualizar transacciones" ON transacciones
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden eliminar transacciones" ON transacciones
  FOR DELETE TO authenticated USING (true);
```

4. Haz clic en **"Run"** (o presiona Ctrl+Enter)
5. Deberías ver el mensaje: "Success. No rows returned"

## 👤 Paso 4: Crear Usuarios

### Crear el primer usuario (Gerente)

1. Ve a **Authentication** → **Users** en la barra lateral
2. Haz clic en **"Add user"** → **"Create new user"**
3. Completa:
   - **Email**: `123456789@electrix.local`
   - **Password**: `admin123` (o la que prefieras)
   - **Auto Confirm User**: ✅ (marcado)
4. Haz clic en **"Create user"**

### Crear más usuarios para tu equipo

Repite el proceso para cada usuario:
- Email: `[RUT]@electrix.local` (ejemplo: `987654321@electrix.local`)
- Password: La que elijas para cada usuario
- Auto Confirm User: ✅

**Nota**: El RUT se usa como parte del email. En el login, el usuario solo ingresa el RUT (sin @electrix.local).

## 🎯 Paso 5: Agregar Datos de Ejemplo (Opcional)

### Agregar un Cliente

1. Ve a **Table Editor** → **clientes**
2. Haz clic en **"Insert"** → **"Insert row"**
3. Completa:
   - **nombre**: `Constructora Sygma`
   - **tipo**: `Constructora`
   - (id, created_at, updated_at se generan automáticamente)
4. Haz clic en **"Save"**

### Agregar un Proyecto

1. Ve a **Table Editor** → **proyectos**
2. Haz clic en **"Insert"** → **"Insert row"**
3. Completa:
   - **nombre**: `Viviendas boyeco 4`
   - **cliente_id**: Selecciona "Constructora Sygma" del dropdown
4. Haz clic en **"Save"**

### Agregar una Vivienda

1. Ve a **Table Editor** → **viviendas**
2. Haz clic en **"Insert"** → **"Insert row"**
3. Completa:
   - **nombre**: `Vivienda 1`
   - **proyecto_id**: Selecciona "Viviendas boyeco 4"
   - **factibilidad**: ✅
   - **te1**: ✅
   - (deja los demás sin marcar)
4. Haz clic en **"Save"**

### Agregar una Transacción

1. Ve a **Table Editor** → **transacciones**
2. Haz clic en **"Insert"** → **"Insert row"**
3. Completa:
   - **tipo**: `ingreso`
   - **monto**: `1500000`
   - **descripcion**: `Pago inicial proyecto Boyeco`
   - **fecha**: Selecciona la fecha actual
   - **cliente_id**: Selecciona "Constructora Sygma" (opcional)
   - **proyecto_id**: Selecciona "Viviendas boyeco 4" (opcional)
4. Haz clic en **"Save"**

## ✅ Paso 6: Verificar la Configuración

1. Asegúrate de que el archivo `.env` tenga las credenciales correctas
2. Reinicia el servidor de desarrollo:
   - Presiona `Ctrl+C` en la terminal donde corre `npm run dev`
   - Ejecuta nuevamente: `npm run dev`
3. Abre `http://localhost:5173` en tu navegador
4. Intenta iniciar sesión con:
   - **RUT**: `12.345.678-9` (se formatea automáticamente)
   - **Contraseña**: `admin123`

## 🔄 Funciones en Tiempo Real

Las actualizaciones en tiempo real ya están configuradas. Cuando un usuario haga cambios, se reflejarán automáticamente en las pantallas de otros usuarios conectados.

## 🐛 Solución de Problemas

### Error: "Invalid API key"
- Verifica que copiaste correctamente la `anon public` key
- Asegúrate de que no haya espacios extra en el archivo `.env`
- Reinicia el servidor de desarrollo

### Error: "Failed to fetch"
- Verifica que la URL de Supabase sea correcta
- Verifica tu conexión a internet
- Asegúrate de que el proyecto de Supabase esté activo

### No puedo iniciar sesión
- Verifica que el usuario exista en Authentication → Users
- El email debe ser: `[RUT]@electrix.local` (sin puntos ni guión en el RUT)
- Verifica que "Auto Confirm User" esté marcado

### Las tablas no se crearon
- Verifica que ejecutaste todo el SQL del Paso 3
- Revisa si hay errores en el SQL Editor
- Intenta ejecutar las queries una por una

## 📊 Monitoreo y Límites

### Plan Gratuito de Supabase incluye:
- ✅ 500 MB de base de datos
- ✅ 1 GB de almacenamiento de archivos
- ✅ 2 GB de transferencia de datos
- ✅ 50,000 usuarios autenticados
- ✅ Suficiente para 6-10 usuarios activos

### Ver uso actual:
1. Ve a **Settings** → **Usage**
2. Revisa los gráficos de uso

## 🚀 Despliegue a Producción

Supabase ya está en producción por defecto. Solo necesitas:

1. **Desplegar el frontend**:
   ```bash
   npm run build
   ```
   Sube la carpeta `dist/` a Vercel, Netlify, o tu hosting preferido

2. **Configurar variables de entorno en producción**:
   - `VITE_SUPABASE_URL`: Tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY`: Tu anon key

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [API Reference](https://supabase.com/docs/reference/javascript/introduction)
- [Dashboard de Supabase](https://app.supabase.com)

## 🎉 ¡Listo!

Ahora tienes Supabase configurado y funcionando. La aplicación ELECTRIX está lista para usar con:
- ✅ Base de datos PostgreSQL en la nube
- ✅ Autenticación de usuarios
- ✅ Sincronización en tiempo real
- ✅ Backup automático
- ✅ Escalabilidad automática
- ✅ Sin necesidad de servidor propio
