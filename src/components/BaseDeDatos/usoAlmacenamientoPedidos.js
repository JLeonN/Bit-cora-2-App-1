import { Storage } from '@capacitor/storage'

const CLAVE_PEDIDOS = 'historial_de_pedidos'

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
