<template>
  <div class="contenedor-tabla pagina-listados">
    <h2 class="titulo-tabla">Listados</h2>

    <TarjetaSeccion
      titulo="Administrar listados"
      :expandida-por-defecto="true"
      descripcion-resumen="Creá, abrí, renombrá, duplicá o eliminá tus listados guardados."
      :ocultar-resumen-al-expandir="true"
    >
      <GestorListados
        :listados="listados"
        :listado-activo="listadoActivo"
        :ocupado="ocupado"
        @crear="crearNuevoListado"
        @abrir="abrirListado"
        @renombrar="renombrarListadoActivo"
        @duplicar="duplicarListadoActivo"
        @solicitar-eliminar="solicitarEliminarListado"
      />
    </TarjetaSeccion>

    <template v-if="listadoActivo">
      <section class="zona-agregar-listado" aria-label="Agregar artículos al listado">
        <FormularioListado
          ref="formularioListadoRef"
          :deshabilitado="ocupado"
          @articulo-seleccionado="agregarArticulo"
          @base-datos-cargada="manejarBaseCargada"
          @base-datos-limpia="baseDatosCargada = false"
          @error-carga="manejarErrorCarga"
          @modal-abierto="modalActivo = true"
          @modal-cerrado="modalActivo = false"
        />
        <div class="columnas-visibles-listado">
          <span class="titulo-columnas-listado">Columnas visibles</span>
          <div class="interruptores-listado">
            <q-toggle
              :model-value="listadoActivo.configuracion.mostrarNumeracion"
              label="Numeración"
              color="primary"
              @update:model-value="actualizarConfiguracion('mostrarNumeracion', $event)"
            />
            <q-toggle
              :model-value="listadoActivo.configuracion.mostrarStock"
              label="Stock"
              color="primary"
              @update:model-value="actualizarConfiguracion('mostrarStock', $event)"
            />
            <q-toggle
              :model-value="listadoActivo.configuracion.mostrarUbicacion"
              label="Ubicación"
              color="primary"
              @update:model-value="actualizarConfiguracion('mostrarUbicacion', $event)"
            />
          </div>
        </div>
      </section>

      <SelectorOrdenamiento
        v-if="articulosOrdenados.length > 0"
        :model-value="listadoActivo.orden"
        :deshabilitado="ocupado"
        :criterios-disponibles="CRITERIOS_ORDEN"
        etiqueta-cantidad="Stock"
        @update:model-value="actualizarOrden"
      />

      <div v-if="articulosOrdenados.length" class="acciones-generales-tabla">
        <button
          type="button"
          class="boton-accion-general boton-enviar-etiquetas"
          :disabled="!baseDatosCargada || ocupado"
          @click="enviarTodosAEtiquetas"
        >
          <IconTag :size="20" />
          <span class="texto-boton-accion">Enviar todos a Etiquetas</span>
        </button>
        <button
          type="button"
          class="boton-accion-general"
          :disabled="ocupado"
          title="Enviar todos a Ubicaciones"
          @click="enviarTodosAUbicaciones"
        >
          <IconMapRoute class="icono-accion-listado" :size="20" :stroke="2" />
          <span class="texto-boton-accion">
            {{ enviandoUbicaciones ? 'Enviando…' : 'Enviar a Ubicaciones' }}
          </span>
        </button>
        <button
          type="button"
          class="boton-accion-general"
          :disabled="!baseDatosCargada || ocupado"
          title="Enviar todos a Stock"
          @click="enviarTodosAStock"
        >
          <IconPackages class="icono-accion-listado" :size="20" :stroke="2" />
          <span class="texto-boton-accion">
            {{ enviandoStock ? 'Enviando…' : 'Enviar a Stock' }}
          </span>
        </button>
        <button
          type="button"
          class="boton-accion-general boton-eliminar-todos"
          :disabled="ocupado"
          @click="solicitarEliminarTodos"
        >
          <IconTrash :size="20" />
          <span class="texto-boton-accion">Eliminar todos</span>
        </button>
      </div>

      <TablaListados
        ref="tablaListadosRef"
        :articulos="articulosOrdenados"
        :mostrar-numeracion="listadoActivo.configuracion.mostrarNumeracion"
        :mostrar-stock="listadoActivo.configuracion.mostrarStock"
        :mostrar-ubicacion="listadoActivo.configuracion.mostrarUbicacion"
        :codigo-resaltado="codigoResaltadoVisible"
        @editar-stock="guardarCambioStock"
        @editar-ubicacion="guardarCambioUbicacion"
        @eliminar="eliminarArticulo"
        @enviar-etiqueta="enviarArticuloAEtiquetas"
      />
    </template>

    <ModalEliminar
      v-if="listadoAEliminar"
      :texto="`el listado ${listadoAEliminar.nombre}`"
      @confirmar="confirmarEliminarListado"
      @cerrar="cerrarModalEliminarListado"
      @modal-abierto="modalActivo = true"
      @modal-cerrado="modalActivo = false"
    />
    <ModalEliminar
      v-if="eliminarTodosSolicitado"
      texto="todos los artículos del listado"
      @confirmar="confirmarEliminarTodos"
      @cerrar="cerrarModalEliminarTodos"
      @modal-abierto="modalActivo = true"
      @modal-cerrado="modalActivo = false"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Notify } from 'quasar'
import {
  IconDownload,
  IconMapRoute,
  IconPackages,
  IconShare,
  IconTag,
  IconTrash,
} from '@tabler/icons-vue'
import GestorListados from '../components/Logica/Listados/GestorListados.vue'
import FormularioListado from '../components/Logica/Listados/FormularioListado.vue'
import TablaListados from '../components/Logica/Listados/TablaListados.vue'
import TarjetaSeccion from '../components/Configuracion/Tutoriales/TarjetaSeccion.vue'
import SelectorOrdenamiento from '../components/Logica/Compartidos/SelectorOrdenamiento.vue'
import ModalEliminar from '../components/Modales/ModalEliminar.vue'
import {
  crearListado,
  duplicarListado,
  eliminarListado,
  guardarListado,
  guardarListadoActivo,
  obtenerListado,
  obtenerListadoActivo,
  obtenerListados,
  renombrarListado,
} from '../components/BaseDeDatos/UsoAlmacenamientoListados.js'
import {
  inicializarBaseDatos,
  obtenerEstadoCarga,
} from '../components/BaseDeDatos/LectorExcel.js'
import { normalizarCodigoBusqueda } from '../components/Logica/Compartidos/CodigoEscaner.js'
import { usarResaltadoAtencion } from '../components/Logica/Compartidos/UsoResaltadoAtencion.js'
import {
  CRITERIOS_ORDEN,
  normalizarOrden,
  ordenarColeccion,
} from '../components/Logica/Compartidos/OrdenarColeccion.js'
import {
  enviarArticuloAEtiquetas as enviarArticuloAEtiquetasServicio,
  enviarTodosAEtiquetas as enviarTodosAEtiquetasServicio,
  enviarTodosAStock as enviarTodosAStockServicio,
  enviarTodosAUbicaciones as enviarTodosAUbicacionesServicio,
} from '../components/Logica/Listados/ServicioIntegracionListados.js'
import { generarYGuardarExcelListado } from '../components/Logica/Listados/ExportarListadosExcel.js'
import { compartirArchivo } from '../components/Logica/Pedidos/CompartirExcel.js'

const emit = defineEmits(['configurar-barra'])
const listados = ref([])
const listadoActivo = ref(null)
const baseDatosCargada = ref(false)
const modalActivo = ref(false)
const listadoAEliminar = ref(null)
const eliminarTodosSolicitado = ref(false)
const exportando = ref(false)
const enviandoStock = ref(false)
const enviandoUbicaciones = ref(false)
const administrando = ref(false)
const codigoResaltado = ref('')
const formularioListadoRef = ref(null)
const tablaListadosRef = ref(null)
const { estaResaltado, activarResaltado } = usarResaltadoAtencion(2400)
const ocupado = computed(
  () => administrando.value || exportando.value || enviandoStock.value || enviandoUbicaciones.value,
)
const articulosOrdenados = computed(() =>
  ordenarColeccion(listadoActivo.value?.articulos || [], listadoActivo.value?.orden, {
    obtenerFecha: (articulo) => articulo.fechaIngreso,
    obtenerTexto: (articulo) => articulo.descripcion,
    obtenerUbicacion: (articulo) => articulo.ubicacionListado,
    obtenerCantidad: (articulo) => articulo.stockListado,
    obtenerClave: (articulo) => articulo.codigo,
  }),
)
const codigoResaltadoVisible = computed(() =>
  estaResaltado.value ? codigoResaltado.value : '',
)
const esNavegadorWeb = computed(() => Capacitor.getPlatform() === 'web')
const configuracionBarra = computed(() => ({
  mostrarAgregar: false,
  mostrarEnviar: !esNavegadorWeb.value && articulosOrdenados.value.length > 0,
  puedeEnviar: articulosOrdenados.value.length > 0 && !exportando.value,
  iconoEnviar: IconShare,
  tituloEnviar: 'Compartir listado',
  botonesPersonalizados: esNavegadorWeb.value
    ? [
        {
          accion: 'descargar-listado',
          icono: IconDownload,
          titulo: 'Descargar Excel del listado',
          desactivado: articulosOrdenados.value.length === 0 || exportando.value,
          claseCSS: '',
        },
      ]
    : [],
  modalActivo: modalActivo.value,
}))
const metodosParaBarra = {
  onAgregar: () => {},
  onEnviar: () => exportarListado(),
  onAccionPersonalizada: (accion) => {
    if (accion === 'descargar-listado') exportarListado()
  },
  onAtrasNativo: () => cerrarPasoAtrasNativo(),
}

function notificar(tipo, mensaje, timeout = 2400) {
  Notify.create({ type: tipo, message: mensaje, position: 'top', timeout })
}

function reemplazarListadoLocal(guardado) {
  listadoActivo.value = guardado
  const restantes = listados.value.filter((listado) => listado.id !== guardado.id)
  listados.value = [guardado, ...restantes].sort((a, b) => b.actualizadoEn - a.actualizadoEn)
}

async function cargarListados() {
  listados.value = await obtenerListados()
  let activo = await obtenerListadoActivo()
  if (!activo) activo = listados.value[0] || (await crearListado())
  reemplazarListadoLocal(activo)
  await guardarListadoActivo(activo.id)
}

async function ejecutarAdministracion(operacion) {
  if (administrando.value) return
  administrando.value = true
  try {
    await operacion()
  } catch (error) {
    notificar('negative', error.message || 'No se pudo actualizar el listado')
  } finally {
    administrando.value = false
  }
}

function crearNuevoListado() {
  ejecutarAdministracion(async () => {
    const creado = await crearListado()
    reemplazarListadoLocal(creado)
    notificar('positive', 'Listado creado')
    await formularioListadoRef.value?.enfocarBusqueda?.()
  })
}

function abrirListado(id) {
  ejecutarAdministracion(async () => {
    const listado = await obtenerListado(id)
    if (!listado) throw new Error('No se encontró el listado')
    await guardarListadoActivo(id)
    reemplazarListadoLocal(listado)
  })
}

function renombrarListadoActivo({ id, nombrePersonalizado }) {
  ejecutarAdministracion(async () => {
    reemplazarListadoLocal(await renombrarListado(id, nombrePersonalizado))
  })
}

function duplicarListadoActivo(id) {
  ejecutarAdministracion(async () => {
    reemplazarListadoLocal(await duplicarListado(id))
    notificar('positive', 'Listado duplicado')
  })
}

function solicitarEliminarListado(listado) {
  listadoAEliminar.value = listado
}

function cerrarModalEliminarListado() {
  listadoAEliminar.value = null
  modalActivo.value = false
}

function confirmarEliminarListado() {
  const id = listadoAEliminar.value?.id
  if (!id) return
  cerrarModalEliminarListado()
  ejecutarAdministracion(async () => {
    const resultado = await eliminarListado(id)
    listados.value = await obtenerListados()
    listadoActivo.value = resultado.listadoActivo
    notificar('positive', 'Listado eliminado')
  })
}

async function persistirActivo() {
  if (!listadoActivo.value) return null
  const guardado = await guardarListado(listadoActivo.value)
  reemplazarListadoLocal(guardado)
  return guardado
}

async function agregarArticulo(articulo) {
  const codigo = normalizarCodigoBusqueda(articulo?.codigo)
  if (!codigo || !listadoActivo.value) return
  const existente = listadoActivo.value.articulos.find((item) => item.codigo === codigo)
  if (existente) {
    const posicion = articulosOrdenados.value.findIndex((item) => item.codigo === codigo) + 1
    codigoResaltado.value = codigo
    await activarResaltado()
    tablaListadosRef.value?.enfocarArticulo?.(codigo)
    Notify.create({
      type: 'warning',
      message: `El artículo ya está en el listado, posición ${posicion}`,
      position: 'top',
      timeout: 2400,
    })
    return
  }
  const fechaMayor = listadoActivo.value.articulos.reduce(
    (mayor, item) => Math.max(mayor, Number(item.fechaIngreso || 0)),
    0,
  )
  const ubicacionOriginal = String(articulo.ubicacionAntigua || '').trim().toUpperCase()
  listadoActivo.value.articulos.push({
    codigo,
    descripcion: String(articulo.nombre || '').trim(),
    stockOriginal: articulo.stock ?? '',
    stockListado: articulo.stock ?? '',
    ubicacionOriginal,
    ubicacionListado: ubicacionOriginal,
    fechaIngreso: Math.max(Date.now(), fechaMayor + 1),
  })
  await persistirActivo()
}

async function guardarCambioStock({ codigo, stockListado }) {
  const articulo = listadoActivo.value?.articulos.find((item) => item.codigo === codigo)
  if (!articulo) return
  articulo.stockListado = stockListado
  await persistirActivo()
}

async function guardarCambioUbicacion({ codigo, ubicacionListado }) {
  const articulo = listadoActivo.value?.articulos.find((item) => item.codigo === codigo)
  if (!articulo) return
  articulo.ubicacionListado = ubicacionListado
  await persistirActivo()
}

async function eliminarArticulo(articulo) {
  if (!listadoActivo.value) return
  listadoActivo.value.articulos = listadoActivo.value.articulos.filter(
    (item) => item.codigo !== articulo.codigo,
  )
  await persistirActivo()
}

function solicitarEliminarTodos() {
  eliminarTodosSolicitado.value = true
}

function cerrarModalEliminarTodos() {
  eliminarTodosSolicitado.value = false
  modalActivo.value = false
}

async function confirmarEliminarTodos() {
  cerrarModalEliminarTodos()
  if (!listadoActivo.value) return
  listadoActivo.value.articulos = []
  await persistirActivo()
  notificar('positive', 'Se eliminaron todos los artículos')
}

async function actualizarConfiguracion(campo, valor) {
  if (!listadoActivo.value) return
  listadoActivo.value.configuracion[campo] = Boolean(valor)
  await persistirActivo()
}

async function actualizarOrden(nuevoOrden) {
  if (!listadoActivo.value) return
  listadoActivo.value.orden = normalizarOrden(nuevoOrden)
  await persistirActivo()
}

async function enviarTodosAStock() {
  if (enviandoStock.value || !listadoActivo.value) return
  enviandoStock.value = true
  try {
    const resultado = await enviarTodosAStockServicio({
      ...listadoActivo.value,
      articulos: articulosOrdenados.value,
    })
    if (resultado.enviados.length) notificar('positive', `${resultado.enviados.length} artículos enviados a Stock`)
    if (resultado.omitidosConfirmados.length) {
      notificar('warning', `${resultado.omitidosConfirmados.length} artículos omitidos por estar confirmados`)
    }
    if (resultado.invalidos.length) notificar('warning', `${resultado.invalidos.length} valores de stock inválidos no se enviaron`)
  } catch (error) {
    notificar('negative', error.message || 'No se pudieron enviar los artículos a Stock')
  } finally {
    enviandoStock.value = false
  }
}

async function enviarTodosAUbicaciones() {
  if (enviandoUbicaciones.value || !listadoActivo.value) return
  enviandoUbicaciones.value = true
  try {
    const resultado = await enviarTodosAUbicacionesServicio({
      ...listadoActivo.value,
      articulos: articulosOrdenados.value,
    })
    if (resultado.enviados.length) notificar('positive', `${resultado.enviados.length} artículos enviados a Ubicaciones`)
    if (resultado.invalidos.length) notificar('warning', `${resultado.invalidos.length} ubicaciones inválidas no se enviaron`)
  } catch (error) {
    notificar('negative', error.message || 'No se pudieron enviar los artículos a Ubicaciones')
  } finally {
    enviandoUbicaciones.value = false
  }
}

async function enviarArticuloAEtiquetas(articulo) {
  if (!baseDatosCargada.value) {
    notificar('warning', 'Cargá el Excel maestro antes de enviar a Etiquetas')
    return
  }
  const resultado = await enviarArticuloAEtiquetasServicio({
    ...articulo,
    ubicacion: articulo.ubicacionListado,
  })
  if (resultado.cantidad) notificar('positive', 'Artículo enviado a Etiquetas')
  else notificar('warning', 'El artículo ya no existe en la base cargada')
}

async function enviarTodosAEtiquetas() {
  if (!baseDatosCargada.value) {
    notificar('warning', 'Cargá el Excel maestro antes de enviar a Etiquetas')
    return
  }
  const resultado = await enviarTodosAEtiquetasServicio(articulosOrdenados.value)
  if (resultado.cantidad) notificar('positive', `${resultado.cantidad} artículos enviados a Etiquetas`)
  if (resultado.omitidos) notificar('warning', `${resultado.omitidos} artículos inexistentes fueron omitidos`)
}

async function exportarListado() {
  if (exportando.value || !listadoActivo.value) return
  exportando.value = true
  try {
    const resultado = await generarYGuardarExcelListado(listadoActivo.value, articulosOrdenados.value)
    if (!esNavegadorWeb.value) {
      await compartirArchivo(resultado.uri, resultado.nombreArchivo, {
        titulo: 'Listado de artículos',
        texto: `Archivo ${resultado.nombreArchivo}`,
        tituloDialogo: 'Seleccioná la app para compartir',
      })
    } else {
      notificar('positive', 'Excel descargado correctamente')
    }
  } catch (error) {
    notificar('negative', error.message || 'No se pudo generar el Excel')
  } finally {
    exportando.value = false
  }
}

function manejarBaseCargada(datos) {
  baseDatosCargada.value = true
  if (datos?.mensaje) notificar('positive', datos.mensaje)
}

function manejarErrorCarga(mensaje) {
  baseDatosCargada.value = obtenerEstadoCarga().cargado
  notificar('negative', mensaje || 'No se pudo cargar el Excel')
}

function cerrarPasoAtrasNativo() {
  if (formularioListadoRef.value?.cerrarInteraccion?.()) return true
  if (listadoAEliminar.value) {
    cerrarModalEliminarListado()
    return true
  }
  if (eliminarTodosSolicitado.value) {
    cerrarModalEliminarTodos()
    return true
  }
  return false
}

function actualizarBarra() {
  emit('configurar-barra', configuracionBarra.value, metodosParaBarra)
}

watch(configuracionBarra, actualizarBarra, { deep: true })

onMounted(async () => {
  await inicializarBaseDatos()
  baseDatosCargada.value = obtenerEstadoCarga().cargado
  await cargarListados()
  await nextTick()
  formularioListadoRef.value?.establecerBaseCargada?.(baseDatosCargada.value)
  actualizarBarra()
})

onUnmounted(() => {
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
.pagina-listados {
  padding-bottom: var(--espacio-inferior-contenido, 120px);
}
.zona-agregar-listado {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}
.columnas-visibles-listado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  background-color: var(--color-superficie);
  color: var(--color-texto-principal);
}
.titulo-columnas-listado {
  font-weight: 600;
}
.interruptores-listado {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  color: var(--color-texto-principal);
}
.acciones-generales-tabla button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.icono-accion-listado {
  color: var(--color-primario);
}
@media (max-width: 600px) {
  .columnas-visibles-listado {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
