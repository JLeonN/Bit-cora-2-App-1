const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '/', component: () => import('../components/Inicio/PanelInicio.vue') },
      { path: '/TablaPedidos', component: () => import('pages/TablaPedidos.vue') },
      { path: '/historial', component: () => import('components/Pedidos/HistorialPedidos.vue') },
      {
        path: '/pedidos-realizados',
        name: 'PedidosRealizados',
        component: () => import('../components/Pedidos/PedidosRealizados.vue'),
      },
      { path: '/AjustarUbicaciones', component: () => import('src/pages/AjustarUbicaciones.vue') },
      { path: '/Otro_2', component: () => import('pages/Otro_2.vue') },
      { path: '/Otro_3', component: () => import('pages/Otro_3.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
