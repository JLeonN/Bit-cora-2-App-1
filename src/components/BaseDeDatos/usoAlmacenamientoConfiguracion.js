import { Preferences } from '@capacitor/preferences'

const CLAVE_CONFIGURACION_USUARIO = 'configuracion_usuario'
export const NOMBRE_USUARIO_PREDETERMINADO = 'Bitácora'

export async function guardarNombreUsuario(nombre) {
  try {
    const configuracion = {
      nombreUsuario: nombre.trim(),
      fechaActualizacion: new Date().toISOString(),
    }

    await Preferences.set({
      key: CLAVE_CONFIGURACION_USUARIO,
      value: JSON.stringify(configuracion),
    })

    console.log('Nombre de usuario guardado:', nombre)
    return true
  } catch (error) {
    console.error('Error al guardar nombre de usuario:', error)
    return false
  }
}

export async function obtenerNombreUsuario() {
  try {
    const { value } = await Preferences.get({ key: CLAVE_CONFIGURACION_USUARIO })

    if (value) {
      const configuracion = JSON.parse(value)
      return configuracion.nombreUsuario?.trim() || NOMBRE_USUARIO_PREDETERMINADO
    }

    return NOMBRE_USUARIO_PREDETERMINADO
  } catch (error) {
    console.error('Error al obtener nombre de usuario:', error)
    return NOMBRE_USUARIO_PREDETERMINADO
  }
}

export async function limpiarConfiguracionUsuario() {
  try {
    await Preferences.remove({ key: CLAVE_CONFIGURACION_USUARIO })
    console.log('Configuración de usuario eliminada')
    return true
  } catch (error) {
    console.error('Error al limpiar configuración:', error)
    return false
  }
}

export async function obtenerConfiguracionCompleta() {
  try {
    const { value } = await Preferences.get({ key: CLAVE_CONFIGURACION_USUARIO })

    if (value) {
      return JSON.parse(value)
    }

    return {
      nombreUsuario: NOMBRE_USUARIO_PREDETERMINADO,
      fechaActualizacion: null,
    }
  } catch (error) {
    console.error('Error al obtener configuración completa:', error)
    return {
      nombreUsuario: NOMBRE_USUARIO_PREDETERMINADO,
      fechaActualizacion: null,
    }
  }
}
