import {
  IconCalendarEvent,
  IconThumbUp,
  IconFlame,
  IconBolt,
  IconTornado,
  IconDiamond,
  IconTrophy,
  IconChartLine,
} from '@tabler/icons-vue'

/**
 * Obtiene el ícono correspondiente según la cantidad de pedidos
 * Usa lógica de lunes a viernes (sin considerar fin de semana)
 */
export function obtenerIconoPorCantidad(cantidad) {
  if (cantidad >= 50) return IconDiamond // 💎
  if (cantidad >= 40) return IconTornado // 🌪️
  if (cantidad >= 30) return IconBolt // ⚡
  if (cantidad >= 20) return IconFlame // 🔥
  if (cantidad >= 10) return IconThumbUp // 👍

  return IconCalendarEvent // 📅 (1-9)
}

/**
 * Obtiene el ícono para la tarjeta "Mejor día"
 * Si tiene menos de 10 pedidos, muestra copa
 */
export function obtenerIconoMejorDia(cantidad) {
  if (cantidad < 10) return IconTrophy // 🏆
  return obtenerIconoPorCantidad(cantidad)
}

/**
 * Obtiene el ícono para la tarjeta "Promedio por día"
 * Si tiene menos de 10, muestra gráfica
 */
export function obtenerIconoPromedio(promedioRedondeado) {
  if (promedioRedondeado < 10) return IconChartLine // 📊
  return obtenerIconoPorCantidad(promedioRedondeado)
}
