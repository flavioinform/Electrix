# 🚀 Guía de Inicio Rápido - ELECTRIX (Supabase)

Esta guía te ayudará a poner en marcha la aplicación ELECTRIX con Supabase en **10 minutos**.

## ⚡ Inicio Rápido

### Paso 1: Crear Proyecto en Supabase (3 minutos)

1. Ve a: https://supabase.com
2. Crea una cuenta o inicia sesión
3. Haz clic en **"New Project"**
4. Completa:
   - Name: `electrix`
   - Database Password: (elige una contraseña segura)
   - Region: South America - São Paulo
5. Espera 1-2 minutos mientras se crea

### Paso 2: Configurar Credenciales (1 minuto)

1. En Supabase, ve a **Settings** → **API**
2. Copia:
   - **Project URL**
   - **anon public** key
3. Abre `.env` en el proyecto y pega:
   ```
   VITE_SUPABASE_URL=tu-url-aqui
   VITE_SUPABASE_ANON_KEY=tu-key-aqui
   ```

### Paso 3: Crear Tablas (3 minutos)

1. En Supabase, ve a **SQL Editor**
2. Haz clic en **"New query"**
3. Copia y pega el SQL completo de `SUPABASE_SETUP.md` (Paso 3)
4. Haz clic en **"Run"**

### Paso 4: Crear Usuario (1 minuto)

1. Ve a **Authentication** → **Users**
2. Haz clic en **"Add user"** → **"Create new user"**
3. Completa:
   - Email: `123456789@electrix.local`
   - Password: `admin123`
   - Auto Confirm User: ✅
4. Haz clic en **"Create user"**

### Paso 5: Iniciar la Aplicación (1 minuto)

Reinicia el servidor de desarrollo:

```powershell
# Presiona Ctrl+C para detener el servidor actual
npm run dev
```

Abre en tu navegador: `http://localhost:5173`

## 🎯 ¡Listo para Usar!

**Credenciales de login:**
- RUT: `12.345.678-9` (se formatea automáticamente)
- Contraseña: `admin123`

---

## 📋 Qué Puedes Hacer

### Flujo de Trabajo
1. **Agregar clientes** → Selecciona tipo y haz clic en "Agregar"
2. **Crear proyectos** → Selecciona un cliente y agrega proyectos
3. **Gestionar viviendas** → Expande un proyecto y agrega viviendas
4. **Marcar progreso** → Usa los checkboxes (Factibilidad, TE1, etc.)

### Flujo de Caja
1. **Ver balance mensual** → Cambia el mes en el selector
2. **Agregar transacciones** → Haz clic en "Nueva transacción"
3. **Filtrar datos** → Usa los filtros de búsqueda
4. **Ver historial** → Tabla completa de movimientos

---

## ✨ Ventajas de Supabase

✅ **Base de datos en la nube** - No necesitas instalar nada
✅ **Backup automático** - Tus datos están seguros
✅ **Escalable** - Crece con tu empresa
✅ **Tiempo real** - Sincronización automática entre usuarios
✅ **Gratis** - Plan gratuito suficiente para 6-10 usuarios

---

## 🆘 Problemas Comunes

### "Invalid API key"
Verifica que copiaste correctamente las credenciales en `.env` y reinicia el servidor.

### No puedo iniciar sesión
1. Verifica que el usuario exista en Supabase (Authentication → Users)
2. El email debe ser: `123456789@electrix.local`
3. Asegúrate de marcar "Auto Confirm User" al crear el usuario

### "Failed to fetch"
1. Verifica tu conexión a internet
2. Verifica que la URL de Supabase sea correcta
3. Asegúrate de que el proyecto de Supabase esté activo

---

## 📚 Más Información

- **Guía completa de Supabase**: [SUPABASE_SETUP.md](file:///c:/Users/flvio/Desktop/Electrix/my-project/SUPABASE_SETUP.md)
- **Documentación general**: [README.md](file:///c:/Users/flvio/Desktop/Electrix/my-project/README.md)
- **Dashboard de Supabase**: https://app.supabase.com

---

## 💡 Próximos Pasos

1. **Crear más usuarios** para tu equipo (6-10 personas)
2. **Agregar datos reales** de clientes y proyectos
3. **Compartir la URL** con tu equipo cuando despliegues

---

¡Disfruta usando ELECTRIX con Supabase! ⚡
