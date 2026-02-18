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
            <button
              type="button"
              :class="['boton-toggle-teclado', { 'teclado-activo': modoTexto }]"
              @click="toggleTeclado"
              :title="modoTexto ? 'Cambiar a numérico' : 'Cambiar a texto'"
            >
              {{ modoTexto ? '123' : 'ABC' }}
            </button>
            <input
              ref="inputPedidoRef"
              id="numeroPedido"
              v-model="numeroPedido"
              type="text"
              :inputmode="modoTexto ? 'text' : 'numeric'"
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

        <!-- Fila items con botones - y + -->
        <div class="fila-items">
          <label for="cantidadItems">Cantidad de items</label>
          <div class="contenedor-items-botones">
            <button type="button" class="boton-items" @click="decrementarItems">
              <IconMinus :stroke="2" />
            </button>

            <input
              ref="inputItemsRef"
              id="cantidadItems"
              v-model.number="cantidadItems"
              type="number"
              inputmode="numeric"
              min="1"
              @input="validarItems"
            />

            <button type="button" class="boton-items" @click="incrementarItems">
              <IconPlus :stroke="2" />
            </button>
          </div>
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
        @modal-abierto="manejarModalAbierto"
        @modal-cerrado="manejarModalCerrado"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import DosBotones from '../Botones/TresBotones.vue'
import { IconCamera, IconArrowRight, IconX, IconMinus, IconPlus } from '@tabler/icons-vue'
import CamaraPedidos from '../Logica/Pedidos/CamaraPedidos.vue'
import { Keyboard } from '@capacitor/keyboard'
import { Capacitor } from '@capacitor/core'

const emit = defineEmits(['agregar-pedido', 'cerrar', 'modal-abierto', 'modal-cerrado'])

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
const modoTexto = ref(false)

const toggleTeclado = () => {
  modoTexto.value = !modoTexto.value
  nextTick(() => inputPedidoRef.value?.focus())
}
const alturaDesplazamiento = ref(0)
const esMovil = Capacitor.isNativePlatform()

// Computed
const puedeAgregar = computed(() => {
  return numeroPedido.value.trim() !== ''
})

// Funciones para incrementar/decrementar items
const incrementarItems = () => {
  cantidadItems.value = (cantidadItems.value || 0) + 1
}

const decrementarItems = () => {
  if (cantidadItems.value > 1) {
    cantidadItems.value--
  }
}

const validarItems = () => {
  if (!cantidadItems.value || cantidadItems.value < 1) {
    cantidadItems.value = 1
  }
}

// Agregar pedido a la lista temporal
const agregarPedidoALista = () => {
  if (!puedeAgregar.value) return

  const numero = numeroPedido.value.trim()
  const items = cantidadItems.value || 1

  pedidosTemporales.value.push({
    numero: numero,
    items: items,
  })

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

  cantidadItems.value = 1

  nextTick(() => {
    const miniLista = document.querySelector('.mini-lista')
    if (miniLista) {
      miniLista.scrollTop = miniLista.scrollHeight
    }
  })

  restablecerPlaceholder()
}

const eliminarDeLista = (index) => {
  pedidosTemporales.value.splice(index, 1)
}

const confirmarTodosPedidos = () => {
  if (pedidosTemporales.value.length === 0) {
    if (!numeroPedido.value.trim()) {
      mostrarError.value = true
      textoPlaceholder.value = '¡El campo no puede estar vacío!'
      animarError.value = true
      setTimeout(() => (animarError.value = false), 500)
      return
    }
    pedidosTemporales.value.push({
      numero: numeroPedido.value.trim(),
      items: cantidadItems.value || 1,
    })
  }

  emit('agregar-pedido', pedidosTemporales.value)
  limpiarTodo()
  emit('cerrar')
}

const cancelarYCerrar = () => {
  limpiarTodo()
  emit('cerrar')
}

const limpiarTodo = () => {
  numeroPedido.value = ''
  cantidadItems.value = 1
  pedidosTemporales.value = []
  mostrarError.value = false
  modoTexto.value = false
  restablecerPlaceholder()
}

const restablecerPlaceholder = () => {
  mostrarError.value = false
  textoPlaceholder.value = 'Número de pedido'
}

const abrirCamara = () => {
  mostrarCamaraPedidos.value = true
}

const cerrarCamaraYVolver = () => {
  mostrarCamaraPedidos.value = false
}

const onCodigoLeido = (pedidos) => {
  emit('agregar-pedido', pedidos)
  mostrarCamaraPedidos.value = false
  emit('cerrar')
}

// Métodos para manejar eventos de la cámara
const manejarModalAbierto = () => {
  emit('modal-abierto')
}

const manejarModalCerrado = () => {
  emit('modal-cerrado')
}

onMounted(() => {
  nextTick(() => {
    if (inputPedidoRef.value) {
      inputPedidoRef.value.focus()
    }
  })

  // Emitir que el modal está abierto
  emit('modal-abierto')

  if (esMovil) {
    Keyboard.addListener('keyboardWillShow', (info) => {
      const alturaVentana = window.innerHeight
      const alturaTeclado = info.keyboardHeight
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
  // Emitir que el modal está cerrado
  emit('modal-cerrado')
})
</script>

<style scoped>
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
  padding: 1rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease;
}
.modal-titulo {
  margin: 0 0 0.75rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-texto-principal);
}
.contador-pedidos-arriba {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
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
.label-pedido {
  display: block;
  font-size: 0.95rem;
  color: var(--color-texto-secundario);
  margin-bottom: 0.5rem;
}
.fila-input-camara {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.contenedor-input-flecha {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}
.contenedor-input-flecha input {
  width: 100%;
  padding: 0.75rem;
  padding-left: 50px;
  padding-right: 50px;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  font-size: 1rem;
}
.boton-toggle-teclado {
  position: absolute;
  left: 6px;
  z-index: 1;
  background: var(--color-fondo);
  border: 1px solid var(--color-borde);
  border-radius: 6px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--color-texto-secundario);
  transition: all 0.2s ease;
}
.boton-toggle-teclado:hover {
  border-color: var(--color-acento);
  color: var(--color-acento);
}
.teclado-activo {
  background: rgba(3, 169, 244, 0.12);
  border-color: var(--color-acento);
  color: var(--color-acento);
  box-shadow: 0 0 6px rgba(3, 169, 244, 0.3);
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
.fila-items {
  margin-bottom: 0.75rem;
}
.fila-items label {
  display: block;
  font-size: 0.95rem;
  color: var(--color-texto-secundario);
  margin-bottom: 0.5rem;
}
.contenedor-items-botones {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}
.contenedor-items-botones input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  font-size: 1rem;
  text-align: center;
  min-width: 0;
}
.contenedor-items-botones input:focus {
  outline: none;
  border-color: var(--color-acento);
}
.boton-items {
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
.boton-items:hover {
  transform: scale(1.05);
  background: var(--color-fondo);
}
.boton-items:active {
  transform: scale(0.95);
}
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
@media (max-width: 600px) {
  .modal-contenido {
    padding: 0.75rem;
  }
}
</style>
