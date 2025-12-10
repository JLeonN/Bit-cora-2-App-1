<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div
      :class="['modal-contenido']"
      :style="
        esMovil && alturaDesplazamiento > 0
          ? { transform: `translateY(-${alturaDesplazamiento}%)` }
          : {}
      "
    >
      <h2 class="modal-titulo">Nuevo pedido</h2>

      <form @submit.prevent="confirmarTodosPedidos">
        <!-- Contador de pedidos agregados -->
        <div v-if="pedidosTemporales.length > 0" class="contador-pedidos-arriba">
          <span class="badge-contador"
            >{{ pedidosTemporales.length }} pedido{{
              pedidosTemporales.length !== 1 ? 's' : ''
            }}
            agregado{{ pedidosTemporales.length !== 1 ? 's' : '' }}</span
          >
        </div>

        <!-- Label -->
        <label for="numeroPedido" class="label-pedido">Número de pedido</label>

        <!-- Fila: Input con flecha integrada y botón cámara -->
        <div class="fila-input-camara">
          <div class="contenedor-input-flecha">
            <input
              ref="inputPedidoRef"
              id="numeroPedido"
              v-model="numeroPedido"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              :placeholder="textoPlaceholder"
              @input="restablecerPlaceholder"
              @keyup.enter="agregarPedidoALista"
              :class="{ 'input-error': mostrarError, 'animar-error': animarError }"
            />

            <button
              type="button"
              class="boton-flecha-integrado"
              :class="{ 'boton-inactivo': !puedeAgregar }"
              :disabled="!puedeAgregar"
              @click="agregarPedidoALista"
            >
              <IconArrowRight :stroke="2" />
            </button>
          </div>

          <button type="button" class="boton-camara" @click="abrirCamara">
            <IconCamera :stroke="2" />
          </button>
        </div>

        <!-- Input items -->
        <div class="fila-items">
          <label for="cantidadItems">Cantidad de items</label>
          <input
            ref="inputItemsRef"
            id="cantidadItems"
            v-model.number="cantidadItems"
            type="number"
            inputmode="numeric"
            min="1"
          />
        </div>

        <!-- Mini lista de pedidos temporales -->
        <div v-if="pedidosTemporales.length > 0" class="contenedor-mini-lista">
          <div class="mini-lista">
            <div v-for="(pedido, index) in pedidosTemporales" :key="index" class="item-mini-lista">
              <span class="numero-pedido">{{ pedido.numero }}</span>
              <span class="badge-items">{{ pedido.items }} items</span>
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
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import DosBotones from '../Botones/TresBotones.vue'
import { IconCamera, IconArrowRight, IconX } from '@tabler/icons-vue'
import CamaraPedidos from '../Logica/Pedidos/CamaraPedidos.vue'
import { Keyboard } from '@capacitor/keyboard'
import { Capacitor } from '@capacitor/core'

const emit = defineEmits(['agregar-pedido', 'cerrar'])

// Referencias
const inputPedidoRef = ref(null)
const inputItemsRef = ref(null)

// Estado
const numeroPedido = ref('')
const cantidadItems = ref(1)
const pedidosTemporales = ref([])
const mostrarError = ref(false)
const animarError = ref(false)
const textoPlaceholder = ref('Número de pedido')
const mostrarCamaraPedidos = ref(false)
const alturaDesplazamiento = ref(0)
const esMovil = Capacitor.isNativePlatform()

// Computed
const puedeAgregar = computed(() => {
  return numeroPedido.value.trim() !== ''
})

// Agregar pedido a la lista temporal
const agregarPedidoALista = () => {
  if (!puedeAgregar.value) return

  const numero = numeroPedido.value.trim()
  const items = cantidadItems.value || 1

  pedidosTemporales.value.push({
    numero: numero,
    items: items,
  })

  // Auto-incremento inteligente del número de pedido
  const ultimoNumero = parseInt(numero)
  if (!isNaN(ultimoNumero)) {
    numeroPedido.value = String(ultimoNumero + 1)
    nextTick(() => {
      if (inputPedidoRef.value) {
        inputPedidoRef.value.select()
        inputPedidoRef.value.focus()
      }
    })
  } else {
    numeroPedido.value = ''
  }

  // Resetear items a 1
  cantidadItems.value = 1

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
    pedidosTemporales.value.push({
      numero: numeroPedido.value.trim(),
      items: cantidadItems.value || 1,
    })
  }

  // Emitir todos los pedidos al padre
  emit('agregar-pedido', pedidosTemporales.value)

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
  cantidadItems.value = 1
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
const onCodigoLeido = (pedidos) => {
  // La cámara ya emite objetos { numero, items }
  emit('agregar-pedido', pedidos)
  mostrarCamaraPedidos.value = false
  emit('cerrar')
}

// Focus automático al montar
onMounted(() => {
  nextTick(() => {
    if (inputPedidoRef.value) {
      inputPedidoRef.value.focus()
    }
  })

  // Listener del teclado (solo en móviles)
  if (esMovil) {
    Keyboard.addListener('keyboardWillShow', (info) => {
      const alturaVentana = window.innerHeight
      const alturaTeclado = info.keyboardHeight
      // Calcular el porcentaje de desplazamiento
      alturaDesplazamiento.value = (alturaTeclado / alturaVentana) * 50
    })

    Keyboard.addListener('keyboardWillHide', () => {
      alturaDesplazamiento.value = 0
    })
  }
})

onUnmounted(() => {
  if (esMovil) {
    Keyboard.removeAllListeners()
  }
})
</script>

<style scoped>
/* Modal fondo */
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
/* Modal contenido - padding reducido */
.modal-contenido {
  background: var(--color-superficie);
  border-radius: 16px;
  padding: 1rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease;
}
/* Título del modal - margin reducido */
.modal-titulo {
  margin: 0 0 0.75rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-texto-principal);
}
/* Contador arriba a la derecha */
.contador-pedidos-arriba {
  display: flex;
  justify-content: flex-end;
  margin-bottom: -25px;
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
/* Label */
.label-pedido {
  display: block;
  font-size: 0.95rem;
  color: var(--color-texto-secundario);
  margin-bottom: 0.5rem;
}
/* Fila: Input con flecha integrada + botón cámara */
.fila-input-camara {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
/* Contenedor del input con flecha integrada */
.contenedor-input-flecha {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}
.contenedor-input-flecha input {
  width: 100%;
  padding: 0.75rem;
  padding-right: 50px; /* Espacio para el botón */
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  font-size: 1rem;
}
.contenedor-input-flecha input:focus {
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
/* Botón flecha integrado dentro del input */
.boton-flecha-integrado {
  position: absolute;
  right: 4px;
  background: var(--color-acento);
  border: none;
  border-radius: 6px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
}
.boton-flecha-integrado:hover:not(.boton-inactivo) {
  background: var(--color-primario);
  transform: scale(1.05);
}
.boton-flecha-integrado:active:not(.boton-inactivo) {
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
  flex-shrink: 0;
}
.boton-camara:hover {
  transform: scale(1.05);
  background: var(--color-fondo);
}
.boton-camara:active {
  transform: scale(0.95);
}
/* Input items */
.fila-items {
  margin-bottom: 0.75rem;
}
.fila-items label {
  display: block;
  font-size: 0.95rem;
  color: var(--color-texto-secundario);
  margin-bottom: 0.5rem;
}
.fila-items input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  font-size: 1rem;
}
.fila-items input:focus {
  outline: none;
  border-color: var(--color-acento);
}
/* Mini lista de pedidos */
.contenedor-mini-lista {
  margin-bottom: 0.75rem;
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
  gap: 0.5rem;
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
  flex: 1;
}
.badge-items {
  font-size: 0.8rem;
  color: var(--color-acento);
  background: rgba(3, 169, 244, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
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
  flex-shrink: 0;
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
/* Responsive */
@media (max-width: 600px) {
  .modal-contenido {
    padding: 0.75rem;
  }
}
</style>
