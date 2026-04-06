<template>
  <div class="tutorial-consulta">
    <p class="tutorial-descripcion">
      El módulo de <strong>Consulta De Ubicación</strong> permite buscar un artículo por código,
      nombre o escaneo para ver su ubicación actual y actualizarla si es necesario.
    </p>

    <div class="seccion-pasos">
      <h4 class="subtitulo-tutorial">
        <IconList :stroke="2" class="icono-subtitulo" />
        Pasos básicos
      </h4>

      <div class="paso">
        <div class="numero-paso">1</div>
        <div class="contenido-paso">
          <strong>Cargar Excel:</strong> Si no hay base cargada, el módulo muestra el selector para
          cargar el archivo con columnas A Código, B Descripción, C Ubicación y D Stock.
        </div>
      </div>

      <div class="paso">
        <div class="numero-paso">2</div>
        <div class="contenido-paso">
          <strong>Buscar artículo:</strong> Escribí código o nombre y seleccioná desde el buscador
          inteligente, o usá la cámara para escanear.
        </div>
      </div>

      <div class="paso">
        <div class="numero-paso">3</div>
        <div class="contenido-paso">
          <strong>Revisar resultado:</strong> La ubicación aparece destacada, seguida del nombre y
          el código del artículo.
        </div>
      </div>

      <div class="paso">
        <div class="numero-paso">4</div>
        <div class="contenido-paso">
          <strong>Actualizar ubicación:</strong> Presioná "Actualizar ubicación", escribí el nuevo
          valor y guardá.
        </div>
      </div>

      <div class="paso">
        <div class="numero-paso">5</div>
        <div class="contenido-paso">
          <strong>Impacto del guardado:</strong> Se actualiza la base cargada, se refleja en la
          consulta y también se agrega en Ubicaciones para enviar/exportar.
        </div>
      </div>
    </div>

    <div class="seccion-tips">
      <h4 class="subtitulo-tutorial">
        <IconBulb :stroke="2" class="icono-subtitulo" />
        Tips útiles
      </h4>

      <div class="tip">
        <IconSearch :stroke="2" class="icono-tip" />
        <span><strong>Búsqueda rápida:</strong> Con 3 caracteres ya aparecen sugerencias.</span>
      </div>

      <div class="tip">
        <IconCamera :stroke="2" class="icono-tip" />
        <span
          ><strong>Escaneo directo:</strong> Si escaneás varios códigos, se usa el primero para la
          consulta inmediata.</span
        >
      </div>

      <div class="tip">
        <IconMapPin :stroke="2" class="icono-tip" />
        <span
          ><strong>Formato recomendado:</strong> Escribí ubicación en mayúsculas para mantener
          consistencia.</span
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconList, IconBulb, IconSearch, IconCamera, IconMapPin } from '@tabler/icons-vue'
</script>

<style scoped>
.tutorial-consulta {
  padding-top: 16px;
}
.tutorial-descripcion {
  color: var(--color-texto-secundario);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 20px 0;
}
.seccion-pasos,
.seccion-tips {
  margin-bottom: 24px;
}
.subtitulo-tutorial {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-texto-principal);
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 16px 0;
}
.icono-subtitulo {
  color: var(--color-acento);
  flex-shrink: 0;
}
.paso {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: flex-start;
}
.numero-paso {
  background: var(--color-primario);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}
.contenido-paso {
  color: var(--color-texto-secundario);
  font-size: 14px;
  line-height: 1.6;
  flex: 1;
}
.contenido-paso strong {
  color: var(--color-texto-principal);
}
.tip {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(30, 136, 229, 0.05);
  border-left: 3px solid var(--color-primario);
  border-radius: 6px;
  margin-bottom: 12px;
  align-items: flex-start;
}
.tip:last-child {
  margin-bottom: 0;
}
.icono-tip {
  color: var(--color-acento);
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}
.tip span {
  color: var(--color-texto-secundario);
  font-size: 13px;
  line-height: 1.5;
  flex: 1;
}
.tip strong {
  color: var(--color-texto-principal);
}
@media (max-width: 600px) {
  .tutorial-descripcion,
  .contenido-paso {
    font-size: 13px;
  }
  .subtitulo-tutorial {
    font-size: 14px;
  }
  .numero-paso {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }
  .tip span {
    font-size: 12px;
  }
}
</style>
