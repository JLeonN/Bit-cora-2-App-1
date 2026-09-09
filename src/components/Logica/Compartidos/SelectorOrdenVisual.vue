<template>
  <TarjetaSeccion
    :titulo="titulo"
    :expandida-por-defecto="false"
    :descripcion-resumen="descripcionResumen"
    :ocultar-resumen-al-expandir="true"
  >
    <p class="texto-ordenar-completa">{{ textoDetalle }}</p>
    <div class="grupo-orden-visual" role="group" :aria-label="etiquetaAccesible">
      <button
        v-for="opcion in opciones"
        :key="opcion.valor"
        type="button"
        class="pastilla-orden-visual"
        :class="{ 'pastilla-orden-activa': modelValue === opcion.valor }"
        :aria-pressed="modelValue === opcion.valor"
        @click="seleccionarOrden(opcion.valor)"
      >
        {{ opcion.etiqueta }}
      </button>
    </div>
  </TarjetaSeccion>
</template>

<script setup>
import TarjetaSeccion from '../../Configuracion/Tutoriales/TarjetaSeccion.vue'

const props = defineProps({
  titulo: { type: String, required: true },
  descripcionResumen: { type: String, required: true },
  textoDetalle: { type: String, required: true },
  etiquetaAccesible: { type: String, required: true },
  opciones: { type: Array, required: true },
  modelValue: { type: String, required: true },
})
const emit = defineEmits(['update:model-value'])

function seleccionarOrden(valor) {
  if (valor !== props.modelValue) emit('update:model-value', valor)
}
</script>

<style scoped>
.texto-ordenar-completa {
  margin: 0 0 0.8rem 0;
  color: var(--color-texto-secundario);
  font-size: 0.92rem;
  line-height: 1.4;
}
.grupo-orden-visual {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}
.pastilla-orden-visual {
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  min-height: 40px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
.pastilla-orden-visual:hover {
  border-color: var(--color-primario);
}
.pastilla-orden-activa {
  border-color: var(--color-primario);
  background: var(--color-primario);
  color: var(--color-superficie);
}
@media (max-width: 600px) {
  .grupo-orden-visual {
    display: grid;
    grid-template-columns: 1fr;
  }
  .pastilla-orden-visual {
    width: 100%;
  }
}
</style>
