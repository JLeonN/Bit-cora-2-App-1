const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '/TablaPedidos', component: () => import('pages/TablaPedidos.vue') },
      { path: '/historial', component: () => import('components/Pedidos/HistorialPedidos.vue') },
      {
        path: '/pedidos-realizados',
        name: 'PedidosRealizados',
        component: () => import('../components/Pedidos/PedidosRealizados.vue'),
      },
      { path: '/Otro_1', component: () => import('pages/Otro_1.vue') },
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
