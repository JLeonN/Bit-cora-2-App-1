### **Módulo de Configuración - Bitácora II**

Sistema completo para gestionar configuración personalizada del usuario, nombres en archivos exportados, tutoriales integrados y sistema VIP con monetización AdMob.

---

### 📦 **Componentes Principales**

#### **PaginaConfiguracion.vue**
- Página principal de configuración en `/configuracion`
- Accesible desde botón en footer del drawer
- Secciones colapsables: Información Personal (expandida) y Tutoriales (colapsada)
- El Inicio puede abrir y resaltar directamente Información Personal o Tutoriales según la acción elegida.
- Diseño responsive

#### **ConfiguracionUsuario.vue**
- Formulario para gestionar nombre de usuario
- Validaciones: mínimo 2 caracteres, diferente al actual
- Botones: guardar, resetear (con modal confirmación)
- **Sección VIP integrada**: Botón "Acceso Premium" para ingresar clave
- **Dialog VIP**: Input con validación en tiempo real
- **Estado VIP activo**: Badge verde con opción de desactivar
- Tutorial integrado explicando uso del nombre en archivos
- Notificaciones de éxito/error con Quasar Notify
- Persistencia automática en @capacitor/preferences

#### **TarjetaSeccion.vue**
- Componente reutilizable para secciones colapsables
- Props: título, icono, expandidaPorDefecto
- Animaciones suaves y efectos hover

#### **SeccionTutoriales.vue**
- Contiene acordeones de 3 tutoriales (Pedidos, Ubicaciones, Etiquetas)
- Solo uno expandido a la vez
- Iconos consistentes con el drawer

#### **Tutoriales Individuales**
- **TutorialPedidos.vue**: 4 pasos básicos + 3 tips útiles
- **TutorialUbicaciones.vue**: 5 pasos básicos + 4 tips útiles
- **TutorialEtiquetas.vue**: 5 pasos básicos + 5 tips útiles
- Pasos numerados con iconos visuales

---

### 💎 **Sistema VIP y Monetización**

#### **usoAlmacenamientoVIP.js**
- Gestión de acceso VIP mediante clave maestra configurable
- Almacenamiento en @capacitor/preferences con key `"acceso_vip_usuario"`

**Funciones principales**:
- `validarClaveVIP(claveIngresada)`: Valida clave
- `guardarClaveVIP(clave)`: Guarda en preferences
- `tieneAccesoVIP()`: Verifica si usuario tiene acceso activo
- `obtenerConfiguracionVIP()`: Info completa del acceso
- `eliminarClaveVIP()`: Elimina acceso (testing/reseteo)

**Estructura guardada**:
- claveActiva (boolean)
- fechaActivacion (ISO date)
- version

#### **BannerAdMob.vue**
- Banner publicitario integrado con @capacitor-community/admob
- Verificación automática de estado VIP antes de mostrar
- Emite evento `banner-visible` al padre
- IDs configurables: Application ID y Banner Ad Unit ID
- Flag `isTesting` para desarrollo seguro
- Inicialización en `onMounted`, limpieza en `onUnmounted`
- Altura fija: 60px, posición `BOTTOM_CENTER`

#### **Integración en ConfiguracionUsuario.vue**
- Botón VIP con gradiente morado/azul e IconDiamond
- Dialog con q-card de Quasar
- Validación en tiempo real con mensajes de error
- Mensaje de éxito incluye "Reiniciá la app"
- Badge verde con IconCircleCheck cuando está activo
- Botón desactivar para testing

---

### 💾 **Almacenamiento**

#### **usoAlmacenamientoConfiguracion.js**
- Key: `"configuracion_usuario"`
- Valor por defecto: "Usua desconocido"
- Funciones: `guardarNombreUsuario()`, `obtenerNombreUsuario()`, `limpiarConfiguracionUsuario()`, `obtenerConfiguracionCompleta()`
- Estructura: nombreUsuario + fechaActualizacion

#### **usoAlmacenamientoVIP.js**
- Key: `"acceso_vip_usuario"`
- Validación de claves y gestión de estado premium

---

### 🔄 **Integración con MainLayout**

#### **Header**
- Nombre dinámico en toolbar
- Polling cada 5 segundos para actualización automática

#### **Drawer**
- Avatar dinámico con `@{{ nombreUsuario }}`
- Botón Configuración en footer con IconSettings
- Animación de rotación al hover

#### **Banner AdMob**
- Integrado después de BarraBotonesInferior
- Recibe evento `@banner-visible` desde BannerAdMob
- Pasa prop `hayBannerVisible` a botones
- Padding dinámico: 140px (80px botones + 60px banner)

---

### 🎨 **Botones con AdMob**

#### **BarraBotonesInferior.vue**
- Prop: `hayBannerVisible` (Boolean)
- Clase dinámica: `.con-banner` cuando hay banner
- Transición suave: `transition: bottom 0.3s ease`
- Posición adaptativa:
  - Sin banner: `bottom: 26px`
  - Con banner: `bottom: 86px`
- Responsive con ajustes en media queries

---

### 📁 **Nombres Personalizados en Archivos**

Todos los exportadores usan `obtenerNombreUsuario()`:

- **Pedidos**: `Pedi [Usuario] DD-MM-AAAA.xlsx`
- **Ubicaciones**: `Ubic [Usuario].xlsx`
- **Etiquetas**: `Etiquetas - [Usuario] - tamaño.pdf`

Implementado en: ExportarPedidosExcel.js, ExportarUbicacionesExcel.js, GeneradorEtiquetasPDF.js

---

### 📱 **Configuración AdMob**

#### **capacitor.config.json**
- Plugin AdMob con appId y testDevices

#### **AndroidManifest.xml**
- Permisos: INTERNET, ACCESS_NETWORK_STATE
- Meta-data con APPLICATION_ID de AdMob

#### **IDs necesarios**
1. **Application ID** (termina con `~`): En config y manifest
2. **Banner Ad Unit ID** (termina con `/`): En BannerAdMob.vue

#### **Modos**
- Desarrollo: `isTesting: true` (anuncios de prueba)
- Producción: `isTesting: false` (anuncios reales)

---

### 🔧 **Dependencias**

- @capacitor/preferences: Persistencia
- @capacitor-community/admob: SDK de AdMob
- Quasar Notify: Notificaciones
- @tabler/icons-vue: Iconografía (IconDiamond, IconCircleCheck, etc.)

---

### 📝 **Notas Importantes**

- Carga automática al iniciar con polling cada 5s
- Modal de confirmación previene reseteos accidentales
- Placeholder dinámico mejora UX
- Sistema VIP usa clave maestra en código
- Banner se oculta automáticamente para VIP
- Barra de botones sube/baja automáticamente según banner
- AdMob solo funciona en móviles (Android/iOS), no en web
- IDs de prueba obligatorios durante desarrollo
- Mensaje de reinicio al activar/desactivar VIP
- Validación case-insensitive de claves
- Sin límite de intentos de clave
- Persistencia local sin conexión internet

---

### 🎯 **Flujo Usuario VIP**

1. Entra a Configuración
2. Clic en "Acceso Premium"
3. Dialog se abre con input
4. Ingresa clave y valida
5. Si correcta: guarda, muestra éxito, reiniciar app oculta banner
6. Si incorrecta: mensaje de error, puede reintentar

---

### 💰 **Estrategia Monetización**

- Banner permanente en todas las páginas (usuarios estándar)
- Posición fija abajo, no intrusiva
- Sistema VIP por invitación con clave única
- Sin pagos integrados (distribución manual)
- IDs de prueba en desarrollo, producción al publicar
