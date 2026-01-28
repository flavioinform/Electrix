# 👷 Guía de Trabajadores - ELECTRIX

## 📋 Qué se agregó

Se ha agregado un sistema completo de gestión de trabajadores que permite:

✅ Registrar trabajadores de la empresa  
✅ Asignar trabajadores a viviendas específicas  
✅ Ver qué trabajadores están asignados a cada vivienda  
✅ Remover trabajadores de viviendas  

---

## 🗄️ Nuevas Tablas en Supabase

### `trabajadores`
Almacena la información de los trabajadores:
- **nombre**: Nombre completo del trabajador
- **rut**: RUT del trabajador (único)
- **telefono**: Número de teléfono
- **especialidad**: Electricista, Ayudante, Supervisor, o Técnico
- **activo**: Si el trabajador está activo o no

### `vivienda_trabajadores`
Relaciona trabajadores con viviendas:
- **vivienda_id**: ID de la vivienda
- **trabajador_id**: ID del trabajador
- **fecha_asignacion**: Cuándo se asignó
- **notas**: Notas adicionales

---

## 🚀 Cómo Configurar

### 1. Ejecutar el SQL en Supabase

1. Ve a tu proyecto en Supabase: https://gpfukaxwnooifwzurnjj.supabase.co
2. Ve a **SQL Editor**
3. Haz clic en **"New query"**
4. Copia y pega todo el contenido del archivo `supabase_trabajadores.sql`
5. Haz clic en **"Run"**

### 2. Agregar Trabajadores de Ejemplo (Opcional)

Puedes agregar trabajadores de ejemplo ejecutando este SQL:

```sql
INSERT INTO trabajadores (nombre, rut, telefono, especialidad, activo) VALUES
  ('Juan Pérez', '12345678-9', '+56912345678', 'Electricista', true),
  ('María González', '98765432-1', '+56987654321', 'Técnico', true),
  ('Pedro Rodríguez', '11223344-5', '+56911223344', 'Ayudante', true),
  ('Ana Martínez', '55667788-9', '+56955667788', 'Supervisor', true);
```

O puedes agregarlos manualmente en Supabase:
1. Ve a **Table Editor** → **trabajadores**
2. Haz clic en **"Insert"** → **"Insert row"**
3. Completa los datos del trabajador
4. Haz clic en **"Save"**

---

## 📖 Cómo Usar

### Ver Trabajadores Asignados

1. Ve a **Flujo de Trabajo**
2. Selecciona un cliente y expande un proyecto
3. En cada vivienda verás una sección **"Trabajadores asignados"**
4. Ahí aparecerán los trabajadores con su nombre y especialidad

### Asignar Trabajadores a una Vivienda

1. En la tarjeta de una vivienda, haz clic en el botón **"Asignar"** (icono de usuario con +)
2. Se abrirá un modal con dos secciones:
   - **Asignados**: Trabajadores ya asignados a esta vivienda
   - **Disponibles**: Trabajadores que puedes asignar
3. En la sección "Disponibles", haz clic en el botón **+** junto al trabajador que quieres asignar
4. El trabajador se moverá automáticamente a la sección "Asignados"

### Remover Trabajadores de una Vivienda

1. Abre el modal de trabajadores (botón "Asignar")
2. En la sección "Asignados", haz clic en el botón **X** junto al trabajador
3. El trabajador se removerá y volverá a la lista de "Disponibles"

---

## 🎯 Casos de Uso

### Ejemplo 1: Asignar un Electricista a una Vivienda

```
1. Cliente: Constructora Sygma
2. Proyecto: Viviendas boyeco 4
3. Vivienda: Vivienda 1
4. Trabajador: Juan Pérez (Electricista)
```

**Pasos:**
1. Selecciona "Constructora Sygma"
2. Expande "Viviendas boyeco 4"
3. En "Vivienda 1", haz clic en "Asignar"
4. Busca "Juan Pérez" en disponibles
5. Haz clic en el botón +
6. ¡Listo! Juan está asignado a Vivienda 1

### Ejemplo 2: Ver Todos los Trabajadores de un Proyecto

1. Expande el proyecto
2. Revisa cada vivienda
3. En la sección "Trabajadores asignados" verás quién está trabajando en cada una

---

## 💡 Tips

- **Especialidades**: Usa las especialidades para organizar mejor:
  - `Electricista`: Para trabajos eléctricos principales
  - `Técnico`: Para instalaciones técnicas
  - `Ayudante`: Para asistencia general
  - `Supervisor`: Para supervisión de obra

- **Trabajadores Activos**: Solo los trabajadores marcados como "activos" aparecen en la lista de disponibles

- **Múltiples Asignaciones**: Un trabajador puede estar asignado a múltiples viviendas al mismo tiempo

- **Sincronización**: Los cambios se sincronizan en tiempo real entre todos los usuarios conectados

---

## 🔧 Gestión de Trabajadores

### Agregar Nuevo Trabajador

Actualmente se hace desde Supabase:
1. Ve a **Table Editor** → **trabajadores**
2. Haz clic en **"Insert"** → **"Insert row"**
3. Completa:
   - **nombre**: Nombre completo
   - **rut**: RUT (formato: 12345678-9)
   - **telefono**: Teléfono (formato: +56912345678)
   - **especialidad**: Selecciona una opción
   - **activo**: true
4. Haz clic en **"Save"**

### Desactivar un Trabajador

1. Ve a **Table Editor** → **trabajadores**
2. Encuentra al trabajador
3. Haz clic en la fila para editarla
4. Cambia **activo** a `false`
5. Haz clic en **"Save"**

El trabajador ya no aparecerá en la lista de disponibles, pero sus asignaciones anteriores se mantendrán.

---

## 📊 Reportes

Puedes consultar información útil con SQL:

### Trabajadores por Vivienda
```sql
SELECT 
  v.nombre as vivienda,
  t.nombre as trabajador,
  t.especialidad,
  vt.fecha_asignacion
FROM vivienda_trabajadores vt
JOIN viviendas v ON v.id = vt.vivienda_id
JOIN trabajadores t ON t.id = vt.trabajador_id
ORDER BY v.nombre, t.nombre;
```

### Carga de Trabajo por Trabajador
```sql
SELECT 
  t.nombre,
  t.especialidad,
  COUNT(vt.id) as viviendas_asignadas
FROM trabajadores t
LEFT JOIN vivienda_trabajadores vt ON vt.trabajador_id = t.id
WHERE t.activo = true
GROUP BY t.id, t.nombre, t.especialidad
ORDER BY viviendas_asignadas DESC;
```

---

## ✅ Checklist de Configuración

- [ ] Ejecutar `supabase_trabajadores.sql` en Supabase
- [ ] Verificar que las tablas se crearon correctamente
- [ ] Agregar al menos un trabajador de prueba
- [ ] Probar asignar un trabajador a una vivienda
- [ ] Probar remover un trabajador de una vivienda
- [ ] Verificar que los cambios se sincronizan en tiempo real

---

¡Listo! Ahora puedes gestionar completamente a tus trabajadores y asignarlos a las viviendas según sea necesario. 👷‍♂️⚡
