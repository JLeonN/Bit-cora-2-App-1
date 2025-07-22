const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: '/IniciO', component: () => import('pages/Inicio.vue') },
      { path: '/Otro_1', component: () => import('pages/Otro_1.vue') },
      { path: '/Otro_2', component: () => import('pages/Otro_2.vue') },
      { path: '/Otro_3', component: () => import('pages/Otro_3.vue') },
    ],
  },
  {
    path: '/IniciO',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Inicio.vue') }],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
