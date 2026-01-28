# ELECTRIX - Sistema de Gestión Eléctrica

Sistema web moderno para gestión de empresas de servicios eléctricos, con seguimiento de flujo de caja y flujo de trabajo.

## 🚀 Características

- ✅ **Autenticación con RUT chileno** - Login seguro con validación de RUT
- 💰 **Flujo de Caja** - Seguimiento de ingresos, gastos y balance mensual
- 📋 **Flujo de Trabajo** - Gestión de clientes, proyectos y viviendas
- 🔄 **Sincronización en tiempo real** - Actualizaciones instantáneas entre usuarios
- 🎨 **Diseño moderno** - Interfaz oscura con efectos glassmorphism
- 📱 **Responsive** - Funciona en desktop, tablet y móvil
- ☁️ **Base de datos en la nube** - Supabase (PostgreSQL)

## 🛠️ Tecnologías

- **Frontend**: React 19 + Vite
- **Backend**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Routing**: React Router v6
- **Estilos**: CSS personalizado con variables
- **Iconos**: Lucide React
- **Fechas**: date-fns

## 📦 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

#### Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta e inicia sesión
3. Crea un nuevo proyecto:
   - Name: `electrix`
   - Database Password: (elige una contraseña segura)
   - Region: South America - São Paulo
4. Espera 1-2 minutos mientras se crea el proyecto

#### Obtener Credenciales

1. En tu proyecto de Supabase, ve a **Settings** → **API**
2. Copia:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: La clave larga que empieza con `eyJ...`

3. Crea/actualiza el archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Crear las Tablas

1. En Supabase, ve a **SQL Editor**
2. Haz clic en **"New query"**
3. Copia y pega el contenido del archivo `supabase_schema.sql`
4. Haz clic en **"Run"** para ejecutar el script

#### Crear Usuario de Prueba

1. Ve a **Authentication** → **Users**
2. Haz clic en **"Add user"** → **"Create new user"**
3. Completa:
   - **Email**: `123456789@electrix.local`
   - **Password**: `admin123` (o la que prefieras)
   - **Auto Confirm User**: ✅ (marcado)
4. Haz clic en **"Create user"**

**Nota**: El RUT se usa como parte del email. El formato es `[RUT]@electrix.local`.

### 3. Iniciar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🔐 Credenciales de Prueba

- **RUT**: `12.345.678-9` (se formatea automáticamente)
- **Contraseña**: `admin123`

## 📖 Uso

### Flujo de Trabajo

1. **Gestionar Clientes**
   - Selecciona el tipo de cliente (Constructora, Particular, Empresa)
   - Agrega nuevos clientes
   - Selecciona un cliente para ver sus proyectos

2. **Gestionar Proyectos**
   - Agrega proyectos a un cliente
   - Expande un proyecto para ver sus viviendas
   - Agrega viviendas a un proyecto

3. **Seguimiento de Viviendas**
   - Marca el progreso con checkboxes:
     - Factibilidad
     - TE1
     - Empalme
     - TDA
     - Canalización
     - Cableado

### Flujo de Caja

1. **Seleccionar Mes**
   - Usa el selector de mes para ver transacciones específicas
   - Visualiza ingresos, gastos y balance del mes

2. **Agregar Transacciones**
   - Haz clic en "Nueva transacción"
   - Selecciona tipo (Ingreso/Gasto)
   - Ingresa monto y descripción
   - Opcionalmente asocia a un cliente y proyecto

3. **Filtrar Transacciones**
   - Busca por texto
   - Filtra por tipo, cliente o proyecto
   - Limpia filtros con un clic

## 🗄️ Estructura de la Base de Datos

### Tablas de Supabase

- **clientes** - Clientes/empresas (Constructora, Particular, Empresa)
- **proyectos** - Proyectos asociados a clientes
- **viviendas** - Viviendas dentro de proyectos con checkboxes de progreso
- **transacciones** - Movimientos financieros (ingresos/gastos)

### Autenticación

- **Supabase Auth** - Sistema de autenticación integrado
- Los usuarios se crean con email formato: `[RUT]@electrix.local`
- En el login, solo se ingresa el RUT (se formatea automáticamente)

## 🚀 Despliegue

### Frontend

```bash
npm run build
```

Los archivos estáticos se generarán en la carpeta `dist/`

Puedes desplegarlos en:
- Vercel
- Netlify
- GitHub Pages
- Cualquier hosting estático

### Backend (Supabase)

Supabase ya está en producción por defecto. Solo necesitas:

1. Configurar las variables de entorno en tu hosting:
   - `VITE_SUPABASE_URL`: Tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY`: Tu anon key de Supabase

2. ¡Listo! No necesitas desplegar ningún servidor backend.

## 📝 Notas

- El sistema está diseñado para 6-10 usuarios concurrentes
- Las actualizaciones son en tiempo real gracias a PocketBase
- El RUT se valida usando el algoritmo oficial chileno
- Todos los datos se sincronizan automáticamente entre usuarios

## 🤝 Soporte

Para soporte o consultas, contacta al equipo de desarrollo.

## 📄 Licencia

Uso interno - ELECTRIX
