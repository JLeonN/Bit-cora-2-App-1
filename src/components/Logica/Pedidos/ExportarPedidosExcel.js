import * as XLSX from 'xlsx'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'

export async function generarYGuardarExcelParaDescarga(pedidos) {
  return new Promise((resolver, rechazar) => {
    obtenerNombreUsuario()
      .then((nombreUsuario) => {
        try {
          const datosParaExportar = pedidos.map((pedido) => ({
            Fecha: pedido.fecha,
            Pedido: pedido.numero,
          }))

          const hoja = XLSX.utils.json_to_sheet(datosParaExportar)
          const libro = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(libro, hoja, nombreUsuario)

          const fechaActual = new Date()
          const mes = String(fechaActual.getMonth() + 1).padStart(2, '0')
          const anio = fechaActual.getFullYear()
          const nombreArchivo = `Pedi ${nombreUsuario} - ${mes}-${anio}.xlsx`

          XLSX.writeFile(libro, nombreArchivo)

          resolver()
        } catch (error) {
          rechazar(error)
        }
      })
      .catch(rechazar)
  })
}
