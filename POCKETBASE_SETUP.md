# Guía de Configuración de PocketBase para ELECTRIX

Esta guía te ayudará a configurar PocketBase paso a paso para la aplicación ELECTRIX.

## 📥 Paso 1: Descargar PocketBase

1. Ve a la página oficial: [https://pocketbase.io/docs/](https://pocketbase.io/docs/)
2. Descarga la versión correspondiente a tu sistema operativo:
   - **Windows**: `pocketbase_X.X.X_windows_amd64.zip`
   - **macOS**: `pocketbase_X.X.X_darwin_amd64.zip` (Intel) o `pocketbase_X.X.X_darwin_arm64.zip` (Apple Silicon)
   - **Linux**: `pocketbase_X.X.X_linux_amd64.zip`

3. Extrae el archivo descargado en la carpeta raíz del proyecto `my-project/`

## 🚀 Paso 2: Iniciar PocketBase

Abre una terminal en la carpeta del proyecto y ejecuta:

### Windows (PowerShell)
```powershell
.\pocketbase.exe serve
```

### macOS/Linux
```bash
chmod +x pocketbase  # Solo la primera vez
./pocketbase serve
```

Verás un mensaje similar a:
```
Server started at http://127.0.0.1:8090
├─ REST API: http://127.0.0.1:8090/api/
└─ Admin UI: http://127.0.0.1:8090/_/
```

## 🔧 Paso 3: Configurar el Panel de Administración

1. Abre tu navegador y ve a: `http://127.0.0.1:8090/_/`

2. **Crear cuenta de administrador**:
   - Email: `admin@electrix.cl` (o el que prefieras)
   - Password: Elige una contraseña segura
   - Confirma la contraseña

3. Haz clic en **"Create and login"**

## 📋 Paso 4: Importar el Schema de la Base de Datos

1. En el panel de administración, ve a **Settings** (⚙️ en la barra lateral)

2. Haz clic en **"Import collections"**

3. Selecciona el archivo `pb_schema.json` que está en la raíz del proyecto

4. Haz clic en **"Review"** y luego en **"Confirm and import"**

Esto creará automáticamente las siguientes colecciones:
- ✅ `users` - Usuarios del sistema
- ✅ `clientes` - Clientes/empresas
- ✅ `proyectos` - Proyectos
- ✅ `viviendas` - Viviendas/unidades
- ✅ `transacciones` - Transacciones financieras

## 👤 Paso 5: Crear Usuario de Prueba

1. En el panel de administración, ve a **Collections** → **users**

2. Haz clic en **"New record"**

3. Completa los campos:
   - **username**: `123456789` (RUT sin puntos ni guión)
   - **email**: `gerente@electrix.cl`
   - **password**: `admin123` (o la que prefieras)
   - **passwordConfirm**: `admin123`
   - **rut**: `123456789`
   - **nombre**: `Gerente Principal`
   - **rol**: `gerente`

4. Haz clic en **"Create"**

## 🎯 Paso 6: Crear Datos de Ejemplo (Opcional)

### Agregar un Cliente

1. Ve a **Collections** → **clientes**
2. Haz clic en **"New record"**
3. Completa:
   - **nombre**: `Constructora Sygma`
   - **tipo**: `Constructora`
4. Haz clic en **"Create"**

### Agregar un Proyecto

1. Ve a **Collections** → **proyectos**
2. Haz clic en **"New record"**
3. Completa:
   - **nombre**: `Viviendas boyeco 4`
   - **cliente**: Selecciona "Constructora Sygma"
4. Haz clic en **"Create"**

### Agregar una Vivienda

1. Ve a **Collections** → **viviendas**
2. Haz clic en **"New record"**
3. Completa:
   - **nombre**: `Vivienda 1`
   - **proyecto**: Selecciona "Viviendas boyeco 4"
   - **factibilidad**: ☑️ (marcado)
   - **te1**: ☑️ (marcado)
   - Deja los demás sin marcar
4. Haz clic en **"Create"**

### Agregar una Transacción

1. Ve a **Collections** → **transacciones**
2. Haz clic en **"New record"**
3. Completa:
   - **tipo**: `ingreso`
   - **monto**: `1500000`
   - **descripcion**: `Pago inicial proyecto Boyeco`
   - **fecha**: Selecciona la fecha actual
   - **cliente**: Selecciona "Constructora Sygma" (opcional)
   - **proyecto**: Selecciona "Viviendas boyeco 4" (opcional)
4. Haz clic en **"Create"**

## ✅ Paso 7: Verificar la Configuración

1. Asegúrate de que PocketBase sigue ejecutándose en la terminal

2. Abre otra terminal y ejecuta la aplicación React:
   ```bash
   npm run dev
   ```

3. Abre `http://localhost:5173` en tu navegador

4. Intenta iniciar sesión con:
   - **RUT**: `12.345.678-9` (se formatea automáticamente)
   - **Contraseña**: `admin123`

## 🔄 Comandos Útiles

### Detener PocketBase
Presiona `Ctrl + C` en la terminal donde está corriendo

### Reiniciar PocketBase
```bash
./pocketbase serve
```

### Ver logs de PocketBase
Los logs aparecen automáticamente en la terminal

### Backup de la base de datos
La carpeta `pb_data/` contiene todos los datos. Haz una copia de esta carpeta para hacer backup.

## 🐛 Solución de Problemas

### Error: "Port 8090 already in use"
Otro proceso está usando el puerto. Detén PocketBase si está corriendo en otra terminal, o usa otro puerto:
```bash
./pocketbase serve --http="127.0.0.1:8091"
```
Recuerda actualizar `.env` con el nuevo puerto.

### Error: "Failed to connect to PocketBase"
1. Verifica que PocketBase esté corriendo
2. Verifica que la URL en `.env` sea correcta: `VITE_PB_URL=http://127.0.0.1:8090`
3. Reinicia el servidor de desarrollo de Vite

### No puedo iniciar sesión
1. Verifica que el usuario existe en la colección `users`
2. Verifica que el RUT esté guardado sin puntos ni guión
3. Verifica que la contraseña sea correcta

## 📚 Recursos Adicionales

- [Documentación oficial de PocketBase](https://pocketbase.io/docs/)
- [API Reference](https://pocketbase.io/docs/api-records/)
- [JavaScript SDK](https://github.com/pocketbase/js-sdk)

## 🎉 ¡Listo!

Ahora tienes PocketBase configurado y funcionando. Puedes empezar a usar la aplicación ELECTRIX con todos sus features:
- ✅ Login con RUT chileno
- ✅ Gestión de clientes y proyectos
- ✅ Seguimiento de viviendas
- ✅ Control de flujo de caja
- ✅ Sincronización en tiempo real
