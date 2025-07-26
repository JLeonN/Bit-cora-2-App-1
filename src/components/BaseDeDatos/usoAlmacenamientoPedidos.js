import { Storage } from '@capacitor/storage'

const CLAVE_PEDIDOS = 'historial_de_pedidos'
const CLAVE_ULTIMO_ENVIO = 'fecha_ultimo_envio'

export async function guardarPedidos(pedidos) {
  try {
    await Storage.set({
      key: CLAVE_PEDIDOS,
      value: JSON.stringify(pedidos),
    })
    console.log('Pedidos guardados correctamente.')
  } catch (error) {
    console.error('Error al guardar los pedidos:', error)
  }
}

export async function obtenerPedidos() {
  try {
    const { value } = await Storage.get({ key: CLAVE_PEDIDOS })
    return value ? JSON.parse(value) : []
  } catch (error) {
    console.error('Error al leer los pedidos:', error)
    return []
  }
}

export async function eliminarPedidos() {
  try {
    await Storage.remove({ key: CLAVE_PEDIDOS })
    console.log('Pedidos eliminados del almacenamiento.')
  } catch (error) {
    console.error('Error al eliminar los pedidos:', error)
  }
}

export async function guardarFechaUltimoEnvio(fecha) {
  try {
    await Storage.set({
      key: CLAVE_ULTIMO_ENVIO,
      value: fecha,
    })
    console.log('Fecha de último envío guardada:', fecha)
  } catch (error) {
    console.error('Error al guardar la fecha del último envío:', error)
  }
}

export async function obtenerFechaUltimoEnvio() {
  try {
    const { value } = await Storage.get({ key: CLAVE_ULTIMO_ENVIO })
    return value || null
  } catch (error) {
    console.error('Error al obtener la fecha del último envío:', error)
    return null
  }
}
