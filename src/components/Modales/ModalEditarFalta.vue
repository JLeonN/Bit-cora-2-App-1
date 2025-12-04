<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div :class="['modal-contenido', { activo: modalActivo }]">
      <h3 class="modal-titulo">Editar día no trabajado</h3>

      <div class="modal-campo">
        <label for="observacion">Observación</label>
        <input
          id="observacion"
          type="text"
          v-model="observacionEditada"
          placeholder="Motivo de la falta"
          @focus="modalActivo = true"
          @blur="modalActivo = false"
        />
      </div>

      <div class="modal-campo">
        <label for="fecha">Fecha</label>
        <input
          id="fecha"
          type="date"
          v-model="fechaEditada"
          @focus="modalActivo = true"
          @blur="modalActivo = false"
        />
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
import { ref, watch } from 'vue'
import DosBotones from '../Botones/TresBotones.vue'
import { obtenerPedidos } from '../BaseDeDatos/almacenamiento.js'

const props = defineProps({
  observacion: String,
  fecha: String,
})
const emit = defineEmits(['guardar', 'cerrar'])

const observacionEditada = ref(props.observacion)
const fechaEditada = ref('')
const modalActivo = ref(false)
const mensajeError = ref('')

// Convertir fecha de DD/MM/YYYY a YYYY-MM-DD
function convertirAFormatoInput(fechaDDMMYYYY) {
  const [dia, mes, anio] = fechaDDMMYYYY.split('/')
  return `${anio}-${mes}-${dia}`
}

// Convertir fecha de YYYY-MM-DD a DD/MM/YYYY
function convertirAFormatoDDMMYYYY(fechaYYYYMMDD) {
  const [anio, mes, dia] = fechaYYYYMMDD.split('-')
  return `${dia}/${mes}/${anio}`
}

// Inicializar fecha
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

  // Si observación está vacía, vuelve a FALTA
  const observacionFinal = observacionEditada.value.trim() || 'FALTA'
  const fechaFinal = convertirAFormatoDDMMYYYY(fechaEditada.value)

  // Validar que la fecha nueva no tenga pedidos o faltas
  const todosLosPedidos = await obtenerPedidos()
  const fechaOriginal = props.fecha

  // Si cambió la fecha
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
  transform: scale(0.9);
  opacity: 0;
  transition: all 0.2s ease;
}
.modal-contenido.activo {
  transform: scale(1);
  opacity: 1;
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
