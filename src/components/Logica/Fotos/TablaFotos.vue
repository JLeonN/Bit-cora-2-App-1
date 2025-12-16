<template>
  <div class="contenedor-tabla">
    <!-- Header con estadísticas -->
    <div class="header-tabla">
      <h3 class="titulo-seccion">Fotos guardadas</h3>
      <div class="estadisticas-fotos">
        <span class="texto-secundario">Total: {{ fotos.length }}</span>
        <span v-if="codigosDuplicados > 0" class="texto-repetidos">
          Duplicados: {{ codigosDuplicados }}
        </span>
      </div>
    </div>

    <!-- Botón limpiar todo -->
    <div v-if="fotos.length > 0" class="contenedor-boton-borrar-todo">
      <IconTrash
        class="icono-borrar-todo"
        :size="28"
        @click="confirmarLimpiarTodo"
        title="Limpiar todas las fotos"
      />
    </div>

    <!-- Tabla (desktop) -->
    <table v-if="fotos.length > 0" class="tabla tabla-fotos tabla-desktop">
      <thead>
        <tr>
          <th class="columna-foto">Foto</th>
          <th class="columna-codigo">Código</th>
          <th class="columna-nombre">Nombre</th>
          <th class="columna-acciones">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="foto in fotos"
          :key="foto.id"
          class="fila-foto"
          :class="{ 'fila-duplicada': esDuplicado(foto.codigo) }"
        >
          <td class="celda-foto">
            <img :src="obtenerUrlFoto(foto.rutaFoto)" alt="Foto producto" class="miniatura-foto" />
          </td>
          <td class="celda-codigo">
            <span :class="{ 'texto-duplicado': esDuplicado(foto.codigo) }">
              {{ foto.codigo }}
            </span>
          </td>
          <td class="celda-nombre">
            {{ foto.nombreArticulo }}
          </td>
          <td class="celda-acciones">
            <div class="acciones-foto">
              <IconEdit
                class="icono-foto icono-editar"
                :size="20"
                @click="editarFoto(foto)"
                title="Editar código"
              />
              <IconTrash
                class="icono-foto icono-borrar"
                :size="20"
                @click="confirmarEliminar(foto)"
                title="Eliminar foto"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Cards (móvil) -->
    <div v-if="fotos.length > 0" class="contenedor-cards">
      <div
        v-for="foto in fotos"
        :key="foto.id"
        class="card-foto"
        :class="{ 'card-duplicada': esDuplicado(foto.codigo) }"
      >
        <!-- Nombre arriba de todo -->
        <div class="nombre-card-top">{{ foto.nombreArticulo }}</div>

        <!-- Contenido: foto + código + acciones -->
        <div class="contenido-card">
          <img :src="obtenerUrlFoto(foto.rutaFoto)" alt="Foto producto" class="foto-card" />

          <div class="codigo-card" :class="{ 'texto-duplicado': esDuplicado(foto.codigo) }">
            {{ foto.codigo }}
          </div>

          <div class="acciones-card">
            <IconEdit
              class="icono-card icono-editar"
              :size="24"
              @click="editarFoto(foto)"
              title="Editar código"
            />
            <IconTrash
              class="icono-card icono-borrar"
              :size="24"
              @click="confirmarEliminar(foto)"
              title="Eliminar foto"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Mensaje sin fotos -->
    <div v-else class="mensaje-vacio">
      <IconPhotoOff :size="48" />
      <p>No hay fotos guardadas</p>
      <p class="texto-secundario">Usa el botón + para comenzar</p>
    </div>

    <!-- Modal de edición -->
    <ModalEditarFoto
      v-if="mostrarModalEditar"
      :foto="fotoAEditar"
      @cerrar="mostrarModalEditar = false"
      @guardar="actualizarCodigo"
    />

    <!-- Modal de confirmación -->
    <ModalEliminar
      v-if="mostrarModalEliminar"
      :texto="textoEliminar"
      @cerrar="mostrarModalEliminar = false"
      @confirmar="ejecutarEliminacion"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { IconEdit, IconTrash, IconPhotoOff } from '@tabler/icons-vue'
import { Filesystem, Directory } from '@capacitor/filesystem'
import ModalEditarFoto from '../../Modales/ModalEditarFoto.vue'
import ModalEliminar from '../../Modales/ModalEliminar.vue'

const props = defineProps({
  fotos: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['editar-codigo', 'eliminar-foto', 'limpiar-todo'])

// Estado
const mostrarModalEditar = ref(false)
const mostrarModalEliminar = ref(false)
const fotoAEditar = ref(null)
const fotoAEliminar = ref(null)
const accionEliminar = ref('individual')

// Obtener URL de foto desde filesystem
async function obtenerUrlFoto(rutaFoto) {
  try {
    const archivo = await Filesystem.readFile({
      path: rutaFoto,
      directory: Directory.Cache,
    })
    return `data:image/jpeg;base64,${archivo.data}`
  } catch (error) {
    console.error('[TablaFotos] Error al leer foto:', error)
    return ''
  }
}

// Computed para detectar duplicados
const codigosDuplicados = computed(() => {
  const codigos = props.fotos.map((f) => f.codigo.toLowerCase())
  const duplicados = codigos.filter((codigo, index) => codigos.indexOf(codigo) !== index)
  return new Set(duplicados).size
})

// Verificar si un código está duplicado
function esDuplicado(codigo) {
  const codigoLower = codigo.toLowerCase()
  return props.fotos.filter((f) => f.codigo.toLowerCase() === codigoLower).length > 1
}

// Texto para modal eliminar
const textoEliminar = computed(() => {
  if (accionEliminar.value === 'todo') {
    return 'todas las fotos'
  }
  return fotoAEliminar.value ? `la foto ${fotoAEliminar.value.codigo}` : 'esta foto'
})

// Editar código
function editarFoto(foto) {
  fotoAEditar.value = foto
  mostrarModalEditar.value = true
}

function actualizarCodigo(id, nuevoCodigo, nuevoNombre) {
  emit('editar-codigo', id, nuevoCodigo, nuevoNombre)
  mostrarModalEditar.value = false
}

// Eliminar foto individual
function confirmarEliminar(foto) {
  fotoAEliminar.value = foto
  accionEliminar.value = 'individual'
  mostrarModalEliminar.value = true
}

// Limpiar todo
function confirmarLimpiarTodo() {
  accionEliminar.value = 'todo'
  mostrarModalEliminar.value = true
}

// Ejecutar eliminación
function ejecutarEliminacion() {
  if (accionEliminar.value === 'todo') {
    emit('limpiar-todo')
  } else if (fotoAEliminar.value) {
    emit('eliminar-foto', fotoAEliminar.value.id)
  }
  mostrarModalEliminar.value = false
  fotoAEliminar.value = null
}
</script>

<style scoped>
.header-tabla {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.titulo-seccion {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-texto-principal);
  margin: 0;
}
.estadisticas-fotos {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
}
/* TABLA DESKTOP */
.tabla-desktop {
  display: table;
}
.tabla-fotos {
  table-layout: fixed;
}
.columna-foto {
  width: 80px;
}
.columna-codigo {
  width: 25%;
}
.columna-nombre {
  width: 40%;
}
.columna-acciones {
  width: 20%;
}
.celda-foto,
.celda-codigo,
.celda-nombre,
.celda-acciones {
  word-wrap: break-word;
  overflow-wrap: break-word;
  vertical-align: middle;
}
.miniatura-foto {
  width: 60px;
  height: 45px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--color-borde);
}
.celda-acciones {
  text-align: center;
}
.acciones-foto {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
}
.icono-foto {
  cursor: pointer;
  transition: transform 0.2s ease;
}
.icono-foto:hover {
  transform: scale(1.2);
}
.icono-foto.icono-editar {
  color: var(--color-acento);
}
.icono-foto.icono-borrar {
  color: var(--color-error);
}
/* CARDS MÓVIL */
.contenedor-cards {
  display: none;
  flex-direction: column;
  gap: 1rem;
}
.card-foto {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.card-duplicada {
  background: color-mix(in oklab, var(--color-error) 10%, var(--color-superficie));
}
.nombre-card-top {
  font-size: 0.9rem;
  color: var(--color-texto-secundario);
  font-weight: 500;
  line-height: 1.3;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-borde);
}
.contenido-card {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.foto-card {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--color-borde);
  flex-shrink: 0;
}
.codigo-card {
  flex: 1;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-texto-principal);
}
.acciones-card {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}
.icono-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}
.icono-card:hover {
  transform: scale(1.1);
}
.icono-card.icono-editar {
  color: var(--color-acento);
}
.icono-card.icono-borrar {
  color: var(--color-error);
}
.mensaje-vacio {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-texto-secundario);
}
.mensaje-vacio svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}
.mensaje-vacio p {
  margin: 0.5rem 0;
}
/* RESPONSIVE */
@media (max-width: 768px) {
  .tabla-desktop {
    display: none;
  }
  .contenedor-cards {
    display: flex;
  }
}
</style>
