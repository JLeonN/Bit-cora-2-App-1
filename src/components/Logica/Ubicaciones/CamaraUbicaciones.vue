<template>
  <div class="modal-fondo" @click.self="cancelarGeneral">
    <div class="modal-camara">
      <div class="caja-camara visor-placeholder">
        <div v-if="estado === 'ingresandoUbicacion'" class="feedback-codigo-escaneado">
          <span class="texto-feedback">Artículo Escaneado:</span>
          <span class="codigo-feedback">{{ codigoEscaneadoTemporal }}</span>
        </div>
      </div>

      <div class="caja-inferior">
        <div v-if="estado === 'escaneando'" class="controles-principales">
          <button class="boton-cancelar" @click="cancelarGeneral">Cancelar</button>
          <button
            class="boton-finalizar"
            :disabled="ubicacionesGuardadas.length === 0"
            @click="finalizar"
          >
            {{ `Finalizar (${ubicacionesGuardadas.length})` }}
          </button>
        </div>

        <div v-if="estado === 'ingresandoUbicacion'" class="controles-ingreso">
          <input
            v-model="nuevaUbicacion"
            type="text"
            placeholder="Ingrese la ubicación del artículo"
            class="input-ubicacion"
            ref="inputUbicacionRef"
          />
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
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { IconArrowRight, IconSquareRoundedMinus } from '@tabler/icons-vue'

const emit = defineEmits(['cancelar', 'finalizar'])

// --- Estados de la UI ---
// 'escaneando' | 'ingresandoUbicacion'
const estado = ref('escaneando')

// --- Datos del componente ---
const ubicacionesGuardadas = ref([]) // Lista de { codigo, ubicacion }
const codigoEscaneadoTemporal = ref(null)
const nuevaUbicacion = ref('')
const inputUbicacionRef = ref(null) // Para hacer focus en el input

// --- Lógica de la UI (simulada) ---
function simularEscaneo() {
  const codigosDePrueba = ['5455454', 'ASC-123', 'PROD-9981']
  const codigoSimulado = codigosDePrueba[Math.floor(Math.random() * codigosDePrueba.length)]

  codigoEscaneadoTemporal.value = codigoSimulado
  estado.value = 'ingresandoUbicacion'

  nextTick(() => {
    inputUbicacionRef.value?.focus()
  })
}

function guardarUbicacion() {
  if (!nuevaUbicacion.value.trim()) {
    alert('Por favor, ingrese una ubicación.')
    return
  }

  ubicacionesGuardadas.value.push({
    codigo: codigoEscaneadoTemporal.value,
    ubicacion: nuevaUbicacion.value.trim().toUpperCase(),
  })

  nuevaUbicacion.value = ''
  codigoEscaneadoTemporal.value = null
  estado.value = 'escaneando'

  console.log('Ubicaciones guardadas:', ubicacionesGuardadas.value)
}

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

<style scoped>
.visor-placeholder {
  background-color: #2e7d32;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-family: monospace;
  font-size: 1.2rem;
  cursor: pointer;
}

.feedback-codigo-escaneado {
  background-color: rgba(0, 0, 0, 0.6);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.texto-feedback {
  font-size: 1rem;
  color: #ccc;
}
.codigo-feedback {
  font-size: 1.8rem;
  font-weight: bold;
  color: #fff;
}

.caja-inferior {
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.controles-principales,
.controles-ingreso {
  display: flex;
  gap: 0.8rem;
  width: 100%;
}

.input-ubicacion {
  flex-grow: 1;
  padding: 0.8rem;
  border-radius: 6px;
  border: 1px solid var(--color-borde);
  background-color: var(--color-fondo);
  color: var(--color-texto-principal);
  font-size: 1rem;
}

.boton-siguiente,
.boton-descartar {
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.boton-siguiente {
  background-color: var(--color-exito);
  color: white;
}

.boton-descartar {
  background-color: var(--color-error);
  color: white;
}

.boton-finalizar,
.boton-cancelar {
  flex: 1;
}
</style>
