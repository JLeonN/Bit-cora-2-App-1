import * as XLSX from 'xlsx'

export function generarYGuardarExcelParaDescarga(pedidos) {
  return new Promise((resolver, rechazar) => {
    try {
      const datosParaExportar = pedidos.map((pedido) => ({
        Fecha: pedido.fecha,
        Pedido: pedido.numero,
      }))

      const hoja = XLSX.utils.json_to_sheet(datosParaExportar)
      const libro = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(libro, hoja, 'Pedidos')

      XLSX.writeFile(libro, 'Pedidos Realizados.xlsx')

      resolver()
    } catch (error) {
      rechazar(error)
    }
  })
}
