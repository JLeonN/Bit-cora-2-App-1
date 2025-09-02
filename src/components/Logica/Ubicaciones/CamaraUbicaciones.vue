<template>
  <div class="modal-fondo" @click.self="cancelarGeneral">
    <div class="modal-camara">
      <div class="caja-camara visor-placeholder">
        <div v-if="estado === 'ingresandoUbicacion'" class="feedback-codigo-escaneado">
          <span class="texto-feedback">Artículo Escaneado:</span>

          <!-- Vista normal del código -->
          <div v-if="!editandoCodigo" class="contenedor-codigo-feedback">
            <span class="codigo-feedback">{{ codigoEscaneadoTemporal }}</span>
            <button class="boton-editar-codigo" @click="activarEdicionCodigo">
              <IconPencil stroke="2" />
            </button>
          </div>

          <!-- Modo edición del código -->
          <div v-else class="contenedor-edicion-codigo">
            <input
              v-model="codigoEditado"
              type="text"
              class="input-codigo-editable"
              ref="inputCodigoRef"
              @keydown.enter="confirmarEdicionCodigo"
            />
            <button class="boton-cancelar-codigo" @click="cancelarEdicionCodigo">
              <IconSquareRoundedMinus stroke="2" />
            </button>
            <button class="boton-confirmar-codigo" @click="confirmarEdicionCodigo">
              <IconCheck stroke="2" />
            </button>
          </div>
        </div>
      </div>

      <div class="caja-inferior">
        <div v-if="estado === 'escaneando'" class="controles-principales">
          <button
            class="boton-finalizar"
            :disabled="ubicacionesGuardadas.length === 0"
            @click="finalizar"
          >
            {{ `Finalizar (${ubicacionesGuardadas.length})` }}
          </button>
          <button class="boton-cancelar" @click="cancelarGeneral">Cancelar</button>
        </div>

        <div v-if="estado === 'ingresandoUbicacion'" class="controles-ingreso">
          <!-- input ubicacion -->
          <div class="ubicacion-campo">
            <input
              v-model="nuevaUbicacion"
              type="text"
              :placeholder="placeholderUbicacion"
              :class="{ 'input-error': errorUbicacion, 'animar-error': animarErrorUbicacion }"
              ref="inputUbicacionRef"
              @animationend="animarErrorUbicacion = false"
              @input="restablercerPlaceholderUbicacion"
              @blur="formatearUbicacion"
              :disabled="editandoCodigo"
            />
          </div>

          <!-- contenedor botones -->
          <div class="contenedor-botones-accion">
            <button class="boton-descartar" @click="descartarEscaneo">
              <IconSquareRoundedMinus stroke="2" />
            </button>
            <button class="boton-siguiente" @click="guardarUbicacion">
              <IconArrowRight stroke="2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { IconArrowRight, IconSquareRoundedMinus, IconPencil, IconCheck } from '@tabler/icons-vue'

const emit = defineEmits(['cancelar', 'finalizar'])

// --- Estados de la UI ---
const estado = ref('escaneando')
const editandoCodigo = ref(false)

// --- Datos del componente ---
const ubicacionesGuardadas = ref([])
const codigoEscaneadoTemporal = ref(null)
const codigoEditado = ref('')
const nuevaUbicacion = ref('')
const inputUbicacionRef = ref(null)
const inputCodigoRef = ref(null)

// --- Placeholders y errores ---
const placeholderUbicacion = ref('Ingrese la ubicación del artículo')
const errorUbicacion = ref(false)
const animarErrorUbicacion = ref(false)

// --- Funciones edición de código ---
function activarEdicionCodigo() {
  editandoCodigo.value = true
  codigoEditado.value = codigoEscaneadoTemporal.value
  nextTick(() => {
    inputCodigoRef.value?.focus()
    inputCodigoRef.value?.select()
  })
}

function confirmarEdicionCodigo() {
  const nuevoCodigo = codigoEditado.value.trim()
  if (!nuevoCodigo) return
  codigoEscaneadoTemporal.value = nuevoCodigo
  editandoCodigo.value = false
}

function cancelarEdicionCodigo() {
  editandoCodigo.value = false
  codigoEditado.value = ''
}

// --- Funciones de placeholders ---
function restablercerPlaceholderUbicacion() {
  errorUbicacion.value = false
  placeholderUbicacion.value = 'Ingrese la ubicación del artículo'
}

// --- Función para formatear ubicación ---
function formatearUbicacion() {
  if (!nuevaUbicacion.value) return
  let texto = nuevaUbicacion.value.trim()
  texto = texto.replace(/\s+/g, '-') // Reemplaza espacios intermedios por guiones
  nuevaUbicacion.value = texto
}

// --- Simulación escaneo ---
function simularEscaneo() {
  const codigosDePrueba = ['5455454', 'ASC-123', 'PROD-9981']
  const codigoSimulado = codigosDePrueba[Math.floor(Math.random() * codigosDePrueba.length)]
  codigoEscaneadoTemporal.value = codigoSimulado
  estado.value = 'ingresandoUbicacion'
  nextTick(() => {
    inputUbicacionRef.value?.focus()
  })
}

// --- Guardar ubicación ---
function guardarUbicacion() {
  if (!nuevaUbicacion.value.trim()) {
    errorUbicacion.value = true
    animarErrorUbicacion.value = true
    placeholderUbicacion.value = 'Ingresar una ubicación'
    return
  }

  formatearUbicacion()

  ubicacionesGuardadas.value.push({
    codigo: codigoEscaneadoTemporal.value,
    ubicacion: nuevaUbicacion.value.trim().toUpperCase(),
  })

  nuevaUbicacion.value = ''
  codigoEscaneadoTemporal.value = null
  estado.value = 'escaneando'

  console.log('Ubicaciones guardadas:', ubicacionesGuardadas.value)
}

// --- Otros controles ---
function descartarEscaneo() {
  nuevaUbicacion.value = ''
  codigoEscaneadoTemporal.value = null
  estado.value = 'escaneando'
}

function finalizar() {
  if (ubicacionesGuardadas.value.length > 0) {
    emit('finalizar', ubicacionesGuardadas.value)
  }
}

function cancelarGeneral() {
  emit('cancelar')
}

onMounted(() => {
  document.querySelector('.visor-placeholder').addEventListener('click', simularEscaneo)
})
</script>
