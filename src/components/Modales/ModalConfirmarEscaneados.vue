<template>
  <div class="contenedor-tabla modal-contenedor">
    <div class="modal-caja">
      <div class="encabezado-pedidos">
        <h2 class="titulo-tabla">Pedidos Escaneados ({{ pedidos.length }})</h2>
      </div>

      <table class="tabla">
        <thead>
          <tr>
            <th>Número de Pedido</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(pedido, indice) in pedidos" :key="indice">
            <td>
              <span class="globito" :title="pedido">
                {{ pedido.slice(0, 15) }}
                <span v-if="pedido.length > 15">...</span>
              </span>
            </td>
            <td class="acciones">
              <IconPencil class="icono-accion icono-editar" />
              <IconTrash class="icono-accion icono-borrar" />
            </td>
          </tr>
        </tbody>
      </table>

      <TresBotones
        textoAceptar="Aceptar"
        textoCancelar="Cancelar"
        @aceptar="confirmarPedidos"
        @cancelar="$emit('cancelar')"
      />
    </div>
  </div>
</template>

<script setup>
import { IconPencil, IconTrash } from '@tabler/icons-vue'
import TresBotones from '../Botones/TresBotones.vue'

const props = defineProps({
  pedidos: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['guardar', 'cancelar'])

const confirmarPedidos = () => {
  emit('guardar', props.pedidos)
}
</script>
