
import { MovementResponseDto } from './movement.types';
export interface MovementViewModel extends MovementResponseDto {
  readonly responsibleDisplayName: string;
}