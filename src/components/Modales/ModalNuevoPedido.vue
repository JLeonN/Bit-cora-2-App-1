<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div :class="['modal-contenido', { activo: modalActivo }]">
      <h2 class="modal-titulo">Nuevo pedido</h2>
      <!-- Campo número de pedido -->
      <form @submit.prevent="agregarPedidoManual">
        <div class="modal-campo">
          <label for="numeroPedido">Número de pedido</label>
          <div class="campo-con-boton">
            <input
              id="numeroPedido"
              v-model="numeroPedido"
              type="text"
              :placeholder="textoPlaceholder"
              @focus="modalActivo = true"
              @blur="modalActivo = false"
              @input="restablecerPlaceholder"
              :class="{ 'input-error': mostrarError, 'animar-error': animarError }"
            />
            <!-- Botón de cámara -->
            <button type="button" class="boton-camara" @click="abrirCamara">
              <IconCamera stroke="{2}" />
            </button>
          </div>
        </div>

        <!-- Botones Aceptar / Cancelar -->
        <div v-if="listaPedidos.length > 0" class="lista-pedidos">
          <h3 class="titulo-lista">Pedidos agregados:</h3>
          <ul>
            <li v-for="(pedido, indice) in listaPedidos" :key="indice" class="item-pedido">
              <span class="texto-pedido">{{ pedido.numero }}</span>
              <div class="acciones-pedido">
                <button type="button" class="boton-accion editar" @click="editarPedido(indice)">
                  ✏️
                </button>
                <button type="button" class="boton-accion borrar" @click="borrarPedido(indice)">
                  🗑️
                </button>
              </div>
            </li>
          </ul>
        </div>

        <DosBotones
          textoAceptar="Confirmar"
          textoCancelar="Cancelar"
          @aceptar="confirmarPedidos"
          @cancelar="$emit('cerrar')"
        />
      </form>
      <!-- Modal de la cámara -->
      <CamaraPedidos
        v-if="mostrarCamaraPedidos"
        @cancelar="cerrarCamaraYVolver"
        @codigo-detectado="onCodigoLeido"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DosBotones from '../Botones/TresBotones.vue'
import { IconCamera } from '@tabler/icons-vue'
import CamaraPedidos from '../Camara/CamaraPedidos.vue'

const emit = defineEmits(['agregar-pedido', 'cerrar'])
const numeroPedido = ref('')
const listaPedidos = ref([]) // 🔹 Array para guardar todos los pedidos (manuales y escaneados)
const modalActivo = ref(false)
const mostrarError = ref(false)
const animarError = ref(false)
const textoPlaceholder = ref('Número de pedido')
const mostrarCamaraPedidos = ref(false)

// Agrega un pedido ingresado manualmente a la lista
const agregarPedidoManual = () => {
  if (!numeroPedido.value.trim()) {
    mostrarError.value = true
    textoPlaceholder.value = '¡El campo no puede estar vacío!'
    animarError.value = true
    setTimeout(() => (animarError.value = false), 500)
    return
  }

  listaPedidos.value.push({
    numero: numeroPedido.value.trim(),
    fecha: new Date().toISOString().split('T')[0], // La fecha se asigna aquí
  })

  // Limpia el input para el siguiente
  numeroPedido.value = ''
  mostrarError.value = false
  restablecerPlaceholder()
}

// Confirma y envía todos los pedidos de la lista al componente padre
const confirmarPedidos = () => {
  // Solo emite si hay al menos un pedido en la lista
  if (listaPedidos.value.length > 0) {
    emit('agregar-pedido', listaPedidos.value)
    listaPedidos.value = [] // Limpia la lista después de confirmar
  } else {
    // Si no hay pedidos, simplemente cierra el modal
    emit('cerrar')
  }
}

// Restablece el placeholder del input
const restablecerPlaceholder = () => {
  mostrarError.value = false
  textoPlaceholder.value = 'Número de pedido'
}

// Abrir cámara
const abrirCamara = () => {
  mostrarCamaraPedidos.value = true
}
// Cerrar cámara y volver al modal de pedido
const cerrarCamaraYVolver = () => {
  mostrarCamaraPedidos.value = false
}

// Recibe el array de códigos leídos desde CamaraPedidos y los agrega a la lista
const onCodigoLeido = (codigos) => {
  codigos.forEach((codigo) => {
    // Evita agregar duplicados si ya están en la lista
    if (!listaPedidos.value.some((p) => p.numero === codigo)) {
      listaPedidos.value.push({
        numero: codigo,
        fecha: new Date().toISOString().split('T')[0],
      })
    }
  })
  mostrarCamaraPedidos.value = false // Cierra la cámara al recibir los códigos
}

// Borra un pedido de la lista según su índice
const borrarPedido = (indice) => {
  listaPedidos.value.splice(indice, 1)
}

// Edita un pedido (función pendiente de implementar)
const editarPedido = (indice) => {
  // Aquí podrías mover el valor al input principal para su edición
  const pedidoAEditar = listaPedidos.value[indice]
  numeroPedido.value = pedidoAEditar.numero
  borrarPedido(indice) // Lo borramos para que al modificarlo se agregue como nuevo
  document.getElementById('numeroPedido').focus()
}
</script>

<style scoped>
.lista-pedidos {
  margin-top: 1rem;
  max-height: 200px; /* Altura máxima para la lista antes de hacer scroll */
  overflow-y: auto; /* Habilita el scroll vertical si es necesario */
}

.titulo-lista {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
}

.item-pedido {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f5f5f5;
  padding: 0.5rem 0.8rem;
  margin-bottom: 0.4rem;
  border-radius: 8px;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.texto-pedido {
  font-weight: 500;
  word-break: break-all; /* Evita que textos largos rompan el layout */
}

.acciones-pedido {
  display: flex;
  gap: 0.5rem;
}

.boton-accion {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.1rem;
  transition: transform 0.2s;
}

.boton-accion:hover {
  transform: scale(1.2);
}

.boton-accion.editar {
  color: #007bff;
}

.boton-accion.borrar {
  color: #e63946;
}
</style>
