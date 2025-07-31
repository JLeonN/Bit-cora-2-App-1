import { Preferences } from '@capacitor/preferences'

const CLAVE_PEDIDOS = 'historial_de_pedidos'

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
