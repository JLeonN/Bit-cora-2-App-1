const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // PÁGINA DE INICIO - Panel principal con navegación a las funciones
      { path: '/', component: () => import('../components/Inicio/PanelInicio.vue') },
      // PEDIDOS - Pantalla principal con tabla y contador diario
      { path: '/TablaPedidos', component: () => import('pages/TablaPedidos.vue') },
      // HISTORIAL DE PEDIDOS - Vista agrupada por fechas con opciones de envío
      {
        path: '/historial',
        component: () => import('../components/Logica/Pedidos/HistorialPedidos.vue'),
      },
      // PEDIDOS REALIZADOS - Lista completa de todos los pedidos guardados
      {
        path: '/pedidos-realizados',
        name: 'PedidosRealizados',
        component: () => import('../components/Logica/Pedidos/PedidosRealizados.vue'),
      },
      // ESTADÍSTICAS DE PEDIDOS - Análisis y métricas de pedidos
      {
        path: '/estadisticas-pedidos',
        name: 'EstadisticasPedidos',
        component: () =>
          import('../components/Logica/Pedidos/Estadisticas/EstadisticasPedidos.vue'),
      },
      // UBICACIONES - Gestión completa de ubicaciones de artículos
      { path: '/AjustarUbicaciones', component: () => import('src/pages/AjustarUbicaciones.vue') },
      // CONFIGURACIÓN - Ajustes de usuario y preferencias de la app
      {
        path: '/configuracion',
        name: 'Configuracion',
        component: () => import('pages/PaginaConfiguracion.vue'),
      },
      // ETIQUETAS - Generación de etiquetas con códigos de barras
      {
        path: '/etiquetas',
        name: 'Etiquetas',
        component: () => import('pages/PaginaEtiquetas.vue'),
      },
    ],
  },
  // PÁGINA 404 - Manejo de rutas no encontradas
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]
export default routes
