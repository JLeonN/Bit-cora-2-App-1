import * as XLSX from 'xlsx'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'

// --- CONFIGURACIÓN DE ANCHOS DE COLUMNAS ---
const ANCHOS_COLUMNAS = [
  { wch: 11 }, // Fechas
  { wch: 11 }, // Pedidos
  { wch: 8 }, // Items
]

export async function generarYGuardarExcelParaDescarga(pedidos) {
  const nombreUsuario = await obtenerNombreUsuario()

  const datosParaExportar = pedidos.map((pedido) => ({
    Fecha: pedido.fecha,
    Pedido: pedido.numero,
    Items: pedido.items || 1,
  }))

  const hoja = XLSX.utils.json_to_sheet(datosParaExportar)

  // --- APLICAR ANCHOS DE COLUMNAS ---
  hoja['!cols'] = ANCHOS_COLUMNAS

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, nombreUsuario)

  const fechaActual = new Date()
  const mes = String(fechaActual.getMonth() + 1).padStart(2, '0')
  const anio = fechaActual.getFullYear()
  const nombreArchivo = `Pedi ${nombreUsuario} - ${mes}-${anio}.xlsx`

  XLSX.writeFile(libro, nombreArchivo)
}
