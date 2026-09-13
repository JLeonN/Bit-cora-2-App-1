<template>
  <section class="entrada-capitana-bita" aria-label="Capitana Bita">
    <label for="entrada-capitana-bita">Capitana Bita</label>
    <div class="fila-entrada-capitana-bita">
      <input
        id="entrada-capitana-bita"
        v-model="texto"
        class="campo-entrada-formulario campo-capitana-bita"
        type="text"
        placeholder="Escribí o dictá una lista de artículos"
        :disabled="procesando || capturandoImagen || deshabilitado"
        @keyup.enter="enviar"
      />
      <button
        type="button"
        class="boton-capitana-bita"
        title="Leer artículos desde una imagen"
        :disabled="deshabilitado || grabando || procesando || capturandoImagen"
        @click="menuImagenAbierto = true"
      >
        <IconPhoto :size="21" />
        <q-menu v-model="menuImagenAbierto" anchor="bottom right" self="top right">
          <q-list style="min-width: 190px">
            <q-item
              clickable
              v-close-popup
              style="min-height: 44px"
              @click="seleccionarImagen(ORIGENES_CAPTURA_IMAGEN.CAMARA)"
            >
              <q-item-section avatar><IconCamera :size="21" /></q-item-section>
              <q-item-section>Tomar foto</q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              style="min-height: 44px"
              @click="seleccionarImagen(ORIGENES_CAPTURA_IMAGEN.GALERIA)"
            >
              <q-item-section avatar><IconPhoto :size="21" /></q-item-section>
              <q-item-section>Elegir de galería</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </button>
      <button
        type="button"
        class="boton-capitana-bita"
        :class="{ 'boton-grabando': grabando }"
        :disabled="deshabilitado || capturandoImagen || (!disponible && !grabando)"
        :title="grabando ? 'Finalizar grabación' : 'Dictar pedido'"
        @click="alternar"
      >
        <IconMicrophone v-if="!grabando" class="icono-microfono" :size="21" />
        <IconPlayerStop v-else :size="21" />
      </button>
      <button
        type="button"
        class="boton-capitana-bita"
        title="Enviar a Capitana Bita"
        :disabled="deshabilitado || capturandoImagen || !disponible || !texto.trim()"
        @click="enviar"
      >
        <IconSend class="icono-enviar" :size="21" />
      </button>
    </div>
    <p v-if="grabando" class="estado-capitana-bita estado-grabando">
      Grabando… Tocá nuevamente para finalizar · {{ duracionFormateada }}
    </p>
    <p v-else-if="capturandoImagen" class="estado-capitana-bita">Preparando la imagen…</p>
    <p v-else-if="procesando" class="estado-capitana-bita">{{ mensajeProcesamiento }}</p>
    <p v-else-if="error" class="estado-capitana-bita estado-error" role="alert">{{ error }}</p>
    <p v-else-if="motivoNoDisponible" class="estado-capitana-bita">
      {{ motivoNoDisponible }}
    </p>
    <p v-else-if="mensajeSaludo" class="estado-capitana-bita">{{ mensajeSaludo }}</p>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { IconCamera, IconMicrophone, IconPhoto, IconPlayerStop, IconSend } from '@tabler/icons-vue'
import { ORIGENES_CAPTURA_IMAGEN } from '../Compartidos/ServicioCapturaImagen.js'
import { usarCapitanaBita } from './UsoCapitanaBita.js'

const props = defineProps({
  contextoBusqueda: { type: String, default: '' },
  deshabilitado: { type: Boolean, default: false },
  identificadorDestino: { type: String, default: '' },
})
const emit = defineEmits(['resultado-procesado', 'estado-interaccion'])
const {
  texto,
  grabando,
  duracionGrabacion,
  procesando,
  capturandoImagen,
  disponible,
  motivoNoDisponible,
  mensajeSaludo,
  mensajeProcesamiento,
  error,
  resultado,
  enviarTexto,
  alternarGrabacion,
  cancelarGrabacion,
  procesarImagenSeleccionada,
} = usarCapitanaBita({
  obtenerContextoBusqueda: () => props.contextoBusqueda,
  obtenerIdentificadorDestino: () => props.identificadorDestino,
})
const menuImagenAbierto = ref(false)

const duracionFormateada = computed(() => {
  const minutos = Math.floor(duracionGrabacion.value / 60)
  const segundos = duracionGrabacion.value % 60
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
})

async function enviar() {
  console.info('[CapitanaBita] Evento de envío recibido por la interfaz')
  await enviarTexto()
}

async function alternar() {
  console.info('[CapitanaBita] Evento de micrófono recibido por la interfaz')
  await alternarGrabacion()
}

async function seleccionarImagen(origen) {
  menuImagenAbierto.value = false
  await procesarImagenSeleccionada(origen)
}

async function cerrarInteraccion() {
  if (menuImagenAbierto.value) {
    menuImagenAbierto.value = false
    return true
  }
  return cancelarGrabacion()
}

watch(resultado, (nuevoResultado) => {
  if (nuevoResultado) emit('resultado-procesado', nuevoResultado)
})
watch(
  [grabando, procesando, capturandoImagen, menuImagenAbierto],
  ([estaGrabando, estaProcesando, estaCapturando, menuAbierto]) => {
    emit('estado-interaccion', {
      grabando: estaGrabando,
      procesando: estaProcesando,
      capturandoImagen: estaCapturando,
      menuImagenAbierto: menuAbierto,
    })
  },
)
defineExpose({ cerrarInteraccion })
</script>

<style scoped>
.entrada-capitana-bita {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin: 0.75rem 0;
  padding: 0.85rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: var(--color-superficie);
  color: var(--color-texto-principal);
}
.entrada-capitana-bita label {
  font-weight: 700;
}
.fila-entrada-capitana-bita {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 0.45rem;
}
.campo-capitana-bita {
  min-width: 0;
}
.boton-capitana-bita {
  width: 44px;
  min-height: 44px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  line-height: 0;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-primario);
  color: var(--color-texto-principal);
  cursor: pointer;
}
.boton-capitana-bita svg {
  display: block;
}
.icono-microfono {
  transform: translateY(1px);
}
.icono-enviar {
  transform: translate(-1px, 1px);
}
.boton-capitana-bita:disabled {
  background: var(--color-desactivado);
  cursor: not-allowed;
}
.boton-grabando {
  background: var(--color-error);
}
.estado-capitana-bita {
  margin: 0;
  color: var(--color-texto-secundario);
  font-size: 0.82rem;
}
.estado-grabando,
.estado-error {
  color: var(--color-error);
}
@media (max-width: 480px) {
  .fila-entrada-capitana-bita {
    grid-template-columns: repeat(3, 44px);
    justify-content: end;
  }
  .campo-capitana-bita {
    grid-column: 1 / -1;
    width: 100%;
  }
}
</style>
