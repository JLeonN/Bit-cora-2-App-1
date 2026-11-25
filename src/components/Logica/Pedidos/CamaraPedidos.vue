<template>
  <!-- Modal de la cámara -->
  <div class="modal-fondo fondo-camara-pedidos" @click.self="$emit('cancelar')">
    <div class="modal-camara">
      <!-- Caja de la cámara -->
      <div id="vista-camara" class="caja-camara">
        <!-- Video embebido -->
        <video id="video-camara" autoplay playsinline></video>
        <!-- Miniatura como overlay -->
        <div v-if="ultimaCaptura" class="overlay-miniatura">
          <img :src="ultimaCaptura" alt="Última captura" class="mini-captura" />
        </div>
        <div class="guia-lectura-pedidos" aria-hidden="true">
          <div class="guia-lectura-pedidos-etiqueta">Zona de lectura</div>
          <div class="guia-lectura-pedidos-linea"></div>
        </div>
      </div>

      <!-- Mensaje temporal -->
      <div v-if="mensajeTemporal" class="mensaje-temporal mensaje-camara-pedidos">
        {{ mensajeTemporal }}
      </div>

      <!-- Lista de pedidos escaneados -->
      <div
        class="contenedor-lista-pedidos"
        :class="{ 'lista-pedidos-vacia': pedidosEscaneados.length === 0 }"
        :style="{ height: `${alturaLista}px` }"
      >
        <div ref="contenedorPedidos">
          <TransitionGroup name="movimiento-pedido" tag="div" class="lista-pedidos-escaneados">
          <div
            v-for="pedido in pedidosEscaneados"
            :key="pedido.codigo"
            class="item-pedido-escaneado"
            :class="{ 'pedido-eliminandose': pedidosEliminandose.has(pedido.codigo) }"
          >
            <div class="encabezado-pedido-escaneado">
              <span class="numero-pedido-escaneado">{{ pedido.codigo }}</span>
              <button type="button" class="boton-eliminar-escaneado" :disabled="pedidosEliminandose.has(pedido.codigo)" @click="eliminarPedidoEscaneado(pedido.codigo)" :aria-label="`Eliminar pedido ${pedido.codigo}`">
                <IconX :size="18" :stroke="2" />
              </button>
            </div>
            <div class="acciones-pedido-escaneado">
              <div class="control-cantidad-escaneada">
                <button
                  type="button"
                  class="boton-cantidad-escaneada"
                  :disabled="pedido.items <= 1"
                  @click="decrementarItemsPedido(pedido.codigo)"
                >
                  <IconMinus :size="16" :stroke="2" />
                </button>
                <span class="cantidad-pedido-escaneado">{{ pedido.items }}</span>
                <button
                  type="button"
                  class="boton-cantidad-escaneada"
                  @click="incrementarItemsPedido(pedido.codigo)"
                >
                  <IconPlus :size="16" :stroke="2" />
                </button>
              </div>
            </div>
          </div>
          </TransitionGroup>
        </div>
      </div>

      <!-- Parte inferior -->
      <div class="caja-inferior">
        <!-- Botón finalizar -->
        <button
          class="boton-finalizar"
          :disabled="pedidosEscaneados.length === 0"
          @click="emitirFinalizar"
        >
          {{ `Finalizar (${pedidosEscaneados.length})` }}
        </button>

        <!-- Botón cancelar -->
        <button class="boton-cancelar" @click="$emit('cancelar')">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import {
  BarcodeFormat,
  BrowserMultiFormatReader,
  DecodeHintType,
  NotFoundException,
} from '@zxing/library'
import { IconMinus, IconPlus, IconX } from '@tabler/icons-vue'

const emit = defineEmits(['cancelar', 'codigo-detectado', 'modal-abierto', 'modal-cerrado'])

const codigoDetectado = ref('')
const ultimaCaptura = ref(null)
// Datos temporales para revisar el diseño en la versión web de desarrollo.
const pedidosEscaneados = ref(
  import.meta.env.DEV && !Capacitor.isNativePlatform()
    ? Array.from({ length: 6 }, (_, indice) => ({
        codigo: `PEDIDO-${String(indice + 1).padStart(6, '0')}`,
        items: indice + 1,
        esDePrueba: true,
      }))
    : [],
)
const mensajeTemporal = ref('')
const contenedorPedidos = ref(null)
const alturaLista = ref(0)
const pedidosEliminandose = ref(new Set())

let lector = null
let observadorLista = null
const temporizadoresEliminacion = new Set()

const actualizarAlturaLista = () => {
  const lista = contenedorPedidos.value?.firstElementChild
  if (!lista || pedidosEscaneados.value.length === 0) {
    alturaLista.value = 0
    return
  }
  const tercerPedido = lista.children[2]
  const tercerEncabezado = tercerPedido?.querySelector('.encabezado-pedido-escaneado')
  const alturaContenido = tercerEncabezado
    ? tercerPedido.offsetTop + tercerPedido.clientTop + parseFloat(window.getComputedStyle(tercerPedido).paddingTop) + tercerEncabezado.offsetHeight
    : lista.scrollHeight
  const tamanioRem = parseFloat(window.getComputedStyle(document.documentElement).fontSize)
  const espacioInterior = window.matchMedia('(max-width: 600px)').matches ? 1 : 1.5
  alturaLista.value = Math.ceil(alturaContenido + tamanioRem * espacioInterior)
}

watch(() => pedidosEscaneados.value.length, async () => {
  await nextTick()
  actualizarAlturaLista()
})

// Función para mostrar mensaje temporal
const mostrarMensaje = (texto) => {
  mensajeTemporal.value = texto
  setTimeout(() => {
    mensajeTemporal.value = ''
  }, 5000)
}

// Agrega automáticamente el código detectado con items default en 1
const procesarCodigoDetectado = (codigo) => {
  if (!codigo) return
  if (pedidosEscaneados.value.some((p) => p.codigo === codigo)) {
    mostrarMensaje(`El pedido ${codigo} ya está en la lista`)
  } else {
    pedidosEscaneados.value.unshift({
      codigo: codigo,
      items: 1,
    })
    mostrarMensaje(`Agregado: ${codigo}`)
  }
  codigoDetectado.value = ''
  ultimaCaptura.value = null
}

// Eliminar pedido escaneado de la lista
const eliminarPedidoEscaneado = (codigo) => {
  if (pedidosEliminandose.value.has(codigo)) return
  pedidosEliminandose.value.add(codigo)
  mostrarMensaje(`Eliminado: ${codigo}`)
  const temporizador = setTimeout(() => {
    pedidosEscaneados.value = pedidosEscaneados.value.filter((pedido) => pedido.codigo !== codigo)
    pedidosEliminandose.value.delete(codigo)
    temporizadoresEliminacion.delete(temporizador)
  }, 300)
  temporizadoresEliminacion.add(temporizador)
}

const normalizarItems = (items) => {
  const cantidad = Number(items)
  return Number.isFinite(cantidad) && cantidad > 1 ? Math.floor(cantidad) : 1
}

const incrementarItemsPedido = (codigo) => {
  const pedido = pedidosEscaneados.value.find((pedidoEscaneado) => pedidoEscaneado.codigo === codigo)
  if (!pedido) return
  pedido.items = normalizarItems(pedido.items) + 1
}

const decrementarItemsPedido = (codigo) => {
  const pedido = pedidosEscaneados.value.find((pedidoEscaneado) => pedidoEscaneado.codigo === codigo)
  if (!pedido) return
  const cantidadActual = normalizarItems(pedido.items)
  if (cantidadActual <= 1) return
  pedido.items = cantidadActual - 1
}

// Iniciar cámara + escaneo
const iniciarCamara = async () => {
  try {
    const sugerencias = new Map()
    sugerencias.set(DecodeHintType.POSSIBLE_FORMATS, Object.values(BarcodeFormat))
    lector = new BrowserMultiFormatReader(sugerencias)

    const dispositivos = await lector.listVideoInputDevices()
    let idDispositivo = null
    if (dispositivos.length > 0) {
      // Prioriza la cámara trasera en móviles
      const camaraTrasera = dispositivos.find((d) => /back|rear/i.test(d.label))
      idDispositivo = camaraTrasera ? camaraTrasera.deviceId : dispositivos[0].deviceId
    }

    const elementoVideo = document.getElementById('video-camara')

    lector.decodeFromVideoDevice(idDispositivo, elementoVideo, (resultado, error) => {
      if (resultado && resultado.text) {
        codigoDetectado.value = resultado.text
        procesarCodigoDetectado(codigoDetectado.value)

        // Miniatura para feedback visual
        try {
          const canvas = document.createElement('canvas')
          canvas.width = elementoVideo.videoWidth
          canvas.height = elementoVideo.videoHeight
          const ctx = canvas.getContext('2d')
          ctx.drawImage(elementoVideo, 0, 0, canvas.width, canvas.height)
          ultimaCaptura.value = canvas.toDataURL('image/jpeg')
        } catch (e) {
          console.warn('Error al crear la miniatura:', e)
        }
      }

      if (error && !(error instanceof NotFoundException)) {
        console.warn('Error durante el escaneo:', error)
      }
    })
  } catch (error) {
    console.error('Error al iniciar la cámara:', error)
  }
}

// Emitir lista completa al finalizar (solo los códigos con sus items)
const emitirFinalizar = () => {
  const pedidosReales = pedidosEscaneados.value.filter(
    (pedido) => !pedido.esDePrueba && !pedidosEliminandose.value.has(pedido.codigo),
  )
  if (pedidosReales.length > 0) {
    // Emitir array de objetos con { codigo, items }
    emit(
      'codigo-detectado',
      pedidosReales.map((p) => ({
        numero: p.codigo,
        items: normalizarItems(p.items),
      })),
    )
  } else {
    emit('cancelar')
  }
}

onMounted(() => {
  observadorLista = new ResizeObserver(actualizarAlturaLista)
  observadorLista.observe(contenedorPedidos.value.firstElementChild)
  actualizarAlturaLista()
  iniciarCamara()
  emit('modal-abierto')
})

onBeforeUnmount(() => {
  observadorLista?.disconnect()
  temporizadoresEliminacion.forEach((temporizador) => clearTimeout(temporizador))
  if (lector) {
    lector.reset()
  }
  emit('modal-cerrado')
})
</script>
