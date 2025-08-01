<template>
  <div class="contenedor-error">
    <div class="contenido">
      <h1 class="codigo-error">404</h1>
      <p class="mensaje-error">Oops... No encontramos esa página.</p>
      <q-btn
        label="Volver al inicio"
        to="/"
        color="color-acento"
        text-color="white"
        unelevated
        no-caps
        class="boton-volver"
      />
    </div>
  </div>
</template>
<!----------- CSS ----------->
<style scoped>
.contenedor-error {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-fondo);
  color: var(--color-texto-principal);
  text-align: center;
  padding: 20px;
}
.contenido {
  max-width: 500px;
}
.codigo-error {
  font-size: 20vh;
  margin: 0;
  color: var(--color-primario);
}
.mensaje-error {
  font-size: 1.7rem;
  color: var(--color-texto-secundario);
  margin-bottom: 40px;
}
.boton-volver {
  font-size: 1rem;
  padding: 10px 30px;
  background-color: var(--color-acento);
}
</style>
