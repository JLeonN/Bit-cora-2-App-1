<template>
  <div class="tutorial-ubicaciones">
    <p class="tutorial-descripcion">
      El módulo de <strong>Ubicaciones</strong> te ayuda a gestionar dónde están ubicados los
      artículos físicamente. Podés cargar una base de datos Excel y ajustar ubicaciones de forma
      rápida.
    </p>

    <div class="seccion-pasos">
      <h4 class="subtitulo-tutorial">
        <IconList :stroke="2" class="icono-subtitulo" />
        Pasos básicos
      </h4>

      <div class="paso">
        <div class="numero-paso">1</div>
        <div class="contenido-paso">
          <strong>Cargar base de datos:</strong> Primero, seleccioná tu archivo Excel con los
          artículos. Este archivo debe tener: Código, Nombre, Ubicación Antigua y Stock.
        </div>
      </div>

      <div class="paso">
        <div class="numero-paso">2</div>
        <div class="contenido-paso">
          <strong>Agregar ubicaciones:</strong>
          <ul class="lista-metodos">
            <li>
              <IconKeyboard :stroke="2" class="icono-inline" /> Escribí el código (el buscador te
              ayuda a encontrarlo)
            </li>
            <li>
              <IconCamera :stroke="2" class="icono-inline" /> Escaneá con la cámara para ir más
              rápido
            </li>
          </ul>
        </div>
      </div>

      <div class="paso">
        <div class="numero-paso">3</div>
        <div class="contenido-paso">
          <strong>La ubicación se recuerda:</strong> Cuando agregás un artículo, la ubicación se
          mantiene para el siguiente. Ideal para inventarios donde muchos artículos están en el
          mismo lugar.
        </div>
      </div>

      <div class="paso">
        <div class="numero-paso">4</div>
        <div class="contenido-paso">
          <strong>Enviar a etiquetas:</strong> Presioná el botón verde
          <IconTag :stroke="2" class="icono-inline" /> en cualquier artículo para generar su
          etiqueta automáticamente.
        </div>
      </div>

      <div class="paso">
        <div class="numero-paso">5</div>
        <div class="contenido-paso">
          <strong>Exportar Excel:</strong> Presioná el botón
          <IconSend :stroke="2" class="icono-inline" /> para generar un Excel con todas las
          ubicaciones, incluyendo la antigua y la nueva.
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
        <span
          ><strong>Buscador inteligente:</strong> Escribí 3 letras y el sistema te mostrará
          coincidencias priorizando códigos exactos.</span
        >
      </div>

      <div class="tip">
        <IconTrash :stroke="2" class="icono-tip" />
        <span
          ><strong>Botón de limpieza:</strong> Si cambiás de zona, usá el botón
          <IconTrash :stroke="2" class="icono-inline-small" /> para limpiar la ubicación
          recordada.</span
        >
      </div>

      <div class="tip">
        <IconAlertCircle :stroke="2" class="icono-tip" />
        <span
          ><strong>Códigos duplicados:</strong> Los artículos repetidos se resaltan en naranja para
          que los identifiques fácilmente.</span
        >
      </div>

      <div class="tip">
        <IconFileSpreadsheet :stroke="2" class="icono-tip" />
        <span
          ><strong>Sistema de emojis:</strong> En el Excel exportado, verás ✔️ si la ubicación es
          correcta y ❌ si falta o el artículo no existe.</span
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  IconList,
  IconKeyboard,
  IconCamera,
  IconTag,
  IconSend,
  IconBulb,
  IconSearch,
  IconTrash,
  IconAlertCircle,
  IconFileSpreadsheet,
} from '@tabler/icons-vue'
</script>

<style scoped>
.tutorial-ubicaciones {
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
.lista-metodos {
  list-style: none;
  padding: 0;
  margin: 8px 0 0 0;
}
.lista-metodos li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
.icono-inline {
  color: var(--color-primario);
  width: 18px;
  height: 18px;
  vertical-align: middle;
  display: inline-block;
}
.icono-inline-small {
  color: var(--color-error);
  width: 16px;
  height: 16px;
  vertical-align: middle;
  display: inline-block;
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
/* Responsive */
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
