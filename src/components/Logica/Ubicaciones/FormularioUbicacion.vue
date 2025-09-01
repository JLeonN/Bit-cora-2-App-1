<template>
  <form class="formulario" @submit.prevent="$emit('agregarUbicacion')">
    <div class="ubicacion-campo">
      <input
        v-model="modeloCodigo"
        type="text"
        :placeholder="placeholderCodigo"
        :class="{ 'input-error': errorCodigo, 'animar-error': animarErrorCodigo }"
        @animationend="$emit('update:animarErrorCodigo', false)"
        @input="$emit('restablecerPlaceholderCodigo')"
      />
    </div>

    <div class="ubicacion-campo">
      <input
        v-model="modeloUbicacion"
        type="text"
        :placeholder="placeholderUbicacion"
        :class="{ 'input-error': errorUbicacion, 'animar-error': animarErrorUbicacion }"
        @animationend="$emit('update:animarErrorUbicacion', false)"
        @input="$emit('restablecerPlaceholderUbicacion')"
      />
    </div>

    <!-- Botón agregar ubicación -->
    <div class="contenedor-boton-agregar">
      <TresBotones :textoAceptar="'Agregar'" @aceptar="$emit('agregarUbicacion')" />
    </div>
  </form>
</template>

<script setup>
import { computed } from 'vue'
import TresBotones from '../../Botones/TresBotones.vue'

const props = defineProps({
  nuevoCodigo: String,
  nuevaUbicacion: String,
  placeholderCodigo: String,
  placeholderUbicacion: String,
  errorCodigo: Boolean,
  animarErrorCodigo: Boolean,
  errorUbicacion: Boolean,
  animarErrorUbicacion: Boolean,
})

const emit = defineEmits([
  'update:nuevoCodigo',
  'update:nuevaUbicacion',
  'update:animarErrorCodigo',
  'update:animarErrorUbicacion',
  'restablecerPlaceholderCodigo',
  'restablecerPlaceholderUbicacion',
  'agregarUbicacion',
])

const modeloCodigo = computed({
  get: () => props.nuevoCodigo,
  set: (valor) => emit('update:nuevoCodigo', valor),
})

const modeloUbicacion = computed({
  get: () => props.nuevaUbicacion,
  set: (valor) => emit('update:nuevaUbicacion', valor),
})
</script>
