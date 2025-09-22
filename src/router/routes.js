const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '/', component: () => import('../components/Inicio/PanelInicio.vue') },
      { path: '/TablaPedidos', component: () => import('pages/TablaPedidos.vue') },
      {
        path: '/historial',
        component: () => import('../components/Logica/Pedidos/HistorialPedidos.vue'),
      },
      {
        path: '/pedidos-realizados',
        name: 'PedidosRealizados',
        component: () => import('../components/Logica/Pedidos/PedidosRealizados.vue'),
      },
      { path: '/AjustarUbicaciones', component: () => import('src/pages/AjustarUbicaciones.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
