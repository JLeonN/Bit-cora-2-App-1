const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '/TablaPedidos', component: () => import('pages/TablaPedidos.vue') },
      { path: '/Otro_1', component: () => import('pages/Otro_1.vue') },
      { path: '/Otro_2', component: () => import('pages/Otro_2.vue') },
      { path: '/Otro_3', component: () => import('pages/Otro_3.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
