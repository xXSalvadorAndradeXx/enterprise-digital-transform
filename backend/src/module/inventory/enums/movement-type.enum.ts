// src/inventory/enums/movement-type.enum.ts
export enum MovementType {
  // ── CORREGIDO: se eliminan NUEVO_PRODUCTO, REABASTECIMIENTO, AJUSTE.
  // El servicio de Compras usará 'Entrada' para crear y 'Salida' para revertir.
  IN  = 'Entrada',
  OUT = 'Salida',
}