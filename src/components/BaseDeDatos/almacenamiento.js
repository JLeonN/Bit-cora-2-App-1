// archivo: almacenamiento.js
import * as funcionesCapacitor from './usoAlmacenamientoCapacitor.js'
import * as funcionesLocal from './usoAlmacenamientoPedidos.js'

const usarCapacitor = true
const funciones = usarCapacitor ? funcionesCapacitor : funcionesLocal

export const {
  guardarPedidos,
  obtenerPedidos,
  eliminarPedidos,
  guardarFechaUltimoEnvio,
  obtenerFechaUltimoEnvio,
} = funciones
