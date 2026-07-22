import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'

function redirigirEnlaceUbicacionesCompartidas() {
  if (typeof window === 'undefined') return

  const urlActual = new URL(window.location.href)
  const idDocumento = urlActual.searchParams.get('ubicacionesCompartidas')
  if (!idDocumento) return

  urlActual.search = ''
  urlActual.hash = `/recibir-ubicaciones?id=${encodeURIComponent(idDocumento)}`
  window.history.replaceState({}, '', urlActual)
}

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  redirigirEnlaceUbicacionesCompartidas()
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  return Router
})
