/**
 * Funciones mapper: API DTO -> modelo visual.
 * Mantienen las reglas de presentación en un único lugar, en vez de
 * duplicarlas en Services, Hooks o componentes.
 */

import { MovementChannel } from './enums';
import { MovementResponseDto } from './movement.types';
import { MovementViewModel } from './view-models';

/**
 * Resuelve el texto de "Responsable" para un movimiento según RN-M-013.
 * La columna del diseño se llama únicamente "Responsable" y no incluye
 * información de cliente — este mapper no expone ni infiere ese dato.
 */
export function resolveResponsibleDisplayName(
  responsibleUser: MovementResponseDto['responsibleUser'],
  channel: MovementResponseDto['channel'],
): string {
  if (responsibleUser !== null) {
    return `${responsibleUser.firstName} ${responsibleUser.lastName}`;
  }
  return channel === MovementChannel.ECOMMERCE ? 'E-commerce' : 'Sistema';
}

/** Mapea un MovementResponseDto crudo de la API a su MovementViewModel. */
export function mapMovementToViewModel(dto: MovementResponseDto): MovementViewModel {
  return {
    ...dto,
    responsibleDisplayName: resolveResponsibleDisplayName(dto.responsibleUser, dto.channel),
  };
}

/** Mapea un arreglo de MovementResponseDto a MovementViewModel[]. */
export function mapMovementsToViewModels(
  dtos: readonly MovementResponseDto[],
): MovementViewModel[] {
  return dtos.map(mapMovementToViewModel);
}