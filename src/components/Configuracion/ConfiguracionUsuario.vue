<template>
  <div class="configuracion-usuario">
    <form @submit.prevent="guardarNombre" class="formulario-config">
      <div class="modal-campo">
        <label for="nombreUsuario">Tu nombre</label>
        <input
          id="nombreUsuario"
          type="text"
          v-model="nombreEditado"
          :placeholder="nombreActual === 'Usua desconocido' ? 'Ingresa tu nombre' : nombreActual"
          :maxlength="50"
          @focus="mostrarMensajeAyuda = true"
          @blur="mostrarMensajeAyuda = false"
        />

        <div v-if="mostrarMensajeAyuda" class="mensaje-ayuda">
          Este nombre aparecerá en los archivos Excel que generes
        </div>
      </div>

      <!-- Información actual -->
      <div v-if="nombreActual !== 'Usua desconocido'" class="info-actual">
        <small class="texto-info">
          Nombre actual: <strong>{{ nombreActual }}</strong>
        </small>
      </div>

      <!-- Botones -->
      <div class="contenedor-botones-config">
        <button type="submit" class="boton-guardar" :disabled="!puedeGuardar">
          {{ nombreActual === 'Usua desconocido' ? 'Guardar' : 'Actualizar' }}
        </button>

        <button
          v-if="nombreActual !== 'Usua desconocido'"
          type="button"
          class="boton-limpiar"
          @click="mostrarModalConfirmacion"
        >
          Resetear
        </button>
      </div>
    </form>

    <!-- Mensaje de éxito/error -->
    <div v-if="mensajeEstado.mostrar" :class="['mensaje-estado', mensajeEstado.tipo]">
      {{ mensajeEstado.texto }}
    </div>

    <!-- NUEVA SECCIÓN: Descripción/Tutorial -->
    <div class="seccion-tutorial">
      <div class="tutorial-header">
        <IconInfoCircle :stroke="2" class="icono-info" />
        <h4 class="tutorial-titulo">¿Para qué sirve tu nombre?</h4>
      </div>
      <div class="tutorial-contenido">
        <p class="tutorial-parrafo">
          El nombre que configures aquí se usará para
          <strong>personalizar todos los archivos</strong> que exportes desde la aplicación:
        </p>
        <ul class="tutorial-lista">
          <li>
            <IconFileSpreadsheet :stroke="2" class="icono-lista" />
            <span><strong>Pedidos:</strong> "Pedi [Tu Nombre] - fecha.xlsx"</span>
          </li>
          <li>
            <IconFileSpreadsheet :stroke="2" class="icono-lista" />
            <span><strong>Ubicaciones:</strong> "Ubic [Tu Nombre].xlsx"</span>
          </li>
          <li>
            <IconFileTypePdf :stroke="2" class="icono-lista" />
            <span><strong>Etiquetas:</strong> "Etiquetas - [Tu Nombre] - tamaño.pdf"</span>
          </li>
        </ul>
        <p class="tutorial-nota">
          💡 <strong>Tip:</strong> Usá un nombre corto y descriptivo para identificar fácilmente tus
          archivos.
        </p>
      </div>
    </div>

    <!-- Modal de confirmación para resetear -->
    <ModalEliminar
      v-if="mostrarModal"
      texto="tu nombre de usuario"
      @cerrar="cerrarModal"
      @confirmar="confirmarLimpieza"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  guardarNombreUsuario,
  obtenerNombreUsuario,
  limpiarConfiguracionUsuario,
} from '../BaseDeDatos/usoAlmacenamientoConfiguracion'
import ModalEliminar from '../Modales/ModalEliminar.vue'
import { IconInfoCircle, IconFileSpreadsheet, IconFileTypePdf } from '@tabler/icons-vue'

const nombreEditado = ref('')
const nombreActual = ref('Usua desconocido')
const mostrarMensajeAyuda = ref(false)
const mostrarModal = ref(false)

const mensajeEstado = ref({
  mostrar: false,
  tipo: '', // 'exito' o 'error'
  texto: '',
})

// Computadas
const puedeGuardar = computed(() => {
  const nombre = nombreEditado.value.trim()
  return nombre.length >= 2 && nombre !== nombreActual.value
})

// Métodos
const cargarNombreActual = async () => {
  nombreActual.value = await obtenerNombreUsuario()
  // Input siempre empieza vacío, el nombre actual se muestra como placeholder
  nombreEditado.value = ''
}

const guardarNombre = async () => {
  if (!puedeGuardar.value) return

  const exito = await guardarNombreUsuario(nombreEditado.value)

  if (exito) {
    nombreActual.value = nombreEditado.value.trim()
    nombreEditado.value = '' // Limpiar input después de guardar
    mostrarMensaje('exito', '¡Nombre guardado correctamente!')

    // Emitir evento para que el MainLayout se actualice
    emit('nombre-actualizado', nombreActual.value)
  } else {
    mostrarMensaje('error', 'Error al guardar el nombre')
  }
}

const mostrarModalConfirmacion = () => {
  mostrarModal.value = true
}

const cerrarModal = () => {
  mostrarModal.value = false
}

const confirmarLimpieza = async () => {
  const exito = await limpiarConfiguracionUsuario()

  if (exito) {
    nombreActual.value = 'Usua desconocido'
    nombreEditado.value = ''
    mostrarMensaje('exito', 'Nombre reseteado correctamente')

    emit('nombre-actualizado', nombreActual.value)
  } else {
    mostrarMensaje('error', 'Error al resetear el nombre')
  }

  cerrarModal()
}

const mostrarMensaje = (tipo, texto) => {
  mensajeEstado.value = { mostrar: true, tipo, texto }
  setTimeout(() => {
    mensajeEstado.value.mostrar = false
  }, 3000)
}

// Eventos
const emit = defineEmits(['nombre-actualizado'])

// Ciclo de vida
onMounted(() => {
  cargarNombreActual()
})
</script>

<style scoped>
.configuracion-usuario {
  width: 100%;
}
.formulario-config {
  background: var(--color-superficie);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}
.mensaje-ayuda {
  color: var(--color-texto-secundario);
  font-size: 12px;
  margin-top: 5px;
  opacity: 0.8;
}
.info-actual {
  margin: 15px 0;
  padding: 10px;
  background: var(--color-fondo);
  border-radius: 8px;
}
.texto-info {
  color: var(--color-texto-secundario);
}
.contenedor-botones-config {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.boton-guardar,
.boton-limpiar {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}
.boton-guardar {
  background: var(--color-primario);
  color: white;
}
.boton-guardar:hover:not(:disabled) {
  background: var(--color-primario-claro);
}
.boton-guardar:disabled {
  background: var(--color-desactivado);
  cursor: not-allowed;
}
.boton-limpiar {
  background: var(--color-error);
  color: white;
}
.boton-limpiar:hover {
  opacity: 0.8;
}
.mensaje-estado {
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  margin-bottom: 20px;
}
.mensaje-estado.exito {
  background: var(--color-exito);
  color: white;
}
.mensaje-estado.error {
  background: var(--color-error);
  color: white;
}
/* NUEVA SECCIÓN: Tutorial */
.seccion-tutorial {
  background: var(--color-fondo);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
}
.tutorial-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}
.icono-info {
  color: var(--color-acento);
  flex-shrink: 0;
}
.tutorial-titulo {
  margin: 0;
  color: var(--color-texto-principal);
  font-size: 16px;
  font-weight: 600;
}
.tutorial-contenido {
  color: var(--color-texto-secundario);
  line-height: 1.6;
}
.tutorial-parrafo {
  margin: 0 0 15px 0;
  font-size: 14px;
}
.tutorial-lista {
  list-style: none;
  padding: 0;
  margin: 0 0 15px 0;
}
.tutorial-lista li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 14px;
}
.icono-lista {
  color: var(--color-primario);
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}
.tutorial-nota {
  margin: 0;
  padding: 12px;
  background: rgba(30, 136, 229, 0.1);
  border-left: 3px solid var(--color-primario);
  border-radius: 4px;
  font-size: 13px;
  color: var(--color-texto-principal);
}
/* Responsive */
@media (max-width: 600px) {
  .configuracion-usuario {
    padding: 0;
  }
  .contenedor-botones-config {
    flex-direction: column;
  }
  .formulario-config,
  .seccion-tutorial {
    padding: 15px;
  }
  .tutorial-titulo {
    font-size: 14px;
  }
  .tutorial-parrafo,
  .tutorial-lista li {
    font-size: 13px;
  }
}
</style>
