<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div :class="['modal-contenido', { activo: modalActivo }]">
      <h2 class="modal-titulo">Nuevo pedido</h2>

      <form @submit.prevent="confirmarTodosPedidos">
        <!-- Campo número de pedido con flecha -->
        <div class="modal-campo">
          <label for="numeroPedido">Número de pedido</label>
          <div class="campo-con-boton">
            <input
              ref="inputRef"
              id="numeroPedido"
              v-model="numeroPedido"
              type="text"
              :placeholder="textoPlaceholder"
              @focus="modalActivo = true"
              @blur="modalActivo = false"
              @input="restablecerPlaceholder"
              @keyup.enter="agregarPedidoALista"
              :class="{ 'input-error': mostrarError, 'animar-error': animarError }"
            />

            <!-- Botón flecha para agregar a la lista -->
            <button
              type="button"
              class="boton-flecha"
              :class="{ 'boton-inactivo': !puedeAgregar }"
              :disabled="!puedeAgregar"
              @click="agregarPedidoALista"
            >
              <IconArrowRight :stroke="2" />
            </button>

            <!-- Botón de cámara -->
            <button type="button" class="boton-camara" @click="abrirCamara">
              <IconCamera :stroke="2" />
            </button>
          </div>
        </div>

        <!-- Contador de pedidos agregados -->
        <div v-if="pedidosTemporales.length > 0" class="contador-pedidos">
          <span class="badge-contador"
            >{{ pedidosTemporales.length }} pedido{{
              pedidosTemporales.length !== 1 ? 's' : ''
            }}
            agregado{{ pedidosTemporales.length !== 1 ? 's' : '' }}</span
          >
        </div>

        <!-- Mini lista de pedidos temporales -->
        <div v-if="pedidosTemporales.length > 0" class="contenedor-mini-lista">
          <div class="mini-lista">
            <div
              v-for="(pedido, index) in pedidosTemporales"
              :key="index"
              class="item-mini-lista"
              :class="{ 'item-animado': index === pedidosTemporales.length - 1 }"
            >
              <span class="numero-pedido">{{ pedido }}</span>
              <button type="button" class="boton-eliminar-item" @click="eliminarDeLista(index)">
                <IconX :size="18" :stroke="2" />
              </button>
            </div>
          </div>
        </div>

        <!-- Botones Confirmar / Cancelar -->
        <DosBotones
          textoAceptar="Confirmar"
          textoCancelar="Cancelar"
          :layout-completo="true"
          @aceptar="confirmarTodosPedidos"
          @cancelar="cancelarYCerrar"
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
import { ref, computed, nextTick, onMounted } from 'vue'
import DosBotones from '../Botones/TresBotones.vue'
import { IconCamera, IconArrowRight, IconX } from '@tabler/icons-vue'
import CamaraPedidos from '../Logica/Pedidos/CamaraPedidos.vue'

const emit = defineEmits(['agregar-pedido', 'cerrar'])

// Referencias
const inputRef = ref(null)

// Estado
const numeroPedido = ref('')
const pedidosTemporales = ref([])
const modalActivo = ref(false)
const mostrarError = ref(false)
const animarError = ref(false)
const textoPlaceholder = ref('Número de pedido')
const mostrarCamaraPedidos = ref(false)

// Computed
const puedeAgregar = computed(() => {
  return numeroPedido.value.trim() !== ''
})

// Agregar pedido a la lista temporal
const agregarPedidoALista = () => {
  if (!puedeAgregar.value) return

  const numero = numeroPedido.value.trim()
  pedidosTemporales.value.push(numero)

  // Auto-incremento inteligente
  const ultimoNumero = parseInt(numero)
  if (!isNaN(ultimoNumero)) {
    numeroPedido.value = String(ultimoNumero + 1)
    // Seleccionar el texto automáticamente
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.select()
      }
    })
  } else {
    // Si no es número, solo limpiamos
    numeroPedido.value = ''
  }

  // Auto-scroll al final de la lista
  nextTick(() => {
    const miniLista = document.querySelector('.mini-lista')
    if (miniLista) {
      miniLista.scrollTop = miniLista.scrollHeight
    }
  })

  restablecerPlaceholder()
}

// Eliminar de la lista temporal
const eliminarDeLista = (index) => {
  pedidosTemporales.value.splice(index, 1)
}

// Confirmar todos los pedidos
const confirmarTodosPedidos = () => {
  // Si no hay pedidos en la lista, intentamos agregar el del input
  if (pedidosTemporales.value.length === 0) {
    if (!numeroPedido.value.trim()) {
      mostrarError.value = true
      textoPlaceholder.value = '¡El campo no puede estar vacío!'
      animarError.value = true
      setTimeout(() => (animarError.value = false), 500)
      return
    }
    // Agregar el del input si hay algo escrito
    pedidosTemporales.value.push(numeroPedido.value.trim())
  }

  // Emitir todos los pedidos al padre
  emit(
    'agregar-pedido',
    pedidosTemporales.value.map((numero) => ({
      numero: numero,
      fecha: new Date().toISOString().split('T')[0],
    })),
  )

  // Limpiar y cerrar
  limpiarTodo()
  emit('cerrar')
}

// Cancelar y cerrar
const cancelarYCerrar = () => {
  limpiarTodo()
  emit('cerrar')
}

// Limpiar todo
const limpiarTodo = () => {
  numeroPedido.value = ''
  pedidosTemporales.value = []
  mostrarError.value = false
  restablecerPlaceholder()
}

const restablecerPlaceholder = () => {
  mostrarError.value = false
  textoPlaceholder.value = 'Número de pedido'
}

// Abrir cámara
const abrirCamara = () => {
  mostrarCamaraPedidos.value = true
}

const cerrarCamaraYVolver = () => {
  mostrarCamaraPedidos.value = false
}

// Los pedidos de la cámara pueden ser varios
const onCodigoLeido = (codigos) => {
  emit(
    'agregar-pedido',
    codigos.map((codigo) => ({
      numero: codigo,
      fecha: new Date().toISOString().split('T')[0],
    })),
  )
  mostrarCamaraPedidos.value = false
  emit('cerrar')
}

// Focus automático al montar
onMounted(() => {
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus()
    }
  })
})
</script>

<style scoped>
/* Estilos existentes del modal */
.modal-fondo {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-contenido {
  background: var(--color-superficie);
  border-radius: 16px;
  padding: 1.5rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}
.modal-titulo {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-texto-principal);
}
.modal-campo {
  margin-bottom: 1rem;
}
.modal-campo label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  color: var(--color-texto-secundario);
}
.campo-con-boton {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.campo-con-boton input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  font-size: 1rem;
}
.campo-con-boton input:focus {
  outline: none;
  border-color: var(--color-acento);
}
.input-error {
  border-color: var(--color-error) !important;
}
.animar-error {
  animation: shake 0.5s;
}
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}
/* Botón flecha */
.boton-flecha {
  background: var(--color-acento);
  border: none;
  border-radius: 8px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
}
.boton-flecha:hover:not(.boton-inactivo) {
  background: var(--color-primario);
  transform: scale(1.05);
}
.boton-flecha:active:not(.boton-inactivo) {
  transform: scale(0.95);
}
.boton-inactivo {
  background: var(--color-desactivado);
  cursor: not-allowed;
  opacity: 0.5;
}
/* Botón cámara */
.boton-camara {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-acento);
}
.boton-camara:hover {
  transform: scale(1.05);
  background: var(--color-fondo);
}
.boton-camara:active {
  transform: scale(0.95);
}
/* Contador de pedidos */
.contador-pedidos {
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.badge-contador {
  display: inline-block;
  background: var(--color-acento);
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 600;
}
/* Mini lista de pedidos */
.contenedor-mini-lista {
  margin-bottom: 1rem;
}
.mini-lista {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  padding: 0.5rem;
}
.item-mini-lista {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.25rem;
  background: var(--color-superficie);
  border-radius: 6px;
  border: 1px solid var(--color-borde);
  opacity: 0;
  animation: fadeInSlide 0.3s ease forwards;
}
.item-mini-lista:last-child {
  margin-bottom: 0;
}
/* Animación de entrada */
@keyframes fadeInSlide {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.numero-pedido {
  font-size: 0.95rem;
  color: var(--color-texto-principal);
  font-weight: 500;
}
.boton-eliminar-item {
  background: transparent;
  border: none;
  color: var(--color-error);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}
.boton-eliminar-item:hover {
  background: rgba(244, 67, 54, 0.1);
  transform: scale(1.1);
}
.boton-eliminar-item:active {
  transform: scale(0.9);
}
/* Scroll personalizado */
.mini-lista::-webkit-scrollbar {
  width: 6px;
}
.mini-lista::-webkit-scrollbar-track {
  background: var(--color-fondo);
  border-radius: 3px;
}
.mini-lista::-webkit-scrollbar-thumb {
  background: var(--color-borde);
  border-radius: 3px;
}
.mini-lista::-webkit-scrollbar-thumb:hover {
  background: var(--color-texto-secundario);
}
</style>
