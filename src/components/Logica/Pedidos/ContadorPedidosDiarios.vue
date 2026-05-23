<template>
  <div class="contenedor-contador">
    <div class="tarjeta-contador" :title="textoContador" @click="irAEstadisticas">
      <div class="icono-contador">
        <component :is="obtenerIconoContador" size="24" />
      </div>
      <div class="info-contador">
        <p class="fecha-actual">{{ fechaFormateada }}</p>
        <p class="linea-conteo"><span class="etiqueta-conteo">Pedidos:</span> <span class="numero-conteo">{{ pedidosDelDia }}</span></p>
        <p class="linea-conteo"><span class="etiqueta-conteo">Items:</span> <span class="numero-conteo">{{ itemsDelDia }}</span></p>
      </div>
      <div class="icono-estadisticas">
        <IconChartBar :size="18" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconCalendarEvent,
  IconThumbUp,
  IconFlame,
  IconBolt,
  IconTornado,
  IconDiamond,
  IconChartBar,
} from '@tabler/icons-vue'
import { obtenerPedidos } from '../../BaseDeDatos/almacenamiento.js'

const router = useRouter()

// Estado reactivo
const pedidosDelDia = ref(0)
const itemsDelDia = ref(0)
const fechaActual = ref(new Date())

// Función para navegar a estadísticas
function irAEstadisticas() {
  router.push({ name: 'EstadisticasPedidos' })
}

// Función para obtener el día de la semana
function esFinesDeSemana(fecha) {
  const dia = fecha.getDay()
  return dia === 0 || dia === 6 // 0 = domingo, 6 = sábado
}

// Función para formatear la fecha actual
const fechaFormateada = computed(() => {
  const opciones = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  return fechaActual.value.toLocaleDateString('es-ES', opciones)
})

// Función para obtener el icono según la cantidad de pedidos
const obtenerIconoContador = computed(() => {
  const esFinde = esFinesDeSemana(fechaActual.value)
  const cantidad = pedidosDelDia.value

  // Si no hay pedidos, siempre calendario
  if (cantidad === 0) {
    return IconCalendarEvent
  }

  // Fin de semana: empieza con pulgar desde pedido 1
  if (esFinde) {
    if (cantidad >= 50) return IconDiamond // 50+ diamante
    if (cantidad >= 40) return IconTornado // 40-49 tornado
    if (cantidad >= 30) return IconBolt // 30-39 rayo
    if (cantidad >= 20) return IconFlame // 20-29 llama
    return IconThumbUp // 1-19 pulgar arriba
  }

  // Entre semana: sin icono hasta el 10
  if (cantidad >= 50) return IconDiamond // 50+ diamante
  if (cantidad >= 40) return IconTornado // 40-49 tornado
  if (cantidad >= 30) return IconBolt // 30-39 rayo
  if (cantidad >= 20) return IconFlame // 20-29 llama
  if (cantidad >= 10) return IconThumbUp // 10-19 pulgar arriba

  return IconCalendarEvent // 1-9 calendario normal
})

// Estado para verificar si hay falta registrada
const hayFaltaRegistrada = ref(false)

// Texto dinámico del contador mejorado
const textoContador = computed(() => {
  const esFinde = esFinesDeSemana(fechaActual.value)

  // Si es fin de semana pero están trabajando (tienen pedidos)
  if (esFinde && pedidosDelDia.value > 0) {
    return `Pedidos del día: ${pedidosDelDia.value}`
  }

  // Fin de semana sin pedidos - descanso
  if (esFinde) {
    return '¡Buen descanso!'
  }

  // Entre semana sin pedidos - verificar si hay falta registrada
  if (pedidosDelDia.value === 0) {
    return hayFaltaRegistrada.value
      ? 'Día marcado como no trabajado'
      : 'Todavía no se ingresaron pedidos'
  }

  // Entre semana con pedidos
  return `Pedidos del día de hoy: ${pedidosDelDia.value}`
})

// Función para formatear fecha a DD/MM/YYYY
function formatearFechaHoy(fecha) {
  const dia = fecha.getDate().toString().padStart(2, '0')
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
  const anio = fecha.getFullYear()
  return `${dia}/${mes}/${anio}`
}

// Contar pedidos del día actual
async function contarPedidosHoy() {
  try {
    const todosLosPedidos = await obtenerPedidos()
    const fechaHoyFormateada = formatearFechaHoy(fechaActual.value)

    const pedidosHoy = todosLosPedidos.filter(
      (pedido) => pedido.fecha === fechaHoyFormateada && pedido.tipo !== 'falta',
    )

    // Verificar si hay falta registrada
    hayFaltaRegistrada.value = todosLosPedidos.some(
      (p) => p.fecha === fechaHoyFormateada && p.tipo === 'falta',
    )

    pedidosDelDia.value = pedidosHoy.length
    itemsDelDia.value = pedidosHoy.reduce((suma, pedido) => suma + (pedido.items || 1), 0)
  } catch (error) {
    console.error('Error al contar pedidos del día:', error)
    pedidosDelDia.value = 0
    itemsDelDia.value = 0
  }
}

// Verificar si cambió el día y actualizar
function verificarCambioDia() {
  const ahora = new Date()
  const fechaGuardada = fechaActual.value

  // Si cambió el día, reiniciar contador
  if (
    ahora.getDate() !== fechaGuardada.getDate() ||
    ahora.getMonth() !== fechaGuardada.getMonth() ||
    ahora.getFullYear() !== fechaGuardada.getFullYear()
  ) {
    fechaActual.value = ahora
    contarPedidosHoy()
  }
}

// Interval para verificar cambio de día cada minuto
let intervaloCambioDia = null

onMounted(() => {
  // Cargar contador inicial
  contarPedidosHoy()

  // Verificar cambio de día cada minuto
  intervaloCambioDia = setInterval(verificarCambioDia, 60000)

  // También escuchar cambios en el almacenamiento (cuando se agreguen pedidos)
  window.addEventListener('storage', contarPedidosHoy)
})

onUnmounted(() => {
  // Limpiar interval
  if (intervaloCambioDia) {
    clearInterval(intervaloCambioDia)
  }

  // Remover listener
  window.removeEventListener('storage', contarPedidosHoy)
})

// Exponer función para actualizar desde el componente padre
defineExpose({
  actualizarContador: contarPedidosHoy,
})
</script>

<style scoped>
.contenedor-contador {
  margin: 1rem 0;
  padding: 0 1rem;
}
.tarjeta-contador {
  background: var(--color-fondo);
  color: var(--color-texto-secundario);
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 12px var(--sombra-boton);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  cursor: pointer;
  position: relative;
}
.tarjeta-contador:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--sombra-boton);
}
.tarjeta-contador:active {
  transform: translateY(0px);
}
.icono-contador {
  background: var(--color-superficie);
  padding: 0.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--borde-boton);
}
.info-contador {
  flex: 1;
}
.icono-estadisticas {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  color: var(--color-texto-secundario);
  opacity: 0.6;
  transition: opacity 0.2s ease;
}
.tarjeta-contador:hover .icono-estadisticas {
  opacity: 1;
  color: var(--color-acento);
}
.fecha-actual {
  font-size: 0.9rem;
  margin: 0 0 0.3rem 0;
  text-transform: capitalize;
  opacity: 0.95;
  color: var(--color-acento);
}
.linea-conteo {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-texto-principal);
}
.linea-conteo + .linea-conteo {
  margin-top: 0.1rem;
}
.etiqueta-conteo {
  color: var(--color-texto-secundario);
  font-weight: 600;
}
.numero-conteo {
  color: var(--color-acento);
  font-weight: 700;
}
/* Responsive */
@media (max-width: 600px) {
  .contenedor-contador {
    margin: 0.75rem 0;
    padding: 0 0.75rem;
  }
  .tarjeta-contador {
    padding: 0.875rem;
    gap: 0.75rem;
  }
  .icono-contador {
    padding: 0.625rem;
  }
  .icono-estadisticas {
    top: 0.625rem;
    right: 0.625rem;
  }
  .fecha-actual {
    font-size: 0.8rem;
  }
  .linea-conteo {
    font-size: 0.84rem;
  }
}
/* Estados especiales para fines de semana */
.tarjeta-contador.fin-semana {
  background: linear-gradient(135deg, var(--color-exito) 0%, #388e3c 100%);
}
/* Modo sin pedidos */
.tarjeta-contador.sin-pedidos {
  background: linear-gradient(135deg, var(--color-superficie) 0%, var(--color-borde) 100%);
  border: 1px solid var(--color-borde);
}
</style>
