<template>
  <div></div>
</template>

<script setup>
import * as XLSX from 'xlsx'
import { watch } from 'vue'

const props = defineProps({
  pedidos: {
    type: Array,
    required: true,
  },
})

watch(
  () => props.pedidos,
  (nuevosPedidos) => {
    if (nuevosPedidos && nuevosPedidos.length > 0) {
      exportarExcel(nuevosPedidos)
    }
  },
  { immediate: false },
)

function exportarExcel(pedidos) {
  const datosParaExportar = pedidos.map((pedido) => ({
    Fecha: pedido.fecha,
    Pedido: pedido.numero,
  }))

  const hoja = XLSX.utils.json_to_sheet(datosParaExportar)
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Pedidos')

  XLSX.writeFile(libro, 'Pedidos-Realizados.xlsx')
}
</script>
