### **Estado Actual del Proyecto: Bitácora II**

Aplicación en **Vue 3 con Quasar** llamada **Bitácora II**, orientada a la gestión de **pedidos internos, ubicaciones e inventario**. Sistema pensado para correr como aplicación móvil en Android, **ya publicada en la Play Store de Google**.

---

### 📦 **Estructura General**

La aplicación se divide en 7 módulos principales:
- **Preparadores**: Registro diario de pedidos preparados, cantidades de ítems y estadísticas completas (ver `Resumen3Pedidos.md`)
- **Ubicaciones**: Ajuste de ubicaciones de artículos (ver `Resumen4Ubicaciones.md`)
- **Consulta De Ubicación**: Búsqueda rápida y actualización de ubicación de artículos (ver `Resumen6ConsultaDeUbicacion.md`)
- **Stock**: Conteo de artículos, comparación con Excel e integración con Ubicaciones y Etiquetas (ver `Resumen7Stock.md`)
- **Etiquetas**: Generación de etiquetas con códigos de barras en PDF (ver `Resumen5Etiquetas.md`)
- **Configuración**: Sistema de configuración de usuario (ver `Resumen2Configuracion.md`)
- **Inicio**: Pantalla principal de navegación

El Inicio usa tarjetas reutilizables y adaptables para celular y navegador. Incluye acceso directo a Tutoriales y configuración personal.

---

### 🏠 **Componente Principal de Inicio**

#### **Inicio.vue (PanelInicio.vue)**
- Pantalla principal de navegación
- **Tarjeta Preparadores**: Acceso a `/TablaPedidos`
- **Tarjeta Ubicaciones**: Acceso a `/AjustarUbicaciones`
- **Tarjeta Consulta De Ubicación**: Acceso a `/ConsultaDeUbicacion`
- **Tarjeta Etiquetas**: Acceso a `/etiquetas`
- Diseño responsive con grid adaptativo
- Efectos hover y transiciones suaves

---

### ✅ **Sistema de Configuración de Usuario (breve)**

**Sistema completo de configuración personalizada del usuario con tutoriales integrados.**

- **PaginaConfiguracion.vue**: Página principal con secciones colapsables
- **ConfiguracionUsuario.vue**: Formulario para gestionar nombre de usuario con guía integrada
- **TarjetaSeccion.vue**: Componente reutilizable para secciones colapsables
- **SeccionTutoriales.vue**: Acordeones con tutoriales de Pedidos, Ubicaciones, Consulta De Ubicación y Etiquetas
- **Tutoriales individuales**: Pasos básicos y tips para cada módulo
- **usoAlmacenamientoConfiguracion.js**: Persistencia de configuración
- **Integración en MainLayout**: Nombre dinámico en header y drawer
- **Nombres personalizados**: Todos los archivos exportados usan el nombre configurado

**Ver detalle completo en:** `Resumen2Configuracion.md`

---

### 🔄 **Sistema de Navegación con Barra Inferior**

#### **BarraBotonesInferior.vue - COMPONENTE PRINCIPAL DE NAVEGACIÓN**
- **Barra flotante centrada** con diseño moderno y redondeado
- **Botones dinámicos**: atrás, inicio, agregar, enviar
- **Configuración por props**: cada página define qué botones mostrar
- **Botones personalizados**: sistema extensible para acciones específicas
- **Acciones web**: Ubicaciones puede preparar el Excel, abrir WhatsApp y ofrecer enlaces compartidos desde la barra inferior
- **Estados dinámicos**: habilitar/deshabilitar según contexto
- **Responsive design** con ajustes para pantallas pequeñas
- **Auto-ocultamiento**: botón "atrás" se oculta automáticamente en página inicial
- **Efectos visuales**: hover, active, sombras, transiciones suaves

#### **TresBotones.vue**
- Para formularios y modales (confirmar, cancelar, eliminar)

#### **Sistema de Configuración Dinámica**
- **Configuración por página**: Cada página emite su configuración de botones
- **Watchers reactivos**: Los botones se actualizan automáticamente según el estado
- **Métodos de callback**: Las páginas definen qué hacer cuando se presiona cada botón
- **Cleanup automático**: Se limpia la configuración al salir de las páginas

---

### 📊 **Sistema de Base de Datos Excel (breve)**

**Sistema compartido** usado en Ubicaciones, Consulta De Ubicación y Etiquetas.

- **SelectorExcel.vue**: Componente para cargar archivos Excel
- **LectorExcel.js**: Procesa y persiste artículos automáticamente
- **Persistencia automática**: Los datos se guardan en `@capacitor/preferences`
- **Inicialización automática**: Se carga al iniciar la aplicación
- **Funciones principales**: 
  - `obtenerArticulosCargados()`: Retorna array de artículos
  - `obtenerArticuloPorCodigo(codigo)`: Retorna artículo completo
  - `obtenerUbicacionAntigua(codigo)`: Retorna ubicación antigua
  - `obtenerStock(codigo)`: Retorna stock

**Ver detalle completo en:** `Resumen4Ubicaciones.md`

---

### 🔎 **Sistema de Búsqueda Inteligente (breve)**

**Sistema compartido** usado en Ubicaciones, Consulta De Ubicación y Etiquetas.

- **CodigoMasNombre.vue**: Buscador con priorización de resultados
- **Búsqueda en tiempo real** con resaltado de coincidencias
- **Máximo 3 resultados** por búsqueda
- **Compatible con persistencia automática**

**Ver detalle completo en:** `Resumen4Ubicaciones.md`

---

### 🔗 **Integración entre Módulos**

#### **Ubicaciones → Consulta De Ubicación**
- **Consulta exacta**: Busca por código o nombre y muestra ubicación, nombre y código
- **Edición directa**: Permite actualizar la ubicación desde la misma pantalla
- **Sincronización total**: Actualiza base cargada, Excel original y lista de Ubicaciones

#### **Ubicaciones → Etiquetas**
- **Botón verde IconTag** en cada fila de TablaUbicaciones
- **Envío directo**: Código, descripción y ubicación se envían a etiquetas
- **Notificación**: Feedback visual al agregar etiqueta
- **Sin cambio de página**: Usuario continúa en ubicaciones
- **Datos actualizados**: Usa ubicación actual, no la de base de datos

#### **Sistema de Polling en Etiquetas**
- **Verificación cada 2 segundos**: Detecta etiquetas agregadas desde ubicaciones
- **Actualización automática**: Lista se actualiza sin intervención del usuario
- **Convivencia de fuentes**: Etiquetas manuales + enviadas desde ubicaciones

---

### 📁 **Exportación y Guardado de Archivos**

- **xlsx**: Generación de archivos Excel en memoria
- **jsPDF**: Generación de documentos PDF con etiquetas
- **jsbarcode**: Generación de códigos de barras Code 39
- **@capacitor/filesystem**: Guardado en Base64 en `Directory.Cache`
- **Módulo reutilizable**: `GeneraExcel.js` con función `generarYGuardarExcelTemporal`
- **Nombres personalizados**: Integración con configuración de usuario

**Formatos de exportación**:
- **Pedidos**: Excel (.xlsx)
- **Ubicaciones**: Excel (.xlsx)
- **Etiquetas**: PDF (.pdf) con códigos de barras Code 39

---

### 💾 **Almacenamiento de Datos**

- **@capacitor/preferences**: Persistencia de datos
- **almacenamiento.js**: Manejo centralizado
- **Módulos específicos**:
  - `usoAlmacenamientoPedidos.js`: Persistencia de pedidos
  - `usoAlmacenamientoUbicaciones.js`: Persistencia de ubicaciones
  - `usoAlmacenamientoEtiquetas.js`: Persistencia de etiquetas
  - `usoAlmacenamientoConfiguracion.js`: Persistencia de configuración

---

### 📷 **Integración de Cámara y Escaneo**

- **@zxing/library**: Escaneo en tiempo real
- **CamaraPedidos.vue**: Para pedidos
- **CamaraEscaneo.vue**: Para ubicaciones, consulta de ubicación y etiquetas
- **CamaraUbicaciones.vue**: Específico para ubicaciones
- Optimización para códigos de barra y QR

---

### 🎨 **Integración Visual y UX**

- **Barra de navegación inferior moderna**: Flotante con efectos visuales
- **Sistema de notificaciones**: Mensajes de éxito/error con timeouts
- **Responsive design**: Todos los componentes adaptables
- **Estados visuales claros**: Iconos, colores, animaciones
- **Feedback al usuario**: Barras de progreso, mensajes específicos
- **UI Simplificada**: Información esencial sin redundancia
- **Persistencia automática**: Datos guardados en cada operación

---

### 🗂️ **Componentes Modales Reutilizables**

- **ModalEliminar.vue**: Confirmación para eliminaciones (usado en todo el sistema)
- **ModalEditarPedido.vue**: Edición de pedidos
- **ModalEditarUbicacion.vue**: Edición de ubicaciones
- **ModalEditarEtiqueta.vue**: Edición de etiquetas
- **ModalNuevoPedido.vue**: Agregar pedidos manualmente

---

### 📂 **Estructura de Archivos**
src/
├── App.vue
├── css/
│   └── app.css
├── layouts/
│   └── MainLayout.vue
├── pages/
│   ├── AjustarUbicaciones.vue
│   ├── ErrorNotFound.vue
│   ├── TablaPedidos.vue
│   ├── PaginaConfiguracion.vue
│   └── PaginaEtiquetas.vue
├── router/
│   ├── index.js
│   └── routes.js
└── components/
    ├── AdMob/
    │   └── BannerAdMob.vue
    ├── BaseDeDatos/
    │   ├── CodigosArticulos.js
    │   ├── almacenamiento.js
    │   ├── usoAlmacenamientoCapacitor.js
    │   ├── usoAlmacenamientoPedidos.js
    │   ├── usoAlmacenamientoUbicaciones.js
    │   ├── usoAlmacenamientoEtiquetas.js
    │   ├── usoAlmacenamientoConfiguracion.js
    │   ├── usoAlmacenamientoVIP.js
    │   └── LectorExcel.js
    ├── Botones/
    │   ├── BarraBotonesInferior.vue
    │   └── TresBotones.vue
    ├── Configuracion/
    │   ├── ConfiguracionUsuario.vue
    │   └── Tutoriales/
    │       ├── TarjetaSeccion.vue
    │       ├── SeccionTutoriales.vue
    │       └── LosTutoriales/
    │           ├── TutorialPedidos.vue
    │           ├── TutorialUbicaciones.vue
    │           └── TutorialEtiquetas.vue
    ├── Inicio/
    │   └── PanelInicio.vue
    ├── Logica/
    │   ├── Envios/
    │   │   └── CompartirExcel.js
    │   ├── Etiquetas/
    │   │   ├── FormularioEtiqueta.vue
    │   │   ├── TablaEtiquetas.vue
    │   │   ├── GeneradorEtiquetasPDF.js
    │   │   ├── GeneradorCodigoBarra.js
    │   │   └── ConfiguracionesDeEtiquetas/
    │   │       └── ConfiguracionEtiqueta10x15.js
    │   ├── Pedidos/
    │   │   ├── CamaraPedidos.vue
    │   │   ├── CompartirExcel.js
    │   │   ├── ContadorPedidosDiarios.vue
    │   │   ├── ExportarPedidosExcel.js
    │   │   ├── GeneraExcel.js
    │   │   ├── HistorialPedidos.vue
    │   │   ├── PedidosRealizados.vue
    │   │   ├── obtenerIconoPorCantidad.js
    │   │   └── Estadisticas/
    │   │       ├── PedidosDelDia.vue
    │   │       ├── ResumenMensual.vue
    │   │       ├── ResumenAnual.vue
    │   │       └── TarjetaEstadistica.vue
    │   └── Ubicaciones/
    │       ├── CamaraEscaneo.vue
    │       ├── CamaraUbicaciones.vue
    │       ├── CodigoMasNombre.vue
    │       ├── ExportarUbicacionesExcel.js
    │       ├── FormularioUbicacion.vue
    │       ├── TablaUbicaciones.vue
    │       ├── SelectorExcel.vue
    │       └── recordarUltimaTipografia.js
    └── Modales/
        ├── ModalEditarPedido.vue
        ├── ModalEditarUbicacion.vue
        ├── ModalEditarEtiqueta.vue
        ├── ModalEditarFalta.vue
        ├── ModalEliminar.vue
        └── ModalNuevoPedido.vue
---

### 📅 **Sistema de Días No Trabajados**

- **Registro de faltas**: Botón para marcar días sin actividad laboral
- **Modal de edición**: `ModalEditarFalta.vue` con observación y fecha editable
- **Validaciones**: No permite duplicados en misma fecha (ni pedidos ni faltas)
- **Exclusión de estadísticas**: Las faltas NO cuentan en totales, promedios ni días trabajados
- **Filtrado automático**: Aplicado en ContadorPedidosDiarios, PedidosRealizados, ResumenAnual
- **Identificación visual**: Icono `IconCalendarMinus` y color naranja
- **Estructura**: `{ numero: "FALTA", fecha: "03/12/2025", tipo: "falta" }`

### 🔧 **Tecnologías y Dependencias**

- **Framework**: Vue 3 + Quasar
- **Capacitor**: Filesystem, Preferences, Share
- **XLSX**: Procesamiento de archivos Excel
- **jsPDF**: Generación de documentos PDF
- **jsbarcode**: Generación de códigos de barras Code 39
- **@zxing/library**: Escaneo de códigos
- **@tabler/icons-vue**: Iconografía
- **Target**: Android en Play Store

---

### 🎨 **Sistema de Colores (CSS Variables)**

/* Variables */
:root {
  --color-fondo: #121214; /* Fondo principal */
  --color-superficie: #1c1c20; /* Cartas / contenedores */
  --color-texto-principal: #f5f5f5; /* Texto principal */
  --color-texto-secundario: #b4b4be; /* Texto secundario */

  --color-primario: #1e88e5; /* Azul principal */
  --color-primario-claro: #64b5f6;
  --color-primario-oscuro: #1565c0;

  --color-acento: #03a9f4; /* Azul acento (botones, enlaces) */
  --color-borde: #3c3c46; /* Bordes suaves */

  --color-error: #f44336; /* Rojo para errores */
  --color-exito: #4caf50; /* Verde para éxito */
  --color-desactivado: #666; /* Gris usado en botones inactivos */

  --sombra-boton: rgba(0, 0, 0, 0.4);
  --borde-boton: rgba(255, 255, 255, 0.12);

  --color-carga: #ff9800; /* Naranja para carga */
  --color-carga-claro: #ffb74d; /* Naranja claro para gradiente */
  --color-carga-fondo: #fff3e0; /* Fondo suave para estados de carga */
}

---

### Actualización de release 4.2.24

- Se ajustó la barra flotante para quedar lo más abajo posible y subir solo por el espacio real del banner.
- Se incorporó banner adaptativo de AdMob con medición y normalización de altura para distintos celulares.
- Se agregó manejo del botón Atrás nativo para cerrar primero modales, cámaras, buscadores o drawer antes de navegar.
- Se habilitó acceso directo a configuración al tocar el nombre de usuario y foco automático al editarlo.
- Release vigente actualizada: 4.2.24.

### Actualización de release 4.2.26

- El escaneo de pedidos muestra primero el código más reciente y permite ajustar cantidades con controles de menos y más.
- La lista escaneada admite códigos largos y la cámara incorpora una guía visual con una miniatura completa.
- El buscador compartido por Ubicaciones, Consulta De Ubicación y Etiquetas ordena las coincidencias por relevancia.
- El modal de actualización agrupa las novedades por apartado y conserva las notas al regenerar `version.json`.
- Release vigente actualizada: 4.2.26.

### Actualización de release 4.2.27

- Se incorporó el módulo Stock con conteos confirmados y pendientes, diferencias, ubicaciones y exportación Excel.
- Stock admite valores negativos, conserva el orden de llegada y permite continuar conteos repetidos.
- Se mejoró el enfoque de campos en dispositivos táctiles y el comportamiento de los modales de Pedidos.
- Se agregó el tutorial completo de Stock con pasos básicos y consejos de uso.
- Release vigente actualizada: 4.2.27.

### Actualización de release 4.2.28

- El modal de actualización limita su altura, permite desplazar las novedades con el dedo y mantiene sus acciones visibles.
- Release vigente actualizada: 4.2.28.

### Actualización de release 4.2.30

- Los inputs de códigos y ubicaciones conservan el cursor al corregir texto en el medio.
- El contador de pasos incorpora tarjetas navegables por día, sesión, semana y mes con períodos anteriores.
- Las tarjetas del contador de pasos muestran una transición visual al cambiar de período.
- Release vigente actualizada: 4.2.30.

### Actualización de release 4.2.31

- Los códigos escaneados con prefijo del lector se reconocen en Ubicaciones, Consulta De Ubicación, Stock, Etiquetas y Fotos.
- Las tarjetas de artículos en Ubicaciones y Consulta De Ubicación muestran el stock del Excel como referencia.
- El contador de pasos muestra títulos de período más claros y fechas completas al revisar registros anteriores.
- Release vigente actualizada: 4.2.31.

### Actualización de release 4.2.35

- El módulo Etiquetas permite ordenar la lista por recientes, antiguas o alfabéticamente por descripción.
- La aplicación recuerda la última forma de ordenar elegida sin cambiar el orden de impresión de los documentos.
- Release vigente actualizada: 4.2.35.

### Actualización de release 4.2.37

- El módulo Pedidos pasó a llamarse Preparadores en Inicio, navegación y tutoriales.
- El tutorial explica la carga de números de pedido, cantidades de ítems, cámara y lector Bluetooth.
- La barra flotante se ubica a un píxel del banner publicitario usando su altura real.
- Release vigente actualizada: 4.2.37.
