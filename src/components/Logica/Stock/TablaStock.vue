<template>
  <div class="contenedor-tabla-stock">
    <div v-if="registros.length > 0" class="acciones-generales-tabla">
      <button
        type="button"
        class="boton-accion-general boton-enviar-etiquetas"
        title="Enviar todos a Etiquetas"
        @click="$emit('enviar-todos-etiquetas')"
      >
        <IconTag :size="20" />
        <span class="texto-boton-accion">Enviar todos a Etiquetas</span>
      </button>
      <button
        type="button"
        class="boton-accion-general boton-eliminar-todos"
        title="Eliminar todos"
        @click="$emit('eliminar-todos')"
      >
        <IconTrash :size="20" />
        <span class="texto-boton-accion">Eliminar todos</span>
      </button>
    </div>

    <div v-if="registros.length > 0" class="lista-stock">
      <article
        v-for="registro in registros"
        :key="registro.codigo"
        class="fila-stock"
        :class="{
          'fila-stock-pendiente': !registro.confirmado,
          'fila-stock-sl': esUbicacionActualSL(registro),
        }"
      >
        <div class="encabezado-fila-stock">
          <div>
            <p class="nombre-stock">{{ registro.nombre }}</p>
            <p class="codigo-stock">{{ registro.codigo }}</p>
          </div>
        </div>

        <div class="datos-fila-stock">
          <p>Stock Excel: <strong>{{ registro.stockExcel }}</strong></p>
          <p v-if="registro.stockExcelAjustado" class="aviso-stock-ajustado">
            El stock del Excel se ajustó a un entero válido.
          </p>
          <div v-if="codigoEditando !== registro.codigo" class="linea-contado">
            <button
              type="button"
              class="boton-valor-editable"
              title="Editar conteo"
              @click="iniciarEdicion(registro)"
            >
              Contado: <strong>{{ registro.stockContado }}</strong>
              <IconPencil :size="16" />
            </button>
          </div>
          <p
            v-if="registro.confirmado && obtenerDiferencia(registro) !== 0"
            class="diferencia-stock"
            :class="{
              'diferencia-stock-faltante': obtenerDiferencia(registro) < 0,
              'diferencia-stock-sobrante': obtenerDiferencia(registro) > 0,
            }"
          >
            {{ obtenerTextoDiferencia(registro) }}
          </p>
          <p v-if="codigoEditando !== registro.codigo">
            {{ registro.ubicacionOrigen === 'excel' ? 'Ubicación del Excel' : 'Ubicación' }}:
            <strong>
              <span :class="{ 'texto-sl-neon': esUbicacionActualSL(registro) }">
                {{ registro.ubicacionActual || 'Sin ubicación registrada' }}
              </span>
            </strong>
          </p>
        </div>

        <div v-if="codigoEditando === registro.codigo" class="editor-fila-stock">
          <label class="etiqueta-editor">Stock contado</label>
          <div class="control-contador">
            <button type="button" @click="restarCantidad">−</button>
            <input
              ref="inputCantidadEdicionRef"
              v-model="cantidadEdicion"
              type="number"
              step="1"
              @focus="$event.target.select()"
              @input="validarCantidad"
            />
            <button type="button" @click="sumarCantidad">+</button>
          </div>
          <label class="etiqueta-editor" :for="`ubicacion-${registro.codigo}`">Ubicación</label>
          <input
            :id="`ubicacion-${registro.codigo}`"
            v-model="ubicacionEdicion"
            type="text"
            class="input-ubicacion-edicion sin-enfoque-automatico"
            placeholder="Ubicación"
            @blur="formatearUbicacion"
          />
          <div class="acciones-editor">
            <button type="button" class="boton-guardar-edicion" @click="guardarEdicion(registro)">
              Guardar
            </button>
            <button type="button" class="boton-cancelar-edicion" @click="cancelarEdicion">
              Cancelar
            </button>
          </div>
        </div>

        <div class="pie-fila-stock">
          <div class="estado-stock" :class="{ 'estado-confirmado': registro.confirmado }">
            <IconCircleCheck v-if="registro.confirmado" :size="18" />
            <IconClock v-else :size="18" />
            <span v-if="registro.confirmado">Confirmado</span>
            <template v-else>
              <span class="texto-pendiente-completo">Pendiente de confirmar</span>
              <span class="texto-pendiente-corto">Pendiente</span>
            </template>
          </div>
          <div class="acciones-fila-stock">
            <button
              v-if="!registro.confirmado"
              type="button"
              class="boton-fila boton-confirmar-fila"
              title="Confirmar conteo"
              @click="$emit('confirmar', registro)"
            >
              <IconCheck :size="19" />
            </button>
            <button
              type="button"
              class="boton-fila"
              title="Editar"
              @click="iniciarEdicion(registro)"
            >
              <IconPencil class="icono-ubicacion icono-editar" :size="19" />
            </button>
            <button
              type="button"
              class="boton-fila"
              title="Enviar a Etiquetas"
              @click="$emit('enviar-etiqueta', registro)"
            >
              <IconTag class="icono-ubicacion icono-etiqueta" :size="19" />
            </button>
            <button
              type="button"
              class="boton-fila boton-eliminar-fila"
              title="Eliminar"
              @click="$emit('eliminar', registro)"
            >
              <IconTrash class="icono-ubicacion icono-borrar" :size="19" />
            </button>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="estado-vacio-stock">
      Todavía no hay artículos en Stock.
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import {
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconPencil,
  IconTag,
  IconTrash,
} from '@tabler/icons-vue'

defineProps({
  registros: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'confirmar',
  'guardar-edicion',
  'eliminar',
  'eliminar-todos',
  'enviar-etiqueta',
  'enviar-todos-etiquetas',
])

const codigoEditando = ref('')
const cantidadEdicion = ref(0)
const cantidadValidaAnterior = ref(0)
const ubicacionEdicion = ref('')
const inputCantidadEdicionRef = ref(null)

function esUbicacionActualSL(registro) {
  return String(registro?.ubicacionActual || '')
    .trim()
    .toUpperCase() === 'SL'
}

function obtenerDiferencia(registro) {
  return Number(registro?.stockContado || 0) - Number(registro?.stockExcel || 0)
}

function obtenerTextoDiferencia(registro) {
  const diferencia = obtenerDiferencia(registro)
  const cantidad = Math.abs(diferencia)
  const unidad = cantidad === 1 ? 'unidad' : 'unidades'
  return diferencia < 0
    ? `Faltan ${cantidad} ${unidad}`
    : `Se contaron ${cantidad} ${unidad} más`
}

async function iniciarEdicion(registro) {
  codigoEditando.value = registro.codigo
  cantidadEdicion.value = registro.stockContado
  cantidadValidaAnterior.value = registro.stockContado
  ubicacionEdicion.value = registro.ubicacionActual || ''
  await nextTick()
  const input = Array.isArray(inputCantidadEdicionRef.value)
    ? inputCantidadEdicionRef.value[0]
    : inputCantidadEdicionRef.value
  input?.focus()
  input?.select()
}

function validarCantidad() {
  const textoCantidad = String(cantidadEdicion.value ?? '').trim()
  if (textoCantidad === '' || textoCantidad === '-') return
  const numero = Number(cantidadEdicion.value)
  if (!Number.isInteger(numero)) {
    cantidadEdicion.value = cantidadValidaAnterior.value
    return
  }
  cantidadValidaAnterior.value = numero
}

function restarCantidad() {
  cantidadEdicion.value = Number(cantidadValidaAnterior.value) - 1
  cantidadValidaAnterior.value = cantidadEdicion.value
}

function sumarCantidad() {
  cantidadEdicion.value = Number(cantidadValidaAnterior.value) + 1
  cantidadValidaAnterior.value = cantidadEdicion.value
}

function formatearUbicacion() {
  ubicacionEdicion.value = String(ubicacionEdicion.value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
}

function guardarEdicion(registro) {
  formatearUbicacion()
  const ubicacionOriginalExcel = String(registro.ubicacionOriginalExcel || '')
    .trim()
    .toUpperCase()
  const conservaUbicacionExcel =
    registro.ubicacionOrigen === 'excel' && ubicacionEdicion.value === ubicacionOriginalExcel
  emit('guardar-edicion', {
    ...registro,
    stockContado: cantidadValidaAnterior.value,
    ubicacionActual: ubicacionEdicion.value,
    ubicacionOrigen: conservaUbicacionExcel || !ubicacionEdicion.value ? 'excel' : 'usuario',
  })
  cancelarEdicion()
}

function cancelarEdicion() {
  codigoEditando.value = ''
  cantidadEdicion.value = 0
  cantidadValidaAnterior.value = 0
  ubicacionEdicion.value = ''
}

defineExpose({
  cerrarEdicion: () => {
    if (!codigoEditando.value) return false
    cancelarEdicion()
    return true
  },
})
</script>

<style scoped>
.lista-stock {
  display: grid;
  gap: 0.8rem;
}
.fila-stock {
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  padding: 1rem;
  background: var(--color-fondo);
}
.fila-stock-pendiente {
  border-color: var(--color-carga);
}
.fila-stock-sl {
  border-color: var(--color-neon-sl-borde);
  box-shadow: 0 0 10px var(--color-neon-sl-sombra);
}
.encabezado-fila-stock {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: flex-start;
}
.nombre-stock {
  margin: 0;
  color: var(--color-texto-principal);
  font-size: 1.15rem;
  font-weight: 700;
}
.codigo-stock {
  margin: 0.2rem 0 0 0;
  color: var(--color-texto-secundario);
}
.estado-stock {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
  color: var(--color-carga);
  font-size: 0.82rem;
  font-weight: 700;
  text-align: left;
  white-space: nowrap;
}
.estado-confirmado {
  color: var(--color-exito);
}
.texto-pendiente-corto {
  display: none;
}
.pie-fila-stock {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-top: 0.8rem;
}
.datos-fila-stock p {
  margin: 0.45rem 0 0 0;
  color: var(--color-texto-secundario);
}
.datos-fila-stock strong {
  color: var(--color-texto-principal);
}
.datos-fila-stock .aviso-stock-ajustado {
  color: var(--color-carga);
  font-size: 0.82rem;
}
.datos-fila-stock .diferencia-stock {
  font-weight: 700;
}
.datos-fila-stock .diferencia-stock-faltante {
  color: var(--color-error);
}
.datos-fila-stock .diferencia-stock-sobrante {
  color: var(--color-exito);
}
.boton-valor-editable {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--color-texto-secundario);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  font-size: 1rem;
}
.boton-valor-editable strong {
  color: var(--color-primario);
  font-size: 1.2rem;
}
.editor-fila-stock {
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--color-borde);
}
.etiqueta-editor {
  display: block;
  color: var(--color-texto-secundario);
  font-size: 0.82rem;
  margin: 0.5rem 0 0.3rem 0;
}
.control-contador {
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  gap: 0.5rem;
}
.control-contador button,
.control-contador input,
.input-ubicacion-edicion {
  min-height: 46px;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-superficie);
  color: var(--color-texto-principal);
  text-align: center;
  font-size: 1rem;
}
.input-ubicacion-edicion {
  width: 100%;
  text-align: left;
  padding: 0 0.75rem;
}
.acciones-editor,
.acciones-fila-stock {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
.acciones-editor {
  margin-top: 0.8rem;
}
.boton-guardar-edicion,
.boton-cancelar-edicion {
  border: 0;
  border-radius: 8px;
  padding: 0.65rem 1rem;
  cursor: pointer;
}
.boton-guardar-edicion {
  background: var(--color-exito);
  color: var(--color-texto-principal);
}
.boton-cancelar-edicion {
  background: var(--color-superficie);
  color: var(--color-texto-secundario);
  border: 1px solid var(--color-borde);
}
.boton-fila {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--color-borde);
  background: var(--color-superficie);
  color: var(--color-texto-principal);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.boton-confirmar-fila {
  color: var(--color-exito);
}
.boton-eliminar-fila {
  color: var(--color-error);
}
.estado-vacio-stock {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-texto-secundario);
}
@media (max-width: 420px) {
  .texto-pendiente-completo {
    display: none;
  }
  .texto-pendiente-corto {
    display: inline;
  }
}
@media (max-width: 370px) {
  .pie-fila-stock {
    align-items: flex-start;
    flex-direction: column;
  }
  .acciones-fila-stock {
    align-self: flex-end;
  }
}
</style>
