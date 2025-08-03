// src/Utilidades/exportarExcel.js

import * as XLSX from 'xlsx'

export default function exportarExcel(pedidos) {
  return new Promise((resolve, reject) => {
    try {
      const datosParaExportar = pedidos.map((pedido) => ({
        Fecha: pedido.fecha,
        Pedido: pedido.numero,
      }))

      const hoja = XLSX.utils.json_to_sheet(datosParaExportar)
      const libro = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(libro, hoja, 'Pedidos')

      XLSX.writeFile(libro, 'Pedidos Realizados.xlsx')

      resolve()
    } catch (error) {
      reject(error)
    }
  })
}
