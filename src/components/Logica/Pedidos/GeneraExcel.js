import { Filesystem, Directory } from '@capacitor/filesystem'
import * as XLSX from 'xlsx'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'

function parsearFechaDDMMYYYY(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') return null
  const partes = fechaStr.split('/')
  if (partes.length !== 3) return null
  const [dia, mes, anio] = partes.map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  if (fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia) {
    return fecha
  }
  return null
}

function formatearFechaParaNombreArchivo(fecha) {
  const dia = String(fecha.getDate()).padStart(2, '0')
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const anio = fecha.getFullYear()
  return `${dia}-${mes}-${anio}`
}

export async function generarYGuardarExcelTemporal(pedidos) {
  if (!pedidos || pedidos.length === 0) {
    console.error('No se proporcionaron pedidos para generar el archivo.')
    return null
  }

  try {
    const nombreUsuario = await obtenerNombreUsuario()

    // Parsear fechas
    const fechas = pedidos
      .map((pedido) => parsearFechaDDMMYYYY(pedido.fecha))
      .filter((fecha) => fecha !== null)

    if (fechas.length === 0) {
      console.error('No hay fechas válidas en los pedidos.')
      return null
    }

    // Calcular fecha mínima y máxima
    const fechaMin = new Date(Math.min(...fechas))
    const fechaMax = new Date(Math.max(...fechas))

    // Nombre archivo
    const fechaMinNombre = formatearFechaParaNombreArchivo(fechaMin)
    const fechaMaxNombre = formatearFechaParaNombreArchivo(fechaMax)

    const nombreArchivo = `Pedi ${nombreUsuario} ${fechaMinNombre} - ${fechaMaxNombre}.xlsx`

    const datosParaHoja = pedidos.map((pedido) => {
      return {
        Fechas: pedido.fecha || 'Sin fecha',
        Pedidos: pedido.numero || 'Sin número',
      }
    })
    const hojaDeTrabajo = XLSX.utils.json_to_sheet(datosParaHoja)

    const libroDeTrabajo = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, nombreUsuario)

    const datosEnBase64 = XLSX.write(libroDeTrabajo, { bookType: 'xlsx', type: 'base64' })

    // Guardar archivo temporalmente
    const resultadoEscritura = await Filesystem.writeFile({
      path: nombreArchivo,
      data: datosEnBase64,
      directory: Directory.Cache,
    })

    console.log('Archivo guardado temporalmente en:', resultadoEscritura.uri)
    console.log('Nombre de usuario:', nombreUsuario)

    return { uri: resultadoEscritura.uri, nombreArchivo }
  } catch (error) {
    console.error('Error al generar o guardar el archivo Excel:', error)
    return null
  }
}
