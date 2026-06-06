<template>
  <div class="contenedor-consulta">
    <h2 class="titulo-consulta">Consulta de ubicación</h2>

    <SelectorExcel
      v-if="!baseDatosCargada"
      @base-datos-cargada="manejarBaseCargada"
      @error-carga="manejarErrorCarga"
    />

    <div class="bloque-buscador" :class="{ 'bloque-buscador-con-resultado': articuloConsultado }">
      <div class="campo-buscador">
        <input
          ref="inputBusquedaRef"
          v-model="busquedaArticulo"
          type="text"
          placeholder="Código o nombre del artículo"
          class="input-buscador"
          @focus="manejarEnfoqueBusqueda"
          @blur="manejarDesenfoqueBusqueda"
          @keydown="manejarDobleEspacio"
          @input="manejarInputBusqueda"
          @keyup.enter="buscarArticuloExacto"
        />
        <button
          v-if="busquedaArticulo"
          type="button"
          class="boton-copiar-busqueda"
          title="Copiar texto"
          @click="copiarBusquedaActual"
        >
          <IconCopy :size="16" />
        </button>

        <CodigoMasNombre
          v-if="mostrarBuscador && busquedaArticulo.length >= 3"
          :busqueda="busquedaArticulo"
          @articulo-seleccionado="seleccionarArticulo"
          @estado-busqueda="manejarEstadoBuscador"
        />
      </div>

      <button type="button" class="boton-camara" @click="abrirCamara">
        <IconCamera :stroke="2" />
      </button>
    </div>

    <transition name="mostrar-resultado">
      <div v-if="articuloConsultado" class="resultado-consulta">
        <div class="tarjeta-resultado" :class="{ 'tarjeta-sl-neon': esUbicacionOriginalSL }">
          <p class="etiqueta-resultado">Historial de ubicaciones</p>
          <div class="lista-historial-ubicaciones">
            <p
              v-for="(ubicacion, indice) in historialVisual"
              :key="`historial-${indice}`"
              class="valor-ubicacion"
              :class="{ 'texto-sl-neon': ubicacion === 'SL' && esUbicacionOriginalSL }"
            >
              {{ ubicacion }}
            </p>
          </div>
          <p class="ubicacion-original">
            Original Excel:
            <strong :class="{ 'texto-sl-neon': esUbicacionOriginalSL }">{{
              articuloConsultado.ubicacionAntigua || 'SIN UBICACIÓN'
            }}</strong>
          </p>
          <p class="valor-nombre">{{ articuloConsultado.nombre }}</p>
          <p class="valor-codigo">{{ articuloConsultado.codigo }}</p>
        </div>

        <button type="button" class="boton-actualizar-ubicacion" @click="alternarEditorUbicacion">
          {{ mostrarEditorUbicacion ? 'Cancelar actualización' : 'Actualizar ubicación' }}
        </button>

        <transition name="mostrar-editor">
          <form
            v-if="mostrarEditorUbicacion"
            class="editor-ubicacion"
            @submit.prevent="guardarNuevaUbicacion"
          >
            <div class="campo-editor">
              <input
                ref="inputNuevaUbicacionRef"
                v-model="nuevaUbicacion"
                type="text"
                placeholder="Nueva ubicación"
                class="input-ubicacion"
                @blur="formatearNuevaUbicacion"
              />
              <button
                v-if="nuevaUbicacion"
                type="button"
                class="boton-limpiar-ubicacion"
                title="Limpiar ubicación"
                @click="nuevaUbicacion = ''"
              >
                <IconTrash :size="16" />
              </button>
            </div>
            <button type="submit" class="boton-guardar-ubicacion">Guardar ubicación</button>
          </form>
        </transition>
      </div>
    </transition>

    <CamaraEscaneo
      v-if="mostrarCamara"
      :escaneo-unico="true"
      @cancelar="cerrarCamara"
      @finalizar="procesarCodigosEscaneados"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Notify } from 'quasar'
import { IconCamera, IconTrash, IconCopy } from '@tabler/icons-vue'
import SelectorExcel from '../components/Logica/Ubicaciones/SelectorExcel.vue'
import CodigoMasNombre from '../components/Logica/Ubicaciones/CodigoMasNombre.vue'
import CamaraEscaneo from '../components/Logica/Ubicaciones/CamaraEscaneo.vue'
import {
  obtenerArticulosCargados,
  obtenerEstadoCarga,
  obtenerHistorialUbicaciones,
} from '../components/BaseDeDatos/LectorExcel.js'
import { registrarUbicacionArticulo } from '../components/Logica/Ubicaciones/ServicioRegistroUbicacion.js'

const emit = defineEmits(['configurar-barra'])

const busquedaArticulo = ref('')
const articuloConsultado = ref(null)
const mostrarBuscador = ref(false)
const inputEnfocado = ref(false)
const mostrarCamara = ref(false)
const mostrarEditorUbicacion = ref(false)
const nuevaUbicacion = ref('')
const modalActivo = ref(false)
const baseDatosCargada = ref(false)
const inputBusquedaRef = ref(null)
const inputNuevaUbicacionRef = ref(null)
const ultimoEspacioTiempo = ref(0)
const seleccionRecienteDesdeBuscador = ref(false)
const textoCopiadoBusqueda = ref('')

let intervaloBaseDatos = null

const historialVisual = computed(() => {
  if (!articuloConsultado.value?.codigo) return []
  const historial = Array.isArray(articuloConsultado.value.historialUbicaciones)
    ? [...articuloConsultado.value.historialUbicaciones]
    : []
  if (historial.length === 0) {
    return [articuloConsultado.value.ubicacionAntigua || 'SIN UBICACIÓN']
  }
  return [...historial].reverse()
})

const esUbicacionOriginalSL = computed(
  () => (articuloConsultado.value?.ubicacionAntigua || '').trim().toUpperCase() === 'SL',
)

const configuracionBarra = computed(() => ({
  mostrarAgregar: false,
  mostrarEnviar: false,
  puedeEnviar: false,
  botonesPersonalizados: [],
  modalActivo: modalActivo.value,
}))

const metodosParaBarra = {
  onAgregar: () => {},
  onEnviar: () => {},
  onAccionPersonalizada: () => {},
  onAtrasNativo: () => cerrarPasoAtrasNativo(),
}

const actualizarConfiguracionBarra = () => {
  emit('configurar-barra', configuracionBarra.value, metodosParaBarra)
}

const actualizarEstadoBaseDatos = () => {
  const estado = obtenerEstadoCarga()
  baseDatosCargada.value = estado.cargado
}

const normalizarTextoBusqueda = (valor) => {
  if (!valor) return ''
  let texto = valor.toUpperCase()
  texto = texto.replace(/[^A-Z0-9\u00D1 -]/g, '-')
  texto = texto.replace(/-+/g, '-')
  texto = texto.replace(/\s+/g, ' ')
  return texto
}

const formatearNuevaUbicacion = () => {
  if (!nuevaUbicacion.value) return
  let texto = nuevaUbicacion.value.trim().toUpperCase()
  texto = texto.replace(/\s+/g, '-')
  nuevaUbicacion.value = texto
}

const manejarDobleEspacio = (evento) => {
  if (evento.key !== ' ') return
  const tiempoActual = Date.now()
  const diferencia = tiempoActual - ultimoEspacioTiempo.value
  if (diferencia < 300 && diferencia > 0) {
    evento.preventDefault()
    const posicion = evento.target.selectionStart
    const textoActual = busquedaArticulo.value
    const textoAntes = textoActual.substring(0, posicion - 1)
    const textoDespues = textoActual.substring(posicion)
    busquedaArticulo.value = textoAntes + '-' + textoDespues
    nextTick(() => {
      if (inputBusquedaRef.value) {
        inputBusquedaRef.value.setSelectionRange(posicion, posicion)
      }
    })
    ultimoEspacioTiempo.value = 0
  } else {
    ultimoEspacioTiempo.value = tiempoActual
  }
}

const manejarInputBusqueda = (evento) => {
  seleccionRecienteDesdeBuscador.value = false
  const valorOriginal = evento.target.value
  const valorNormalizado = normalizarTextoBusqueda(valorOriginal)
  if (valorOriginal !== valorNormalizado) {
    busquedaArticulo.value = valorNormalizado
    nextTick(() => {
      if (inputBusquedaRef.value) {
        inputBusquedaRef.value.setSelectionRange(valorNormalizado.length, valorNormalizado.length)
      }
    })
  }
  mostrarBuscador.value =
    inputEnfocado.value && busquedaArticulo.value.length >= 3 && baseDatosCargada.value
}

const manejarEnfoqueBusqueda = () => {
  inputEnfocado.value = true
  if (seleccionRecienteDesdeBuscador.value) {
    inputBusquedaRef.value?.select()
    seleccionRecienteDesdeBuscador.value = false
  }
  mostrarBuscador.value = busquedaArticulo.value.length >= 3 && baseDatosCargada.value
}

const manejarDesenfoqueBusqueda = () => {
  inputEnfocado.value = false
  setTimeout(() => {
    if (!inputEnfocado.value) {
      mostrarBuscador.value = false
    }
  }, 200)
}

const buscarEnBase = (textoBusqueda) => {
  const termino = textoBusqueda.trim().toUpperCase()
  if (!termino) return null
  const articulos = obtenerArticulosCargados()
  if (!Array.isArray(articulos) || articulos.length === 0) return null
  const porCodigo = articulos.find((articulo) => articulo.codigo === termino)
  if (porCodigo) return porCodigo
  return articulos.find((articulo) => articulo.nombre === termino) || null
}

const buscarArticuloExacto = () => {
  if (!baseDatosCargada.value) {
    Notify.create({
      type: 'warning',
      message: 'Primero carga el archivo Excel para consultar ubicaciones',
      position: 'top',
      timeout: 2500,
    })
    return
  }

  const articulo = buscarEnBase(busquedaArticulo.value)
  if (!articulo) {
    Notify.create({
      type: 'warning',
      message: 'Artículo inexistente en la base cargada',
      position: 'top',
      timeout: 2200,
    })
    return
  }

  const historial = obtenerHistorialUbicaciones(articulo.codigo)
  articuloConsultado.value = { ...articulo, historialUbicaciones: historial }
  mostrarEditorUbicacion.value = false
  nuevaUbicacion.value = ''
}

const copiarBusquedaActual = async () => {
  const texto = String(busquedaArticulo.value || '')
  if (!texto) return
  textoCopiadoBusqueda.value = texto
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto)
    }
  } catch (error) {
    console.warn('[ConsultaDeUbicacion] No se pudo copiar al portapapeles:', error)
  }
}

const seleccionarArticulo = (articulo, opciones = {}) => {
  const { esAutoseleccionEscaner = false } = opciones
  const historial = obtenerHistorialUbicaciones(articulo.codigo)
  busquedaArticulo.value = articulo.codigo
  seleccionRecienteDesdeBuscador.value = true
  articuloConsultado.value = { ...articulo, historialUbicaciones: historial }
  mostrarBuscador.value = esAutoseleccionEscaner
  inputEnfocado.value = esAutoseleccionEscaner
  mostrarEditorUbicacion.value = false
  nuevaUbicacion.value = ''
}

const manejarEstadoBuscador = (estado) => {
  if (
    !estado?.baseDatosCargada ||
    !estado?.busquedaValida ||
    estado.tipoCoincidenciaUnica !== 'codigo-escaneado' ||
    !estado.articuloUnico
  ) {
    return
  }
  if (articuloConsultado.value?.codigo === estado.articuloUnico.codigo) return
  seleccionarArticulo(estado.articuloUnico, { esAutoseleccionEscaner: true })
}

const abrirCamara = () => {
  if (!baseDatosCargada.value) {
    Notify.create({
      type: 'warning',
      message: 'Carga el Excel antes de escanear artículos',
      position: 'top',
      timeout: 2200,
    })
    return
  }
  mostrarCamara.value = true
}

const cerrarCamara = () => {
  mostrarCamara.value = false
}

const procesarCodigosEscaneados = (codigos) => {
  cerrarCamara()
  if (!Array.isArray(codigos) || codigos.length === 0) return

  const codigoPrincipal = codigos[0]
  busquedaArticulo.value = codigoPrincipal
  seleccionRecienteDesdeBuscador.value = false
  const articulo = buscarEnBase(codigoPrincipal)
  if (!articulo) {
    Notify.create({
      type: 'warning',
      message: `El código ${codigoPrincipal} no existe en la base cargada`,
      position: 'top',
      timeout: 2200,
    })
    return
  }

  const historial = obtenerHistorialUbicaciones(articulo.codigo)
  articuloConsultado.value = { ...articulo, historialUbicaciones: historial }
  mostrarEditorUbicacion.value = false
  nuevaUbicacion.value = ''
}

const alternarEditorUbicacion = async () => {
  mostrarEditorUbicacion.value = !mostrarEditorUbicacion.value
  if (mostrarEditorUbicacion.value) {
    nuevaUbicacion.value = ''
    await nextTick()
    inputNuevaUbicacionRef.value?.focus()
  }
}

const guardarNuevaUbicacion = async () => {
  if (!articuloConsultado.value?.codigo) return
  formatearNuevaUbicacion()
  if (!nuevaUbicacion.value) {
    Notify.create({
      type: 'warning',
      message: 'Ingresa una ubicación nueva antes de guardar',
      position: 'top',
      timeout: 2200,
    })
    return
  }

  const historialActual = Array.isArray(articuloConsultado.value.historialUbicaciones)
    ? articuloConsultado.value.historialUbicaciones
    : []
  const ubicacionReferencia =
    historialActual.length > 0
      ? historialActual[historialActual.length - 1]
      : articuloConsultado.value.ubicacionAntigua
  const ubicacionNueva = nuevaUbicacion.value.trim().toUpperCase()
  if ((ubicacionReferencia || '').trim().toUpperCase() === ubicacionNueva) {
    Notify.create({
      type: 'warning',
      message: 'La ubicación nueva es igual a la última conocida',
      position: 'top',
      timeout: 2200,
    })
    return
  }

  const resultado = await registrarUbicacionArticulo(
    articuloConsultado.value.codigo,
    ubicacionNueva,
  )
  if (!resultado.exito) {
    Notify.create({
      type: 'negative',
      message: resultado.mensaje || 'No se pudo actualizar la ubicación',
      position: 'top',
      timeout: 2600,
    })
    return
  }

  const historialActualizado = obtenerHistorialUbicaciones(articuloConsultado.value.codigo)
  articuloConsultado.value = {
    ...articuloConsultado.value,
    historialUbicaciones: historialActualizado,
  }
  if (textoCopiadoBusqueda.value) {
    busquedaArticulo.value = textoCopiadoBusqueda.value
  }
  mostrarEditorUbicacion.value = false
  nuevaUbicacion.value = ''
  await nextTick()
  inputBusquedaRef.value?.focus()
  const largoTextoBusqueda = busquedaArticulo.value.length
  inputBusquedaRef.value?.setSelectionRange(largoTextoBusqueda, largoTextoBusqueda)

  Notify.create({
    type: 'positive',
    message: 'Ubicación actualizada y agregada a Ubicaciones para enviar',
    position: 'top',
    timeout: 2600,
  })
}

const manejarBaseCargada = () => {
  actualizarEstadoBaseDatos()
}

const manejarErrorCarga = () => {
  actualizarEstadoBaseDatos()
}

const manejarModalAbierto = () => {
  modalActivo.value = true
}

const manejarModalCerrado = () => {
  modalActivo.value = false
}

function cerrarPasoAtrasNativo() {
  if (mostrarCamara.value) {
    cerrarCamara()
    modalActivo.value = false
    return true
  }
  if (mostrarEditorUbicacion.value) {
    mostrarEditorUbicacion.value = false
    nuevaUbicacion.value = ''
    return true
  }
  if (mostrarBuscador.value) {
    mostrarBuscador.value = false
    return true
  }
  return false
}

watch(
  () => modalActivo.value,
  () => {
    actualizarConfiguracionBarra()
  },
)

onMounted(() => {
  actualizarEstadoBaseDatos()
  actualizarConfiguracionBarra()
  intervaloBaseDatos = setInterval(() => {
    actualizarEstadoBaseDatos()
  }, 1000)
})

onUnmounted(() => {
  if (intervaloBaseDatos) {
    clearInterval(intervaloBaseDatos)
  }

  emit(
    'configurar-barra',
    {
      mostrarAgregar: false,
      mostrarEnviar: false,
      puedeEnviar: false,
      botonesPersonalizados: [],
      modalActivo: false,
    },
    null,
  )
})
</script>

<style scoped>
.contenedor-consulta {
  background-color: var(--color-superficie);
  padding: 1rem;
  padding-bottom: 120px;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  max-width: 900px;
  margin: 20px auto;
}
.titulo-consulta {
  text-align: center;
  color: var(--color-primario);
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 1rem 0;
}
.bloque-buscador {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.6rem;
  align-items: center;
  transition: all 0.35s ease;
}
.bloque-buscador-con-resultado {
  margin-top: 0.4rem;
}
.campo-buscador {
  position: relative;
}
.input-buscador {
  width: 100%;
  padding: 14px 40px 14px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease;
}
.boton-copiar-busqueda {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: var(--color-texto-secundario);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  opacity: 0.6;
  transition: all 0.2s ease;
}
.boton-copiar-busqueda:hover {
  opacity: 1;
  color: var(--color-acento);
  transform: translateY(-50%) scale(1.08);
}
.input-buscador:focus {
  border-color: var(--color-primario);
}
.boton-camara {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  color: var(--color-texto-principal);
  width: 50px;
  height: 50px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.25s ease;
}
.boton-camara:hover {
  border-color: var(--color-primario);
}
.resultado-consulta {
  margin-top: 1rem;
}
.tarjeta-resultado {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  padding: 1rem;
}
.tarjeta-sl-neon {
  border-color: var(--color-neon-sl-borde);
  box-shadow: 0 0 12px var(--color-neon-sl-sombra), 0 0 24px var(--color-neon-sl-sombra);
}
.etiqueta-resultado {
  margin: 0;
  color: var(--color-texto-secundario);
  font-size: 0.85rem;
}
.lista-historial-ubicaciones {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.4rem;
}
.valor-ubicacion {
  margin: 0;
  color: var(--color-primario);
  font-size: clamp(1.4rem, 6vw, 2.2rem);
  font-weight: 800;
  line-height: 1.05;
}
.texto-sl-neon {
  color: var(--color-neon-sl-texto);
  text-shadow: 0 0 8px var(--color-neon-sl-sombra), 0 0 16px var(--color-neon-sl-sombra);
}
.ubicacion-original {
  margin: 0.5rem 0 0.7rem 0;
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
}
.valor-nombre {
  margin: 0;
  color: var(--color-texto-principal);
  font-size: clamp(1rem, 4.5vw, 1.6rem);
  font-weight: 700;
}
.valor-codigo {
  margin: 0.3rem 0 0 0;
  color: var(--color-texto-secundario);
  font-size: clamp(0.95rem, 3.8vw, 1.1rem);
  font-weight: 600;
}
.boton-actualizar-ubicacion {
  margin-top: 0.75rem;
  width: 100%;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  border-radius: 8px;
  padding: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}
.boton-actualizar-ubicacion:hover {
  border-color: var(--color-primario);
}
.editor-ubicacion {
  margin-top: 0.7rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.6rem;
  align-items: center;
}
.campo-editor {
  position: relative;
}
.input-ubicacion {
  width: 100%;
  padding: 14px 38px 14px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  font-size: 1rem;
  outline: none;
}
.input-ubicacion:focus {
  border-color: var(--color-primario);
}
.boton-limpiar-ubicacion {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: var(--color-texto-secundario);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
}
.boton-guardar-ubicacion {
  background: var(--color-exito);
  color: var(--color-texto-principal);
  border: none;
  border-radius: 8px;
  padding: 14px 16px;
  font-weight: 700;
  cursor: pointer;
}
.mostrar-resultado-enter-active,
.mostrar-resultado-leave-active,
.mostrar-editor-enter-active,
.mostrar-editor-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.mostrar-resultado-enter-from,
.mostrar-resultado-leave-to,
.mostrar-editor-enter-from,
.mostrar-editor-leave-to {
  opacity: 0;
  transform: translateY(10px);
  max-height: 0;
}
.mostrar-resultado-enter-to,
.mostrar-resultado-leave-from,
.mostrar-editor-enter-to,
.mostrar-editor-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 900px;
}
@media (max-width: 600px) {
  .contenedor-consulta {
    padding: 0.75rem;
    margin: 12px;
  }
  .titulo-consulta {
    font-size: 1.6rem;
  }
  .editor-ubicacion {
    grid-template-columns: 1fr;
  }
}
</style>
