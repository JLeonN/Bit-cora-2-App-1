<template>
  <div class="contenedor-tabla">
    <form @submit.prevent="agregarEtiqueta" class="formulario-etiqueta">
      <!-- Campo Código con buscador integrado -->
      <div class="campo-con-buscador">
        <label for="codigo-etiqueta">Código del artículo</label>
        <div class="input-con-boton">
          <input
            id="codigo-etiqueta"
            ref="inputCodigo"
            type="text"
            v-model="codigoIngresado"
            placeholder="Escaneá o ingresá el código"
            @input="manejarBusqueda"
            @focus="mostrarResultados = true"
            :class="{ 'input-error': mostrarErrorCodigo, 'animar-error': animarErrorCodigo }"
          />
          <button type="button" class="boton-camara" @click="abrirCamara" title="Escanear código">
            <IconCamera :stroke="2" />
          </button>
        </div>

        <!-- Buscador integrado -->
        <CodigoMasNombre
          v-if="mostrarResultados && codigoIngresado.length >= 3"
          :termino-busqueda="codigoIngresado"
          @seleccionar-articulo="seleccionarArticulo"
        />
      </div>

      <!-- Campo Descripción (autocompletado) -->
      <div class="campo-formulario">
        <label for="descripcion-etiqueta">Descripción</label>
        <input
          id="descripcion-etiqueta"
          type="text"
          v-model="descripcionIngresada"
          placeholder="Descripción del artículo"
          :class="{ 'input-error': mostrarErrorDescripcion }"
        />
      </div>

      <!-- Campo Ubicación (autocompletado) -->
      <div class="campo-formulario">
        <label for="ubicacion-etiqueta">Ubicación</label>
        <input
          id="ubicacion-etiqueta"
          type="text"
          v-model="ubicacionIngresada"
          placeholder="Ubicación en depósito"
        />
      </div>

      <!-- Campo Cantidad de copias -->
      <div class="campo-formulario">
        <label for="cantidad-copias">Cantidad de copias</label>
        <input
          id="cantidad-copias"
          type="number"
          min="1"
          v-model.number="cantidadCopias"
          placeholder="1"
          :class="{ 'input-error': mostrarErrorCantidad }"
        />
      </div>

      <!-- Botón Agregar -->
      <button type="submit" class="boton-agregar-etiqueta">
        <IconPlus :stroke="2" />
        Agregar
      </button>
    </form>

    <!-- Modal Cámara -->
    <CamaraEscaneo
      v-if="mostrarCamara"
      @cancelar="cerrarCamara"
      @finalizar="procesarCodigosEscaneados"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { IconCamera, IconPlus } from '@tabler/icons-vue'
import CodigoMasNombre from '../Ubicaciones/CodigoMasNombre.vue'
import CamaraEscaneo from '../Ubicaciones/CamaraEscaneo.vue'
import { obtenerArticulosCargados } from '../../BaseDeDatos/LectorExcel.js'

const emit = defineEmits(['agregar-etiqueta'])

// --- ESTADO REACTIVO ---
const codigoIngresado = ref('')
const descripcionIngresada = ref('')
const ubicacionIngresada = ref('')
const cantidadCopias = ref(1)

const mostrarResultados = ref(false)
const mostrarCamara = ref(false)

// Estados de error
const mostrarErrorCodigo = ref(false)
const mostrarErrorDescripcion = ref(false)
const mostrarErrorCantidad = ref(false)
const animarErrorCodigo = ref(false)

// Referencia al input
const inputCodigo = ref(null)

// --- FUNCIONES ---

// Manejar búsqueda en tiempo real
function manejarBusqueda() {
  mostrarErrorCodigo.value = false
  if (codigoIngresado.value.length >= 3) {
    mostrarResultados.value = true
  } else {
    mostrarResultados.value = false
  }
}

// Seleccionar artículo del buscador
function seleccionarArticulo(articulo) {
  codigoIngresado.value = articulo.codigo
  descripcionIngresada.value = articulo.nombre

  // Buscar ubicación del artículo en la base de datos
  const articuloCompleto = obtenerArticulosCargados().find(
    (a) => a.codigo.toLowerCase() === articulo.codigo.toLowerCase(),
  )

  if (articuloCompleto?.ubicacionAntigua) {
    ubicacionIngresada.value = articuloCompleto.ubicacionAntigua
  }

  mostrarResultados.value = false

  // Focus en cantidad
  document.getElementById('cantidad-copias')?.focus()
}

// Abrir cámara
function abrirCamara() {
  mostrarCamara.value = true
}

// Cerrar cámara
function cerrarCamara() {
  mostrarCamara.value = false
}

// Procesar códigos escaneados
function procesarCodigosEscaneados(codigos) {
  if (codigos.length > 0) {
    // Tomar el primer código escaneado
    const codigoEscaneado = codigos[0]
    codigoIngresado.value = codigoEscaneado

    // Buscar artículo en base de datos
    const articuloEncontrado = obtenerArticulosCargados().find(
      (a) => a.codigo.toLowerCase() === codigoEscaneado.toLowerCase(),
    )

    if (articuloEncontrado) {
      descripcionIngresada.value = articuloEncontrado.nombre
      if (articuloEncontrado.ubicacionAntigua) {
        ubicacionIngresada.value = articuloEncontrado.ubicacionAntigua
      }
    }
  }

  cerrarCamara()

  // Focus en cantidad
  document.getElementById('cantidad-copias')?.focus()
}

// Validar y agregar etiqueta
function agregarEtiqueta() {
  // Resetear errores
  mostrarErrorCodigo.value = false
  mostrarErrorDescripcion.value = false
  mostrarErrorCantidad.value = false
  animarErrorCodigo.value = false

  // Validaciones
  if (!codigoIngresado.value.trim()) {
    mostrarErrorCodigo.value = true
    animarErrorCodigo.value = true
    setTimeout(() => (animarErrorCodigo.value = false), 500)
    inputCodigo.value?.focus()
    return
  }

  if (!descripcionIngresada.value.trim()) {
    mostrarErrorDescripcion.value = true
    return
  }

  if (!cantidadCopias.value || cantidadCopias.value < 1) {
    mostrarErrorCantidad.value = true
    return
  }

  // Emitir etiqueta
  emit('agregar-etiqueta', {
    codigo: codigoIngresado.value.trim().toUpperCase(),
    descripcion: descripcionIngresada.value.trim(),
    ubicacion: ubicacionIngresada.value.trim() || 'Sin ubicación',
    cantidad: cantidadCopias.value,
  })

  // Limpiar formulario
  limpiarFormulario()
}

// Limpiar formulario
function limpiarFormulario() {
  codigoIngresado.value = ''
  descripcionIngresada.value = ''
  ubicacionIngresada.value = ''
  cantidadCopias.value = 1
  mostrarResultados.value = false
  inputCodigo.value?.focus()
}

// Cerrar resultados al hacer clic fuera
watch(mostrarResultados, (nuevo) => {
  if (nuevo) {
    setTimeout(() => {
      document.addEventListener('click', cerrarResultadosFuera)
    }, 100)
  } else {
    document.removeEventListener('click', cerrarResultadosFuera)
  }
})

function cerrarResultadosFuera(event) {
  const contenedor = event.target.closest('.campo-con-buscador')
  if (!contenedor) {
    mostrarResultados.value = false
  }
}
</script>

<style scoped>
.contenedor-tabla {
  background-color: var(--color-superficie);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  margin-bottom: 1.5rem;
}
.formulario-etiqueta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.campo-con-buscador {
  grid-column: 1 / -1;
  position: relative;
  z-index: 50;
}
.campo-formulario {
  display: flex;
  flex-direction: column;
}
.campo-formulario label,
.campo-con-buscador label {
  margin-bottom: 0.5rem;
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
  font-weight: 500;
}
.campo-formulario input,
.campo-con-buscador input {
  padding: 0.75rem;
  border: 1px solid var(--color-borde);
  background-color: var(--color-fondo);
  color: var(--color-texto-principal);
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}
.campo-formulario input:focus,
.campo-con-buscador input:focus {
  outline: none;
  border-color: var(--color-primario);
}
.input-con-boton {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.input-con-boton input {
  flex: 1;
}
.boton-camara {
  padding: 0.75rem;
  background: transparent;
  border: 1px solid var(--color-borde);
  border-radius: 6px;
  color: var(--color-texto-principal);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.boton-camara:hover {
  background: var(--color-fondo);
  border-color: var(--color-primario);
  color: var(--color-primario);
}
.boton-agregar-etiqueta {
  grid-column: 1 / -1;
  padding: 0.9rem;
  background-color: var(--color-exito);
  color: var(--color-texto-principal);
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
}
.boton-agregar-etiqueta:hover {
  background-color: var(--color-exito);
  filter: brightness(1.1);
  transform: translateY(-2px);
}
/* Estados de error */
.input-error {
  border-color: var(--color-error) !important;
}
.input-error::placeholder {
  color: var(--color-error);
  opacity: 0.7;
}
@keyframes sacudida {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-5px);
  }
  40% {
    transform: translateX(5px);
  }
  60% {
    transform: translateX(-5px);
  }
  80% {
    transform: translateX(5px);
  }
}
.animar-error {
  animation: sacudida 0.5s;
}
/* Responsive */
@media (max-width: 768px) {
  .formulario-etiqueta {
    grid-template-columns: 1fr;
  }
  .campo-con-buscador {
    grid-column: 1;
  }
}
@media (max-width: 600px) {
  .contenedor-tabla {
    padding: 1rem;
  }
  .boton-agregar-etiqueta {
    font-size: 0.95rem;
    padding: 0.8rem;
  }
}
</style>
