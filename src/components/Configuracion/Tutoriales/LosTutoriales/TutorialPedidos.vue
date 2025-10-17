<template>
  <div class="tutorial-pedidos">
    <p class="tutorial-descripcion">
      El módulo de <strong>Pedidos</strong> te permite registrar códigos de artículos de forma
      rápida usando tu cámara o ingresándolos manualmente.
    </p>

    <div class="seccion-pasos">
      <h4 class="subtitulo-tutorial">
        <IconList :stroke="2" class="icono-subtitulo" />
        Pasos básicos
      </h4>

      <div class="paso">
        <div class="numero-paso">1</div>
        <div class="contenido-paso">
          <strong>Agregar pedidos:</strong> Presioná el botón
          <IconPlus :stroke="2" class="icono-inline" /> en la barra inferior.
        </div>
      </div>

      <div class="paso">
        <div class="numero-paso">2</div>
        <div class="contenido-paso">
          <strong>Elegí tu método:</strong>
          <ul class="lista-metodos">
            <li>
              <IconKeyboard :stroke="2" class="icono-inline" /> Escribir el código manualmente
            </li>
            <li>
              <IconCamera :stroke="2" class="icono-inline" /> Escanear con la cámara (múltiples
              códigos)
            </li>
          </ul>
        </div>
      </div>

      <div class="paso">
        <div class="numero-paso">3</div>
        <div class="contenido-paso">
          <strong>Ver tus pedidos:</strong> Los últimos 3 pedidos aparecen en la pantalla principal.
          Para ver todos, accedé a "Pedidos Realizados".
        </div>
      </div>

      <div class="paso">
        <div class="numero-paso">4</div>
        <div class="contenido-paso">
          <strong>Exportar:</strong> Presioná el botón
          <IconSend :stroke="2" class="icono-inline" /> para generar un archivo Excel con todos tus
          pedidos o seleccioná un rango de fechas en "Historial".
        </div>
      </div>
    </div>

    <div class="seccion-tips">
      <h4 class="subtitulo-tutorial">
        <IconBulb :stroke="2" class="icono-subtitulo" />
        Tips útiles
      </h4>

      <div class="tip">
        <IconTrophy :stroke="2" class="icono-tip" />
        <span
          ><strong>Sistema de logros:</strong> El contador diario muestra tu productividad con
          iconos motivacionales (🔥⚡⭐💎).</span
        >
      </div>

      <div class="tip">
        <IconClock :stroke="2" class="icono-tip" />
        <span
          ><strong>Reseteo automático:</strong> El contador se reinicia a medianoche todos los
          días.</span
        >
      </div>

      <div class="tip">
        <IconEdit :stroke="2" class="icono-tip" />
        <span
          ><strong>Edición rápida:</strong> Podés editar o eliminar cualquier pedido desde la
          lista.</span
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  IconList,
  IconPlus,
  IconKeyboard,
  IconCamera,
  IconSend,
  IconBulb,
  IconTrophy,
  IconClock,
  IconEdit,
} from '@tabler/icons-vue'
</script>

<style scoped>
.tutorial-pedidos {
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
