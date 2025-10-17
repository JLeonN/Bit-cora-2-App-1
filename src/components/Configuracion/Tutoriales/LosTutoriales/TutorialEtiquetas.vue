<template>
  <div class="tutorial-etiquetas">
    <p class="tutorial-descripcion">
      El módulo de <strong>Etiquetas</strong> te permite generar etiquetas profesionales con códigos
      de barras en formato Code 39, listas para imprimir en diferentes tamaños.
    </p>

    <div class="seccion-pasos">
      <h4 class="subtitulo-tutorial">
        <IconList :stroke="2" class="icono-subtitulo" />
        Pasos básicos
      </h4>

      <div class="paso">
        <div class="numero-paso">1</div>
        <div class="contenido-paso">
          <strong>Tamaño de etiqueta:</strong> Actualmente solo está disponible el tamaño 10x15cm.
          Más tamaños estarán disponibles próximamente.
        </div>
      </div>

      <div class="paso">
        <div class="numero-paso">2</div>
        <div class="contenido-paso">
          <strong>Agregar etiquetas:</strong>
          <ul class="lista-metodos">
            <li><IconKeyboard :stroke="2" class="icono-inline" /> Escribí el código manualmente</li>
            <li>
              <IconCamera :stroke="2" class="icono-inline" /> Escaneá múltiples códigos con la
              cámara
            </li>
            <li>
              <IconTag :stroke="2" class="icono-inline" /> Recibí etiquetas desde el módulo de
              Ubicaciones
            </li>
          </ul>
        </div>
      </div>

      <div class="paso">
        <div class="numero-paso">3</div>
        <div class="contenido-paso">
          <strong>Autocompletado inteligente:</strong> Si tenés la base de datos cargada, la
          descripción y ubicación se completan automáticamente al seleccionar un artículo.
        </div>
      </div>

      <div class="paso">
        <div class="numero-paso">4</div>
        <div class="contenido-paso">
          <strong>Ajustar copias:</strong> Usá los botones +/- para indicar cuántas copias querés de
          cada etiqueta (útil para inventarios grandes).
        </div>
      </div>

      <div class="paso">
        <div class="numero-paso">5</div>
        <div class="contenido-paso">
          <strong>Generar PDF:</strong> Presioná el botón
          <IconSend :stroke="2" class="icono-inline" /> para crear un documento PDF con todas las
          etiquetas listas para imprimir.
        </div>
      </div>
    </div>

    <div class="seccion-tips">
      <h4 class="subtitulo-tutorial">
        <IconBulb :stroke="2" class="icono-subtitulo" />
        Tips útiles
      </h4>

      <div class="tip">
        <IconBarcode :stroke="2" class="icono-tip" />
        <span
          ><strong>Código de barras Code 39:</strong> Es el formato estándar industrial, compatible
          con cualquier escáner de códigos de barras.</span
        >
      </div>

      <div class="tip">
        <IconAdjustments :stroke="2" class="icono-tip" />
        <span
          ><strong>Tamaños automáticos:</strong> El sistema ajusta el tamaño de la fuente del código
          y descripción según su longitud para mejor legibilidad.</span
        >
      </div>

      <div class="tip">
        <IconAlertCircle :stroke="2" class="icono-tip" />
        <span
          ><strong>Códigos duplicados:</strong> Se resaltan en naranja. Es normal tener duplicados
          si necesitás varias etiquetas del mismo artículo.</span
        >
      </div>

      <div class="tip">
        <IconInfoCircle :stroke="2" class="icono-tip" />
        <span
          ><strong>Artículos nuevos:</strong> Los códigos que no existen en la base de datos se
          marcan en rojo, pero podés agregarlos igual (útil para productos nuevos).</span
        >
      </div>

      <div class="tip">
        <IconClock :stroke="2" class="icono-tip" />
        <span
          ><strong>Las etiquetas persisten:</strong> Después de generar el PDF, las etiquetas NO se
          borran automáticamente. Podés seguir generando más documentos o editarlas.</span
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
  IconBarcode,
  IconAdjustments,
  IconAlertCircle,
  IconInfoCircle,
  IconClock,
} from '@tabler/icons-vue'
</script>

<style scoped>
.tutorial-etiquetas {
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
