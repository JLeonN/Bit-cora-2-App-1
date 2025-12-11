<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div class="modal-contenido">
      <h3 class="modal-titulo">Editar día no trabajado</h3>

      <div class="modal-campo">
        <label for="observacion">Observación</label>
        <input
          id="observacion"
          type="text"
          v-model="observacionEditada"
          placeholder="Motivo de la falta"
          @keyup.enter="guardarCambios"
        />
      </div>

      <div class="modal-campo">
        <label for="fecha">Fecha</label>
        <input id="fecha" type="date" v-model="fechaEditada" @keyup.enter="guardarCambios" />
      </div>

      <!-- Mensaje de error -->
      <div v-if="mensajeError" class="mensaje-error">
        {{ mensajeError }}
      </div>

      <DosBotones
        textoAceptar="Guardar"
        textoCancelar="Cancelar"
        @aceptar="guardarCambios"
        @cancelar="$emit('cerrar')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import DosBotones from '../Botones/TresBotones.vue'
import { obtenerPedidos } from '../BaseDeDatos/almacenamiento.js'

const props = defineProps({
  observacion: String,
  fecha: String,
})
const emit = defineEmits(['guardar', 'cerrar', 'modal-abierto', 'modal-cerrado'])

const observacionEditada = ref(props.observacion)
const fechaEditada = ref('')
const mensajeError = ref('')

function convertirAFormatoInput(fechaDDMMYYYY) {
  const [dia, mes, anio] = fechaDDMMYYYY.split('/')
  return `${anio}-${mes}-${dia}`
}

function convertirAFormatoDDMMYYYY(fechaYYYYMMDD) {
  const [anio, mes, dia] = fechaYYYYMMDD.split('-')
  return `${dia}/${mes}/${anio}`
}

fechaEditada.value = convertirAFormatoInput(props.fecha)

watch(
  () => props.observacion,
  (nuevo) => {
    observacionEditada.value = nuevo
  },
)

watch(
  () => props.fecha,
  (nuevo) => {
    fechaEditada.value = convertirAFormatoInput(nuevo)
  },
)

async function guardarCambios() {
  mensajeError.value = ''

  const observacionFinal = observacionEditada.value.trim() || 'FALTA'
  const fechaFinal = convertirAFormatoDDMMYYYY(fechaEditada.value)

  const todosLosPedidos = await obtenerPedidos()
  const fechaOriginal = props.fecha

  if (fechaFinal !== fechaOriginal) {
    const hayRegistrosEnFecha = todosLosPedidos.some((p) => p.fecha === fechaFinal)

    if (hayRegistrosEnFecha) {
      mensajeError.value = 'Ya hay registros en esa fecha'
      return
    }
  }

  emit('guardar', {
    observacion: observacionFinal,
    fecha: fechaFinal,
    fechaOriginal: fechaOriginal,
  })
}

// Emitir que el modal está abierto al montar
onMounted(() => {
  emit('modal-abierto')
})

// Emitir que el modal está cerrado al desmontar
onUnmounted(() => {
  emit('modal-cerrado')
})
</script>

<style scoped>
.modal-fondo {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-contenido {
  background: var(--color-superficie);
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.modal-titulo {
  margin: 0 0 1.5rem 0;
  color: var(--color-texto-principal);
  font-size: 1.25rem;
  font-weight: 600;
}
.modal-campo {
  margin-bottom: 1rem;
}
.modal-campo label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-texto-secundario);
  font-size: 0.875rem;
  font-weight: 500;
}
.modal-campo input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}
.modal-campo input:focus {
  outline: none;
  border-color: var(--color-acento);
}
.mensaje-error {
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid var(--color-error);
  color: var(--color-error);
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  text-align: center;
}
</style>
