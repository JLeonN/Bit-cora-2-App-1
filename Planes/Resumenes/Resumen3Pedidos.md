### **Módulo de Pedidos - Bitácora II**

Sistema completo para gestión de pedidos diarios con historial, exportación, estadísticas avanzadas y sistema gamificado de recompensas.

En navegador, las exportaciones de Pedidos se descargan directamente; en Android se conserva el envío nativo de archivos.

---

### 🔢 **Sistema de Conteo de Items**

**Todos los pedidos ahora incluyen una columna "Items":**
- **Estructura**: Cada pedido tiene `{ numero, fecha, items }`
- **Valor por defecto**: 1 item si no se especifica
- **Persistencia automática**: Se guarda con cada pedido
- **Uso en estadísticas**:
  - Total de items del día/mes/año
  - Promedio de items por día
  - Promedio de items por pedido
  - Mejor día por cantidad de items
- **Visualización**: Columna "Items" en todas las tablas de pedidos
- **Edición**: Se puede modificar desde ModalEditarPedido

### 📦 **Componentes Principales**

#### **TablaPedidos.vue**
- **Pantalla principal** del módulo de pedidos
- **Tabla de últimos 3 pedidos** realizados
- **Botón de estadísticas anuales** (IconCalendarStats) en header
- **Integración completa** con ContadorPedidosDiarios
- **Botón agregar** para abrir ModalNuevoPedido
- **Navegación** a PedidosRealizados, HistorialPedidos y ResumenAnual
- **Responsive** con diseño adaptativo

#### **ModalNuevoPedido.vue**
- **Modal para agregar pedidos** manualmente
- **Input manual**: agrega un solo pedido y cierra automáticamente
- **Botón de cámara**: abre CamaraPedidos.vue para escanear múltiples códigos
- **Teclado móvil**: mantiene visible el título completo del modal al enfocar los campos
- **Validaciones** con feedback visual
- **Integración** con sistema de persistencia

#### **CamaraPedidos.vue**
- **Modal de pantalla completa** para escaneo en tiempo real
- **@zxing/library** para escaneo de códigos de barra y QR
- **Miniatura de última captura**
- **Lista de códigos escaneados** con opción de eliminar
- **Botones**: finalizar (confirma todos), cancelar
- **Manejo de permisos** de cámara

#### **PedidosRealizados.vue**
- **Lista completa** de todos los pedidos guardados
- **Sistema de estadísticas mensuales**: ResumenMensual integrado
- **Detección de duplicados**: Contador y resaltado visual
- **Ordenados por fecha** (más recientes primero)
- **Botón enviar Excel** con todos los pedidos
- **Acciones individuales**: editar y eliminar
- **Modal de edición** integrado
- **Filtros por rango de fechas** desde HistorialPedidos

#### **HistorialPedidos.vue**
- **Agrupación de pedidos por mes y año**
- **Vista expandible** por mes
- **Exportación por mes** seleccionado
- **Botón enviar Excel** del mes
- **Contador de pedidos** por mes
- **Diseño tipo acordeón**
- **Navegación** a PedidosRealizados con filtro de mes

#### **✅ ContadorPedidosDiarios.vue - Sistema Gamificado**
- **Contador automático** de pedidos del día actual
- **Reinicio a medianoche** automático (verificación cada minuto)
- **Navegación a estadísticas**: Click en tarjeta abre EstadisticasPedidos
- **🎯 Sistema de recompensas**: Iconos dinámicos según productividad
  - 📅 **0 pedidos o 1-9 entre semana**
  - 👍 **1-9 fin de semana o 10-19 entre semana**
  - 🔥 **20-29 pedidos**
  - ⚡ **30-39 pedidos**
  - 🌪️ **40-49 pedidos**
  - 💎 **50+ pedidos**
- **Lógica diferenciada**: Fin de semana vs días laborables
- **Persistencia** entre sesiones con `@capacitor/preferences`
- **Actualización automática** al agregar pedidos
- **Icono de estadísticas** en esquina superior derecha

---

### 📊 **Sistema de Estadísticas**
#### **Sistema de Días No Trabajados**
- **Registro de faltas**: Botón "Día no trabajado" visible solo cuando no hay pedidos
- **ModalEditarFalta.vue**: Edición de observación y fecha con validaciones
- **Exclusión total**: Las faltas NO suman a estadísticas (0 impacto en promedios/totales)
- **Estructura**: `{ numero: "FALTA" o observación, fecha: "DD/MM/YYYY", tipo: "falta" }`
- **Validación**: No permite registros en fechas con pedidos existentes
#### **PedidosDelDia.vue**
- **Pantalla de estadísticas del día actual**
- **Tarjeta métrica gamificada**: Icono dinámico según cantidad
- **Tabla de pedidos del día**: Editar y eliminar
- **Contador de duplicados**: Detección y alerta visual
- **Fecha formateada**: Día completo en español
- **Botón enviar**: Exporta pedidos del día en Excel
- **Actualización en tiempo real**: Refleja cambios inmediatos
- **Responsive**: Adaptado para móviles

#### **ResumenMensual.vue**
- **4 tarjetas de métricas**:
  - **Total de pedidos**: IconPackage
  - **Días trabajados**: IconCalendarCheck
  - **Promedio por día**: Icono dinámico según valor
  - **Mejor día**: Icono dinámico según cantidad
- **Integrado en PedidosRealizados**: Se muestra al filtrar por mes
- **Iconos gamificados**: Usa obtenerIconoPorCantidad.js
- **Grid responsive**: 2 columnas en desktop, 1 en móvil

#### **ResumenAnual.vue**
- **Estadísticas completas del año actual**
- **4 tarjetas de métricas**:
  - **Total de pedidos del año**
  - **Meses trabajados**: Con días totales trabajados
  - **Promedio por mes**: Icono dinámico
  - **Mejor mes del año**: Con mejor día del mes incluido
- **Navegación desde TablaPedidos**: Botón IconCalendarStats
- **Cálculo automático**: Agrupa por meses y días
- **Mejor día del mejor mes**: Detalle adicional en tarjeta
- **Mensaje vacío**: Si no hay pedidos en el año

#### **obtenerIconoPorCantidad.js**
- **Módulo de lógica de iconos gamificados**
- **Función principal**: `obtenerIconoPorCantidad(cantidad)`
- **Función especial para mejor día**: `obtenerIconoMejorDia(cantidad)` - usa IconTrophy si < 10
- **Función especial para promedio**: `obtenerIconoPromedio(promedio)` - usa IconChartLine si < 10
- **Umbrales estándar** (lunes a viernes):
  - 1-9: IconCalendarEvent
  - 10-19: IconThumbUp
  - 20-29: IconFlame
  - 30-39: IconBolt
  - 40-49: IconTornado
  - 50+: IconDiamond
- **Usado en**: ResumenMensual, ResumenAnual, PedidosDelDia, ContadorPedidosDiarios

---

### 📁 **Lógica de Exportación**

#### **ExportarPedidosExcel.js**
- **Generación de Excel** con pedidos para descarga directa
- **Formato de nombre**: `Pedi Usuario - MM-AAAA.xlsx`
- **Nombre de hoja**: Nombre del usuario
- **Columnas**: Fecha, Pedido
- **Formato de fecha**: DD/MM/AAAA
- **Ordenamiento**: Por fecha descendente
- **Integración** con nombre de usuario de configuración
- **Anchos de columna**: 11 caracteres para ambas columnas

#### **GeneraExcel.js**
- **Módulo reutilizable** para generar Excel temporal
- **Función principal**: `generarYGuardarExcelTemporal(pedidos)`
- **Cálculo automático de rango**: Fecha mínima y máxima
- **Formato de nombre**: `Pedi Usuario DD-MM-AAAA - DD-MM-AAAA.xlsx`
- **Genera**: archivo Excel en memoria con `xlsx`
- **Guarda**: en `Directory.Cache` con `@capacitor/filesystem`
- **Retorna**: URI del archivo temporal y nombre
- **Formato**: Base64 para compatibilidad con Capacitor
- **Anchos de columna**: 11 caracteres para ambas columnas

#### **CompartirExcel.js**
- **Función**: `compartirArchivo(rutaArchivo, nombreArchivo)`
- **Share API nativa** de Capacitor
- **Título**: "Archivo Excel"
- **Compatible** con todas las apps de compartir del sistema
- **Manejo de errores**: Try-catch con console.error

---

### 💾 **Almacenamiento y Persistencia**

#### **usoAlmacenamientoPedidos.js**
- **Módulo especializado** para pedidos
- **Funciones principales**:
  - `guardarPedidos(pedidos)`
  - `obtenerPedidos()`
  - `agregarPedido(codigo)`
  - `eliminarPedido(id)`
  - `editarPedido(id, nuevoCodigo)`
  - `limpiarPedidos()`
  - `guardarFechaUltimoEnvio(fecha)`
- **Estructura de pedido**: `{ numero, fecha }`
- **Persistencia** en `@capacitor/preferences`
- **Key**: `"pedidos"`

---

### 🎯 **Sistema de Logros Gamificado**

- **Detección automática** de fin de semana (sábado/domingo)
- **Umbrales diferentes** según día de la semana
- **Reconocimiento cada 10 pedidos** con cambio de icono
- **Persistencia del contador** durante todo el día
- **Reset automático** a las 00:00
- **Mensajes motivacionales** diferenciados
- **Navegación a estadísticas**: Click en contador abre PedidosDelDia
- **Iconografía de @tabler/icons-vue**

---

### 🔄 **Integración con Barra de Botones**

#### **TablaPedidos.vue**
- `mostrarAtras: true`
- `mostrarInicio: true`
- `mostrarAgregar: true`
- `mostrarEnviar: false`

#### **PedidosRealizados.vue**
- `mostrarAtras: true`
- `mostrarInicio: true`
- `mostrarAgregar: false`
- `mostrarEnviar: pedidos.length > 0`

#### **PedidosDelDia.vue**
- `mostrarAtras: true`
- `mostrarInicio: true`
- `mostrarAgregar: false`
- `mostrarEnviar: pedidosDelDia.length > 0`

#### **ResumenAnual.vue**
- `mostrarAtras: true`
- `mostrarInicio: true`
- `mostrarAgregar: false`
- `mostrarEnviar: false`

#### **HistorialPedidos.vue**
- `mostrarAtras: true`
- `mostrarInicio: true`
- `mostrarAgregar: false`
- `mostrarEnviar: false`

---

### 🎨 **Características de UI/UX**

- **Tabla responsive** con diseño de cards en móvil
- **Animaciones suaves** en transiciones
- **Feedback visual** inmediato
- **Iconos consistentes** con @tabler/icons-vue
- **Estados de carga** con spinners
- **Notificaciones** de éxito/error con Quasar Notify
- **Confirmaciones** antes de acciones destructivas
- **Colores temáticos** según logro alcanzado
- **Detección de duplicados**: Resaltado visual en tablas
- **Tarjetas métricas**: Grid responsivo con hover effects
- **Iconos dinámicos**: Cambian según progreso del usuario

---

### 🔧 **Dependencias Específicas**

- **xlsx**: Generación de archivos Excel
- **@capacitor/filesystem**: Guardado de archivos
- **@capacitor/share**: Compartir archivos
- **@capacitor/preferences**: Persistencia de datos
- **@zxing/library**: Escaneo de códigos
- **@tabler/icons-vue**: Iconografía completa

---

### 🗺️ **Navegación del Módulo**

```
TablaPedidos (/)
├── ContadorPedidosDiarios → EstadisticasPedidos (PedidosDelDia)
├── Botón Estadísticas Anuales → ResumenAnual
├── Agregar → ModalNuevoPedido → CamaraPedidos
└── HistorialPedidos
    └── Click en Mes → PedidosRealizados (con filtro)
        └── ResumenMensual (integrado)
```

---

### 📝 **Notas Importantes**

- Los pedidos se guardan **automáticamente** al agregarlos
- El contador diario se **resetea solo** a medianoche
- Los archivos Excel se generan en **memoria** y se guardan temporalmente
- El **nombre de usuario** de configuración se integra en nombres de archivo
- El sistema de logros **motiva** la productividad sin ser intrusivo
- Las **estadísticas se calculan en tiempo real** al cargar cada componente
- Los **duplicados se detectan automáticamente** por número de pedido
- La **navegación entre vistas** preserva el contexto y permite regresar fácilmente
