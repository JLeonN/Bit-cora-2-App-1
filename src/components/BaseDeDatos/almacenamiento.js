const usarCapacitor = true

let funciones

if (usarCapacitor) {
  funciones = await import('./usoAlmacenamientoCapacitor.js')
} else {
  funciones = await import('./usoAlmacenamientoPedidos.js')
}

export const {
  guardarPedidos,
  obtenerPedidos,
  eliminarPedidos,
  guardarFechaUltimoEnvio,
  obtenerFechaUltimoEnvio,
} = funciones
