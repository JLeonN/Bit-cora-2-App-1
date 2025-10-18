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

    <!-- NUEVA SECCIÓN: Botón VIP -->
    <div class="seccion-vip">
      <button v-if="!esUsuarioVIP" type="button" class="boton-vip" @click="abrirDialogVIP">
        <IconDiamond :stroke="2" class="icono-vip" />
        <span>Acceso Premium</span>
      </button>

      <!-- Estado VIP activo -->
      <div v-else class="vip-activo">
        <IconCircleCheck :stroke="2" class="icono-check" />
        <span class="texto-vip-activo">Acceso Premium Activo</span>
        <button type="button" class="boton-desactivar-vip" @click="desactivarVIP">
          Desactivar
        </button>
      </div>
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

    <!-- NUEVO: Dialog para ingresar clave VIP -->
    <q-dialog v-model="dialogVIPAbierto" persistent>
      <q-card class="dialog-vip">
        <q-card-section class="dialog-header">
          <div class="dialog-titulo">
            <IconDiamond :stroke="2" class="icono-dialog" />
            <h3>Acceso Premium</h3>
          </div>
        </q-card-section>

        <q-card-section>
          <p class="dialog-descripcion">
            Ingresá tu clave de acceso premium para disfrutar de la aplicación sin publicidad.
          </p>

          <div class="modal-campo">
            <label for="claveVIP">Clave de acceso</label>
            <input
              id="claveVIP"
              type="text"
              v-model="claveIngresada"
              placeholder="Ingresa tu clave premium"
              @keyup.enter="validarYGuardarClave"
            />
          </div>

          <div v-if="errorClaveVIP" class="mensaje-error-clave">
            {{ errorClaveVIP }}
          </div>
        </q-card-section>

        <q-card-actions class="dialog-acciones">
          <button type="button" class="boton-cancelar-dialog" @click="cerrarDialogVIP">
            Cancelar
          </button>
          <button
            type="button"
            class="boton-validar-dialog"
            @click="validarYGuardarClave"
            :disabled="!claveIngresada.trim()"
          >
            Validar
          </button>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  guardarNombreUsuario,
  obtenerNombreUsuario,
  limpiarConfiguracionUsuario,
} from '../BaseDeDatos/usoAlmacenamientoConfiguracion'
import {
  validarClaveVIP,
  guardarClaveVIP,
  tieneAccesoVIP,
  eliminarClaveVIP,
} from '../BaseDeDatos/usoAlmacenamientoVIP'
import ModalEliminar from '../Modales/ModalEliminar.vue'
import {
  IconInfoCircle,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconDiamond,
  IconCircleCheck,
} from '@tabler/icons-vue'

const nombreEditado = ref('')
const nombreActual = ref('Usua desconocido')
const mostrarMensajeAyuda = ref(false)
const mostrarModal = ref(false)

const mensajeEstado = ref({
  mostrar: false,
  tipo: '', // 'exito' o 'error'
  texto: '',
})

// Estados VIP
const dialogVIPAbierto = ref(false)
const claveIngresada = ref('')
const errorClaveVIP = ref('')
const esUsuarioVIP = ref(false)

// Computadas
const puedeGuardar = computed(() => {
  const nombre = nombreEditado.value.trim()
  return nombre.length >= 2 && nombre !== nombreActual.value
})

// Métodos
const cargarNombreActual = async () => {
  nombreActual.value = await obtenerNombreUsuario()
  nombreEditado.value = ''
}

const guardarNombre = async () => {
  if (!puedeGuardar.value) return

  const exito = await guardarNombreUsuario(nombreEditado.value)

  if (exito) {
    nombreActual.value = nombreEditado.value.trim()
    nombreEditado.value = ''
    mostrarMensaje('exito', '¡Nombre guardado correctamente!')
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

// Métodos VIP
const verificarEstadoVIP = async () => {
  esUsuarioVIP.value = await tieneAccesoVIP()
}

const abrirDialogVIP = () => {
  dialogVIPAbierto.value = true
  claveIngresada.value = ''
  errorClaveVIP.value = ''
}

const cerrarDialogVIP = () => {
  dialogVIPAbierto.value = false
  claveIngresada.value = ''
  errorClaveVIP.value = ''
}

const validarYGuardarClave = async () => {
  const clave = claveIngresada.value.trim()

  if (!clave) {
    errorClaveVIP.value = 'Por favor ingresá una clave'
    return
  }

  // Validar clave
  if (!validarClaveVIP(clave)) {
    errorClaveVIP.value = 'Clave incorrecta. Verificá e intentá nuevamente.'
    return
  }

  // Guardar clave
  const exito = await guardarClaveVIP(clave)

  if (exito) {
    esUsuarioVIP.value = true
    cerrarDialogVIP()
    mostrarMensaje('exito', '¡Acceso Premium activado! Reiniciá la app para quitar la publicidad.')
  } else {
    errorClaveVIP.value = 'Error al activar el acceso premium. Intentá de nuevo.'
  }
}

const desactivarVIP = async () => {
  const exito = await eliminarClaveVIP()

  if (exito) {
    esUsuarioVIP.value = false
    mostrarMensaje('exito', 'Acceso Premium desactivado. Reiniciá la app para ver los cambios.')
  } else {
    mostrarMensaje('error', 'Error al desactivar el acceso premium')
  }
}

// Eventos
const emit = defineEmits(['nombre-actualizado'])

// Ciclo de vida
onMounted(() => {
  cargarNombreActual()
  verificarEstadoVIP()
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
/* NUEVA SECCIÓN VIP */
.seccion-vip {
  margin-bottom: 20px;
}
.boton-vip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
.boton-vip:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}
.icono-vip {
  flex-shrink: 0;
}
.vip-activo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-superficie);
  border-radius: 12px;
  border: 2px solid var(--color-exito);
}
.icono-check {
  color: var(--color-exito);
  flex-shrink: 0;
}
.texto-vip-activo {
  flex: 1;
  color: var(--color-texto-principal);
  font-weight: 600;
}
.boton-desactivar-vip {
  padding: 8px 16px;
  background: var(--color-error);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.3s ease;
}
.boton-desactivar-vip:hover {
  opacity: 0.8;
}
/* Dialog VIP */
.dialog-vip {
  min-width: 320px;
  max-width: 400px;
  background: var(--color-superficie);
  border-radius: 12px;
}
.dialog-header {
  padding: 20px 20px 10px 20px;
}
.dialog-titulo {
  display: flex;
  align-items: center;
  gap: 12px;
}
.icono-dialog {
  color: #667eea;
  flex-shrink: 0;
}
.dialog-titulo h3 {
  margin: 0;
  color: var(--color-texto-principal);
  font-size: 20px;
  font-weight: 600;
}
.dialog-descripcion {
  color: var(--color-texto-secundario);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 20px 0;
}
.mensaje-error-clave {
  margin-top: 10px;
  padding: 10px;
  background: rgba(244, 67, 54, 0.1);
  color: var(--color-error);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}
.dialog-acciones {
  padding: 0 20px 20px 20px;
  display: flex;
  gap: 10px;
}
.boton-cancelar-dialog,
.boton-validar-dialog {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.boton-cancelar-dialog {
  background: var(--color-fondo);
  color: var(--color-texto-principal);
}
.boton-cancelar-dialog:hover {
  background: var(--color-borde);
}
.boton-validar-dialog {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.boton-validar-dialog:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
.boton-validar-dialog:disabled {
  background: var(--color-desactivado);
  cursor: not-allowed;
}
/* SECCIÓN TUTORIAL */
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
  .dialog-vip {
    min-width: 280px;
  }
}
</style>
