<template>
  <div class="tutorial-stock">
    <p class="tutorial-descripcion">
      El módulo de <strong>Stock</strong> te permite contar artículos usando la misma base Excel de
      Ubicaciones, comparar el resultado y exportar únicamente los conteos confirmados.
    </p>
    <div class="seccion-pasos">
      <h4 class="subtitulo-tutorial">
        <IconList :stroke="2" class="icono-subtitulo" />
        Pasos básicos
      </h4>
      <div class="paso">
        <div class="numero-paso">1</div>
        <div class="contenido-paso">
          <strong>Cargar la base de datos:</strong> Usá el mismo Excel de Ubicaciones con las
          columnas Código, Descripción, Ubicación y Stock.
        </div>
      </div>
      <div class="paso">
        <div class="numero-paso">2</div>
        <div class="contenido-paso">
          <strong>Agregar artículos:</strong>
          <ul class="lista-metodos">
            <li>
              <IconSearch :stroke="2" class="icono-inline" /> Buscá por código o nombre del artículo
            </li>
            <li>
              <IconDatabaseImport :stroke="2" class="icono-inline" /> Importá los artículos que ya
              agregaste en Ubicaciones
            </li>
          </ul>
        </div>
      </div>
      <div class="paso">
        <div class="numero-paso">3</div>
        <div class="contenido-paso">
          <strong>Realizar el conteo:</strong> Ajustá la cantidad con los botones de menos y más o
          escribila manualmente. También podés registrar cantidades negativas.
        </div>
      </div>
      <div class="paso">
        <div class="numero-paso">4</div>
        <div class="contenido-paso">
          <strong>Revisar la ubicación:</strong> El campo muestra la ubicación actual o la del Excel.
          Si la cambiás, también se registra el movimiento en Ubicaciones.
        </div>
      </div>
      <div class="paso">
        <div class="numero-paso">5</div>
        <div class="contenido-paso">
          <strong>Confirmar el conteo:</strong> Presioná el botón
          <IconCheck :stroke="2" class="icono-inline" /> cuando termines. Los artículos importados
          quedan pendientes hasta que los confirmes.
        </div>
      </div>
      <div class="paso">
        <div class="numero-paso">6</div>
        <div class="contenido-paso">
          <strong>Editar o enviar a Etiquetas:</strong> Desde cada tarjeta podés corregir cantidad y
          ubicación, o usar el botón <IconTag :stroke="2" class="icono-inline" /> para enviar el
          artículo a Etiquetas.
        </div>
      </div>
      <div class="paso">
        <div class="numero-paso">7</div>
        <div class="contenido-paso">
          <strong>Exportar Excel:</strong> Presioná el botón
          <IconSend :stroke="2" class="icono-inline" /> para generar un archivo con los conteos
          confirmados, sus ubicaciones y las diferencias encontradas.
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
          ><strong>Búsqueda inteligente:</strong> Cuando queda una sola coincidencia, el artículo se
          selecciona automáticamente para acelerar el conteo.</span
        >
      </div>
      <div class="tip">
        <IconAlertCircle :stroke="2" class="icono-tip" />
        <span
          ><strong>Artículos repetidos:</strong> Si volvés a encontrar el mismo artículo, Stock
          recupera el último total para que puedas seguir sumando.</span
        >
      </div>
      <div class="tip">
        <IconEdit :stroke="2" class="icono-tip" />
        <span
          ><strong>Diferencias visibles:</strong> Las tarjetas confirmadas indican si faltan
          unidades o si se contaron unidades adicionales respecto al Excel.</span
        >
      </div>
      <div class="tip">
        <IconMapPin :stroke="2" class="icono-tip" />
        <span
          ><strong>Alerta SL:</strong> Los artículos cuya ubicación actual es SL se destacan para
          que puedas revisarlos antes de terminar.</span
        >
      </div>
      <div class="tip">
        <IconFileSpreadsheet :stroke="2" class="icono-tip" />
        <span
          ><strong>Excel final:</strong> Solo se exportan los artículos confirmados. Los pendientes
          permanecen guardados para continuar el conteo.</span
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  IconList,
  IconSearch,
  IconDatabaseImport,
  IconCheck,
  IconTag,
  IconSend,
  IconBulb,
  IconAlertCircle,
  IconEdit,
  IconMapPin,
  IconFileSpreadsheet,
} from '@tabler/icons-vue'
</script>

<style scoped>
.tutorial-stock {
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
