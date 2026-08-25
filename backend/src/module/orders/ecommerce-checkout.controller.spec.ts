import { Test, TestingModule } from '@nestjs/testing';
import { EcommerceCheckoutController } from './ecommerce-checkout.controller';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { CheckoutSource } from './enums/checkout-source.enum';
import { DeliveryType } from './enums/delivery-type.enum';
import { PaymentMethod } from '../payments/enums/payment-method.enum';

describe('EcommerceCheckoutController', () => {
  let controller: EcommerceCheckoutController;
  let ordersService: any;

  beforeEach(async () => {
    ordersService = {
      checkoutPreview: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EcommerceCheckoutController],
      providers: [
        { provide: OrdersService, useValue: ordersService },
      ],
    }).compile();

    controller = module.get<EcommerceCheckoutController>(EcommerceCheckoutController);
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  describe('preview', () => {
    it('debe llamar a ordersService.checkoutPreview con los parámetros correctos', async () => {
      const checkoutDto: CheckoutDto = {
        source: CheckoutSource.BUY_NOW,
        contact: { fullName: 'Pedro Lopez', email: 'pedro@example.com', phone: '+50379999999' },
        delivery: { deliveryType: DeliveryType.HOME_DELIVERY, departmentId: 'SS', districtId: 'San_Salvador', city: 'San Salvador', addressLine: 'Calle Principal #1' },
        paymentMethod: PaymentMethod.CARD,
      };

      const req = { user: { id: 'user-uuid-123' } };
      const xCartToken = 'cart-token-456';
      const mockResult = { success: true, data: { subtotal: '100.00', total: '103.50' } };

      ordersService.checkoutPreview.mockResolvedValue(mockResult);

      const result = await controller.preview(checkoutDto, req, xCartToken);

      expect(ordersService.checkoutPreview).toHaveBeenCalledWith(checkoutDto, 'user-uuid-123', 'cart-token-456');
      expect(result).toEqual(mockResult);
    });
  });
});
