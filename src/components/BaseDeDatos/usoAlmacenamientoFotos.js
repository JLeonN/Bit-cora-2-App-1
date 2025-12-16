import { Preferences } from '@capacitor/preferences'

const CLAVE_FOTOS = 'fotos_productos'

// Estructura de foto: { id, codigo, nombreArticulo, rutaFoto, fecha }

export async function guardarFotos(fotos) {
  try {
    await Preferences.set({
      key: CLAVE_FOTOS,
      value: JSON.stringify(fotos),
    })
    console.log('Fotos guardadas correctamente')
    return true
  } catch (error) {
    console.error('Error al guardar fotos:', error)
    return false
  }
}

export async function obtenerFotos() {
  try {
    const { value } = await Preferences.get({ key: CLAVE_FOTOS })
    if (value) {
      return JSON.parse(value)
    }
    return []
  } catch (error) {
    console.error('Error al obtener fotos:', error)
    return []
  }
}

export async function agregarFoto(codigo, nombreArticulo, rutaFoto) {
  try {
    const fotosActuales = await obtenerFotos()
    const nuevaFoto = {
      id: Date.now(),
      codigo: codigo.toUpperCase(),
      nombreArticulo: nombreArticulo.toUpperCase(),
      rutaFoto: rutaFoto,
      fecha: new Date().toISOString(),
    }
    fotosActuales.push(nuevaFoto)
    await guardarFotos(fotosActuales)
    console.log('Foto agregada:', nuevaFoto)
    return true
  } catch (error) {
    console.error('Error al agregar foto:', error)
    return false
  }
}

export async function eliminarFoto(id) {
  try {
    const fotosActuales = await obtenerFotos()
    const fotosFiltradas = fotosActuales.filter((foto) => foto.id !== id)
    await guardarFotos(fotosFiltradas)
    console.log('Foto eliminada con ID:', id)
    return true
  } catch (error) {
    console.error('Error al eliminar foto:', error)
    return false
  }
}

export async function editarCodigoFoto(id, nuevoCodigo, nuevoNombre) {
  try {
    const fotosActuales = await obtenerFotos()
    const fotoIndex = fotosActuales.findIndex((foto) => foto.id === id)

    if (fotoIndex !== -1) {
      fotosActuales[fotoIndex].codigo = nuevoCodigo.toUpperCase()
      fotosActuales[fotoIndex].nombreArticulo = nuevoNombre.toUpperCase()
      await guardarFotos(fotosActuales)
      console.log('Código y nombre actualizados para foto ID:', id)
      return true
    }
    return false
  } catch (error) {
    console.error('Error al editar foto:', error)
    return false
  }
}

export async function limpiarFotos() {
  try {
    await Preferences.remove({ key: CLAVE_FOTOS })
    console.log('Todas las fotos eliminadas')
    return true
  } catch (error) {
    console.error('Error al limpiar fotos:', error)
    return false
  }
}
