# 🔧 Configuración de Supabase para Auto-Registro

## Paso 1: Deshabilitar Confirmación de Email

Para que los trabajadores puedan registrarse sin necesidad de confirmar su email:

1. Ve a tu proyecto en Supabase
2. Ve a **Authentication** → **Providers** → **Email**
3. Desactiva **"Confirm email"**
4. Haz clic en **"Save"**

## Paso 2: Actualizar Políticas RLS

Ejecuta este SQL en **SQL Editor**:

```sql
-- Eliminar política antigua
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear trabajadores" ON trabajadores;

-- Crear nueva política que permite a usuarios anónimos crear su perfil
CREATE POLICY "Usuarios pueden crear su propio perfil" ON trabajadores
  FOR INSERT TO anon, authenticated WITH CHECK (true);
```

## Paso 3: Limpiar Rate Limit (Si es necesario)

Si ves el error "email rate limit exceeded", espera 1 hora o:

1. Ve a **Authentication** → **Rate Limits**
2. Ajusta los límites según necesites
3. O simplemente espera un poco antes de intentar registrarte nuevamente

## Listo!

Ahora los trabajadores pueden:
- ✅ Registrarse sin confirmar email
- ✅ Iniciar sesión inmediatamente
- ✅ Crear su perfil automáticamente
