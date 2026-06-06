<template>
  <div class="tutorial-stock">
    <p>
      <strong>1. Cargá el Excel:</strong> Stock usa las columnas de código, descripción,
      ubicación y stock de la misma base que Ubicaciones.
    </p>
    <p>
      <strong>2. Buscá y contá:</strong> escribí un código o nombre. Cuando queda una sola
      coincidencia, el artículo se selecciona automáticamente. Ajustá la cantidad con los botones
      menos y más y presioná <strong>Confirmar conteo</strong>.
    </p>
    <p>
      <strong>3. Artículos repetidos:</strong> si encontrás el mismo artículo en otro estante, Stock
      recupera el total anterior para que sumes lo nuevo sin perder el conteo.
    </p>
    <p>
      <strong>4. Importar desde Ubicaciones:</strong> crea registros pendientes con los artículos
      presentes en la tabla de Ubicaciones. El stock Excel queda como valor inicial hasta que
      confirmes cada fila.
    </p>
    <p>
      <strong>5. Editar ubicación:</strong> podés cambiarla en la tarjeta o en la fila. El movimiento
      se agrega a Ubicaciones y al historial del artículo.
    </p>
    <p>
      <strong>6. Etiquetas e informes:</strong> cada fila puede enviarse a Etiquetas con cantidad
      fija 1. Las filas confirmadas indican cuántas unidades faltan o cuántas se contaron de más
      cuando el conteo no coincide con el Excel. Información resume pendientes, artículos SL e
      inexistentes.
    </p>
    <p>
      <strong>7. Excel final:</strong> enviar o descargar genera un archivo únicamente con conteos
      confirmados e incluye la diferencia `Contado - Excel`. Una sesión queda vinculada al Excel
      con el que fue creada.
    </p>
  </div>
</template>

<style scoped>
.tutorial-stock p {
  margin: 0.75rem 0 0 0;
  color: var(--color-texto-secundario);
  line-height: 1.5;
}
.tutorial-stock strong {
  color: var(--color-texto-principal);
}
</style>
