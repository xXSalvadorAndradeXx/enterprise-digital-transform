import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCustomerAddressDto } from './create-customer-address.dto';

export class UpdateCustomerAddressDto extends PartialType(
  OmitType(CreateCustomerAddressDto, ['getResolvedLabel'] as const),
) {
  /**
   * Helper que retorna el alias o label actualizado si alguno fue provisto,
   * o cadena vacía si ninguno fue modificado.
   */
  getResolvedLabel(): string {
    return (this.alias || this.label || '').trim();
  }
}
