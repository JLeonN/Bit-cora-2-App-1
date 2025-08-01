// archivo: usoAlmacenamientoCapacitor.js
import { Preferences } from '@capacitor/preferences'

const CLAVE_PEDIDOS = 'historial_de_pedidos'
const CLAVE_FECHA_ENVIO = 'fecha_ultimo_envio'

export async function guardarPedidos(pedidos) {
  try {
    await Preferences.set({
      key: CLAVE_PEDIDOS,
      value: JSON.stringify(pedidos),
    })
  } catch (error) {
    console.error('Error al guardar los pedidos:', error)
  }
}

export async function obtenerPedidos() {
  try {
    const { value } = await Preferences.get({ key: CLAVE_PEDIDOS })
    return value ? JSON.parse(value) : []
  } catch (error) {
    console.error('Error al leer los pedidos:', error)
    return []
  }
}

export async function guardarFechaUltimoEnvio(fechaISO) {
  try {
    await Preferences.set({
      key: CLAVE_FECHA_ENVIO,
      value: fechaISO,
    })
  } catch (error) {
    console.error('Error al guardar la fecha del último envío:', error)
  }
}

export async function obtenerFechaUltimoEnvio() {
  try {
    const { value } = await Preferences.get({ key: CLAVE_FECHA_ENVIO })
    return value || null
  } catch (error) {
    console.error('Error al obtener la fecha del último envío:', error)
    return null
  }
}
