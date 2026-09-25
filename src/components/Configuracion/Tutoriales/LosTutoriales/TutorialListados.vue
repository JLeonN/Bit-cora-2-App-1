<template>
  <div class="tutorial-listados">
    <p class="tutorial-descripcion">
      El módulo de <strong>Listados</strong> te permite preparar varias listas de artículos,
      completar stock y ubicación, enviarlas a otros módulos, exportarlas en Excel o PDF y compartirlas
      por WhatsApp.
    </p>
    <div class="seccion-pasos">
      <h4 class="subtitulo-tutorial">
        <IconList :stroke="2" class="icono-subtitulo" />
        Pasos básicos
      </h4>
      <div class="paso">
        <div class="numero-paso">1</div>
        <div class="contenido-paso">
          <strong>Administrar listados:</strong> Creá una lista nueva, asignale un nombre o duplicá
          una existente. El selector te permite cambiar entre todos tus listados guardados.
        </div>
      </div>
      <div class="paso">
        <div class="numero-paso">2</div>
        <div class="contenido-paso">
          <strong>Cargar la base maestra:</strong> Seleccioná el Excel de artículos con las columnas
          Código, Descripción, Ubicación y Stock. Esta base permite identificar y completar los
          artículos del listado.
        </div>
      </div>
      <div class="paso">
        <div class="numero-paso">3</div>
        <div class="contenido-paso">
          <strong>Agregar artículos:</strong>
          <ul class="lista-metodos">
            <li><IconSearch :stroke="2" class="icono-inline" /> Buscá por código o descripción</li>
            <li><IconCamera :stroke="2" class="icono-inline" /> Escaneá un código con la cámara</li>
            <li>
              <IconFileSpreadsheet :stroke="2" class="icono-inline" /> Usá “Cargar Excel” para
              importar las filas de otro listado
            </li>
          </ul>
        </div>
      </div>
      <div class="paso">
        <div class="numero-paso">4</div>
        <div class="contenido-paso">
          <strong>Personalizar la lista:</strong> Mostrá u ocultá numeración, stock y ubicación.
          También podés editar los valores visibles y ordenar los artículos según tu trabajo.
        </div>
      </div>
      <div class="paso">
        <div class="numero-paso">5</div>
        <div class="contenido-paso">
          <strong>Reutilizar los artículos:</strong> Enviá toda la lista a Stock o Ubicaciones, y
          mandá uno o todos los artículos a Etiquetas.
        </div>
      </div>
      <div class="paso">
        <div class="numero-paso">6</div>
        <div class="contenido-paso">
          <strong>Exportar o compartir:</strong> Elegí Excel, PDF A4 o WhatsApp y usá el botón de envío.
          Los archivos se comparten en Android y se descargan en web. WhatsApp prepara los artículos
          y las columnas visibles en partes cuando el listado es largo; abrí cada parte por separado.
        </div>
      </div>
    </div>
    <div class="seccion-tips">
      <h4 class="subtitulo-tutorial">
        <IconBulb :stroke="2" class="icono-subtitulo" />
        Tips útiles
      </h4>
      <div class="tip">
        <IconFilter :stroke="2" class="icono-tip" />
        <span
          ><strong>Contexto de búsqueda:</strong> Usá marca, modelo, año u otro dato para limitar
          las coincidencias. Cada listado conserva su propio contexto.</span
        >
      </div>
      <div class="tip">
        <IconSearch :stroke="2" class="icono-tip" />
        <span
          ><strong>Buscador inteligente:</strong> Podés escribir fragmentos en cualquier orden. Con
          la selección automática activada, una coincidencia única se agrega directamente.</span
        >
      </div>
      <div class="tip">
        <IconAlertTriangle :stroke="2" class="icono-tip" />
        <span
          ><strong>Importación controlada:</strong> Al cargar otro Excel se agregan las filas
          reconocidas y se muestra un resumen. Las ambiguas, inexistentes o inconsistentes quedan
          detalladas, pero no se agregan.</span
        >
      </div>
      <div class="tip">
        <IconCopy :stroke="2" class="icono-tip" />
        <span
          ><strong>Artículos repetidos:</strong> Si un código ya existe, la app te muestra en qué
          líneas aparece y te permite decidir si querés agregarlo nuevamente.</span
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  IconAlertTriangle,
  IconBulb,
  IconCamera,
  IconCopy,
  IconFileSpreadsheet,
  IconFilter,
  IconList,
  IconSearch,
} from '@tabler/icons-vue'
</script>

<style scoped>
.tutorial-listados {
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
  flex-shrink: 0;
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
