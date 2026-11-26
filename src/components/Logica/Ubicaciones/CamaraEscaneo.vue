<template>
  <div class="modal-fondo fondo-camara-pedidos" @click.self="emit('cancelar')">
    <div class="modal-camara">
      <div class="caja-camara">
        <video ref="videoCamara" autoplay playsinline></video>
        <div class="guia-lectura-pedidos" aria-hidden="true">
          <div class="guia-lectura-pedidos-etiqueta">Zona de lectura</div>
          <div class="guia-lectura-pedidos-linea"></div>
        </div>
      </div>
      <div v-if="mensaje" class="mensaje-temporal mensaje-camara-pedidos" role="status">{{ mensaje }}</div>
      <div v-if="modoUbicaciones" class="campo-ubicacion-escaneo">
        <input v-model="ubicacion" type="text" placeholder="Ubicación para los próximos artículos" aria-label="Ubicación para los próximos artículos" />
        <button v-if="ubicacion" type="button" class="boton-eliminar-escaneado" aria-label="Limpiar ubicación" @click="limpiarUbicacion"><IconTrash :size="18" /></button>
      </div>
      <div v-if="!escaneoUnico && articulos.length" class="lista-articulos-escaneados">
        <div v-for="articulo in articulos" :key="articulo.codigo" class="tarjeta-articulo-escaneado">
          <button type="button" class="boton-eliminar-escaneado" :aria-label="`Eliminar ${articulo.codigo}`" @click="eliminarArticulo(articulo.codigo)"><IconX :size="18" :stroke="2" /></button>
          <div class="nombre-articulo-escaneado">{{ articulo.nombre }}</div>
          <div class="datos-articulo-escaneado"><span class="codigo-articulo-escaneado">{{ articulo.codigo }}</span><span v-if="modoUbicaciones">{{ articulo.ubicacion }}</span></div>
        </div>
      </div>
      <div class="caja-inferior">
        <button v-if="!escaneoUnico" type="button" class="boton-finalizar" :disabled="!articulos.length" @click="finalizar">Finalizar ({{ articulos.length }})</button>
        <button type="button" class="boton-cancelar" @click="emit('cancelar')">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType, NotFoundException } from '@zxing/library'
import { IconTrash, IconX } from '@tabler/icons-vue'
import { obtenerArticulosCargados } from '../../BaseDeDatos/LectorExcel.js'
import { obtenerArticuloExacto } from '../Compartidos/ServicioBusquedaArticulos.js'
import { guardarUltimaUbicacion, obtenerUltimaUbicacion, limpiarUltimaUbicacion } from './recordarUltimaTipografia.js'

const props = defineProps({
  escaneoUnico: { type: Boolean, default: false },
  modoUbicaciones: { type: Boolean, default: false },
})
const emit = defineEmits(['cancelar', 'finalizar', 'modal-abierto', 'modal-cerrado'])
const videoCamara = ref(null)
const articulos = ref([])
const ubicacion = ref('')
const mensaje = ref('')
let lector = null
let desmontado = false
let emitido = false
let temporizadorMensaje = null
let ultimoCodigo = ''
let ultimoInstante = 0
function mostrarMensaje(texto) {
  mensaje.value = texto
  clearTimeout(temporizadorMensaje)
  temporizadorMensaje = setTimeout(() => { mensaje.value = '' }, 2500)
}
function eliminarArticulo(codigo) {
  articulos.value = articulos.value.filter((articulo) => articulo.codigo !== codigo)
  ultimoCodigo = ''
}
async function limpiarUbicacion() {
  ubicacion.value = ''
  await limpiarUltimaUbicacion()
}
function procesarCodigo(valor) {
  const codigo = valor.trim().toUpperCase()
  if (!codigo || emitido) return
  if (props.escaneoUnico) {
    emitido = true
    emit('finalizar', [codigo])
    return
  }
  const instante = Date.now()
  if (codigo === ultimoCodigo && instante - ultimoInstante < 2000) return
  ultimoCodigo = codigo
  ultimoInstante = instante
  const ubicacionActual = ubicacion.value.trim().replace(/\s+/g, '-').toUpperCase()
  if (props.modoUbicaciones && !ubicacionActual) {
    mostrarMensaje('Ingresá una ubicación antes de escanear')
    return
  }
  const encontrado = obtenerArticuloExacto({ articulos: obtenerArticulosCargados(), busqueda: codigo })
  const codigoArticulo = String(encontrado?.codigo || codigo).trim().toUpperCase()
  if (articulos.value.some((articulo) => articulo.codigo === codigoArticulo)) {
    mostrarMensaje(`El código ${codigoArticulo} ya está en la lista`)
    return
  }
  const nombre = encontrado?.nombre || (props.modoUbicaciones ? 'Artículo sin descripción' : 'Artículo inexistente')
  articulos.value.unshift({ codigo: codigoArticulo, nombre, ubicacion: ubicacionActual })
  if (props.modoUbicaciones) {
    ubicacion.value = ubicacionActual
    void guardarUltimaUbicacion(ubicacionActual)
  }
  mostrarMensaje(`Agregado: ${codigo}`)
}
async function iniciarCamara() {
  try {
    const sugerencias = new Map()
    sugerencias.set(DecodeHintType.POSSIBLE_FORMATS, Object.values(BarcodeFormat))
    lector = new BrowserMultiFormatReader(sugerencias)
    const dispositivos = await lector.listVideoInputDevices()
    if (desmontado) return
    const trasera = dispositivos.find((dispositivo) => /back|rear/i.test(dispositivo.label))
    const id = trasera?.deviceId || dispositivos[0]?.deviceId || null
    await lector.decodeFromVideoDevice(id, videoCamara.value, (resultado, error) => {
      if (desmontado) return
      if (resultado?.text) procesarCodigo(resultado.text)
      if (error && !(error instanceof NotFoundException)) console.warn('Error de escaneo:', error)
    })
    if (desmontado) lector.reset()
  } catch (error) {
    if (!desmontado) mostrarMensaje('No se pudo acceder a la cámara. Revisá los permisos.')
    console.error('Error al iniciar la cámara:', error)
  }
}
function finalizar() {
  if (articulos.value.length) emit('finalizar', articulos.value.map((articulo) => props.modoUbicaciones ? { codigo: articulo.codigo, ubicacion: articulo.ubicacion } : articulo.codigo))
}
onMounted(async () => {
  emit('modal-abierto')
  if (props.modoUbicaciones) ubicacion.value = (await obtenerUltimaUbicacion()) || ''
  if (!desmontado) iniciarCamara()
})
onBeforeUnmount(() => {
  desmontado = true
  clearTimeout(temporizadorMensaje)
  lector?.reset()
  emit('modal-cerrado')
})
</script>

<style scoped>
.caja-camara video { width: 100%; height: 100%; object-fit: cover; }
.campo-ubicacion-escaneo { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
.campo-ubicacion-escaneo input { flex: 1; min-width: 0; padding: 0.65rem; border: 1px solid var(--color-borde); border-radius: 8px; background: var(--color-fondo); color: var(--color-texto-principal); }
.campo-ubicacion-escaneo button { width: 42px; height: auto; }
.lista-articulos-escaneados { flex-shrink: 0; max-height: 205px; overflow-y: auto; scrollbar-width: none; margin-bottom: 1rem; }
.lista-articulos-escaneados::-webkit-scrollbar { display: none; }
.tarjeta-articulo-escaneado { position: relative; box-sizing: border-box; min-height: 78px; margin-bottom: 8px; padding: 0.5rem 3rem 0.5rem 0.75rem; border: 1px solid var(--color-borde); border-radius: 8px; background: var(--color-fondo); }
.tarjeta-articulo-escaneado .boton-eliminar-escaneado { position: absolute; top: 0.5rem; right: 0.5rem; }
.nombre-articulo-escaneado { color: var(--color-texto-principal); font-size: 0.95rem; line-height: 1.2; min-height: 2.4em; overflow-wrap: anywhere; }
.datos-articulo-escaneado { display: flex; justify-content: space-between; gap: 0.5rem; color: var(--color-texto-secundario); font-size: 0.8rem; }
.codigo-articulo-escaneado { color: var(--color-primario-claro); overflow-wrap: anywhere; }
</style>
