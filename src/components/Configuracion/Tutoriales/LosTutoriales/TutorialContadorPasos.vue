<template>
  <div class="tutorial-pasos">
    <p class="tutorial-descripcion">
      El módulo de <strong>Contador de pasos</strong> permite monitoreo continuo en Android, con total diario y sesiones manuales.
    </p>
    <div class="seccion-pasos">
      <h4 class="subtitulo-tutorial">
        <IconList :stroke="2" class="icono-subtitulo" />
        Pasos básicos
      </h4>
      <div class="paso">
        <div class="numero-paso">1</div>
        <div class="contenido-paso"><strong>Abrir módulo:</strong> Entrá a Contador de pasos desde Inicio o el menú lateral.</div>
      </div>
      <div class="paso">
        <div class="numero-paso">2</div>
        <div class="contenido-paso"><strong>Monitoreo:</strong> Permití actividad física y notificaciones para mantener el servicio activo.</div>
      </div>
      <div class="paso">
        <div class="numero-paso">3</div>
        <div class="contenido-paso"><strong>Sesión manual:</strong> Usá Iniciar sesión y Detener sesión para medir un bloque puntual.</div>
      </div>
      <div class="paso">
        <div class="numero-paso">4</div>
        <div class="contenido-paso"><strong>Historial:</strong> Revisá diario, últimos 7/30 días y resumen mensual en la misma pantalla.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconList } from '@tabler/icons-vue'
</script>

<style scoped>
.tutorial-pasos {
  padding-top: 16px;
}
.tutorial-descripcion {
  color: var(--color-texto-secundario);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 20px 0;
}
.seccion-pasos {
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
}
.paso {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: flex-start;
}
.numero-paso {
  background: var(--color-primario);
  color: #fff;
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
}
.contenido-paso strong {
  color: var(--color-texto-principal);
}
</style>

