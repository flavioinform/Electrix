# 👤 Guía de Perfil de Trabajador - ELECTRIX

## 🎯 Qué es

El sistema de **Perfil de Trabajador** permite que cada trabajador cree y gestione su propia información personal dentro de la aplicación ELECTRIX.

---

## ✨ Características

✅ **Auto-registro**: Los trabajadores pueden crear su propio perfil  
✅ **Edición de perfil**: Actualizar información personal  
✅ **Validación de RUT**: Verificación automática del RUT chileno  
✅ **Especialidades**: Electricista, Técnico, Ayudante, Supervisor  
✅ **Integración**: El perfil se vincula automáticamente con las asignaciones  

---

## 🚀 Cómo Usar

### Para Trabajadores

#### 1. Iniciar Sesión
- Usa tu RUT y contraseña para iniciar sesión
- El RUT debe estar en formato: `12.345.678-9`

#### 2. Acceder a Mi Perfil
- Haz clic en la pestaña **"Mi Perfil"** en el dashboard
- Si es tu primera vez, verás un formulario para crear tu perfil

#### 3. Crear Tu Perfil
1. **Nombre Completo**: Ingresa tu nombre completo
2. **RUT**: Se pre-llena automáticamente con tu RUT de login
3. **Teléfono**: Opcional, formato: `+56912345678`
4. **Especialidad**: Selecciona tu especialidad:
   - Electricista
   - Técnico
   - Ayudante
   - Supervisor
5. Haz clic en **"Crear Perfil"**

#### 4. Editar Tu Perfil
1. En la página de perfil, haz clic en **"Editar"**
2. Modifica la información que desees
3. Haz clic en **"Guardar Cambios"**

**Nota**: El RUT no se puede modificar una vez creado el perfil.

---

## 👨‍💼 Para Administradores

### Crear Usuarios para Trabajadores

Los trabajadores necesitan una cuenta de usuario en Supabase para poder iniciar sesión:

#### Opción 1: Crear en Supabase (Recomendado)

1. Ve a Supabase → **Authentication** → **Users**
2. Haz clic en **"Add user"** → **"Create new user"**
3. Completa:
   - **Email**: `[RUT-SIN-FORMATO]@electrix.local`
     - Ejemplo: `123456789@electrix.local` (sin puntos ni guión)
   - **Password**: Contraseña temporal
   - **Auto Confirm User**: ✅ (marcado)
4. Haz clic en **"Create user"**

#### Opción 2: Crear Múltiples Usuarios con SQL

```sql
-- Insertar usuarios en Supabase Auth
-- Reemplaza los valores con los datos reales

-- Ejemplo para 3 trabajadores
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    '123456789@electrix.local',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
  );
```

**Importante**: Después de crear el usuario, el trabajador debe:
1. Iniciar sesión con su RUT y contraseña
2. Ir a "Mi Perfil"
3. Completar su información

---

## 📋 Flujo Completo

### Ejemplo: Juan Pérez

1. **Admin crea usuario**:
   - Email: `123456789@electrix.local`
   - Password: `juan123`

2. **Juan inicia sesión**:
   - RUT: `12.345.678-9` (se formatea automáticamente)
   - Contraseña: `juan123`

3. **Juan crea su perfil**:
   - Nombre: `Juan Pérez González`
   - RUT: `12.345.678-9` (pre-llenado)
   - Teléfono: `+56912345678`
   - Especialidad: `Electricista`

4. **Juan es asignado a viviendas**:
   - El gerente/admin puede ahora asignar a Juan a viviendas
   - Juan aparece en la lista de trabajadores disponibles

---

## 🔐 Seguridad

- **RUT Único**: Cada RUT solo puede tener un perfil
- **Validación**: El RUT se valida usando el algoritmo oficial chileno
- **Autenticación**: Solo usuarios autenticados pueden crear/editar perfiles
- **Vinculación**: El perfil se vincula automáticamente con el email de login

---

## 💡 Tips

### Para Trabajadores
- Mantén tu teléfono actualizado para que puedan contactarte
- Elige la especialidad correcta para ser asignado a trabajos apropiados
- Revisa tu perfil regularmente

### Para Administradores
- Crea usuarios con contraseñas temporales
- Pide a los trabajadores que cambien su contraseña después del primer login
- Verifica que el RUT en el email coincida con el RUT real del trabajador
- El formato del email debe ser: `[RUT-SIN-PUNTOS-NI-GUION]@electrix.local`

---

## 🐛 Solución de Problemas

### "Error al guardar el perfil. Verifica que el RUT no esté duplicado"
- **Causa**: Ya existe un perfil con ese RUT
- **Solución**: Verifica en Supabase si ya existe un trabajador con ese RUT

### "RUT inválido"
- **Causa**: El RUT no pasa la validación del dígito verificador
- **Solución**: Verifica que el RUT esté correcto

### No puedo crear mi perfil
- **Causa**: Puede que no tengas permisos o haya un error de conexión
- **Solución**: 
  1. Verifica que estés autenticado
  2. Revisa que las tablas de trabajadores existan en Supabase
  3. Ejecuta `supabase_trabajadores.sql` si no lo has hecho

### El RUT no coincide con mi login
- **Causa**: El RUT en el perfil debe coincidir con el del email de login
- **Solución**: Contacta al administrador para verificar tu cuenta

---

## 📊 Verificar Perfiles Creados

### En Supabase

1. Ve a **Table Editor** → **trabajadores**
2. Verás todos los perfiles creados
3. Puedes editar o eliminar perfiles si es necesario

### Con SQL

```sql
-- Ver todos los trabajadores
SELECT * FROM trabajadores ORDER BY nombre;

-- Ver trabajadores activos
SELECT * FROM trabajadores WHERE activo = true;

-- Ver trabajadores por especialidad
SELECT especialidad, COUNT(*) as total
FROM trabajadores
WHERE activo = true
GROUP BY especialidad;
```

---

## ✅ Checklist

### Para Administradores
- [ ] Ejecutar `supabase_trabajadores.sql` en Supabase
- [ ] Crear usuarios en Authentication para cada trabajador
- [ ] Comunicar credenciales a los trabajadores
- [ ] Verificar que los trabajadores creen sus perfiles

### Para Trabajadores
- [ ] Recibir credenciales del administrador
- [ ] Iniciar sesión por primera vez
- [ ] Ir a "Mi Perfil"
- [ ] Completar toda la información
- [ ] Guardar el perfil
- [ ] Verificar que apareces en la lista de trabajadores

---

¡Listo! Ahora los trabajadores pueden gestionar su propia información de manera autónoma. 👤✨
