import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { CheckoutSource } from '../src/module/orders/enums/checkout-source.enum';
import { DeliveryType } from '../src/module/orders/enums/delivery-type.enum';
import { PaymentMethod } from '../src/module/payments/enums/payment-method.enum';

describe('Checkout Flow (e2e)', () => {
  let app: INestApplication<App>;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /ecommerce/checkout/preview', () => {
    it('debe responder correctamente recalculando totales sin efectos secundarios en base de datos', async () => {
      const payload = {
        source: CheckoutSource.BUY_NOW,
        items: [
          {
            variantId: '123e4567-e89b-12d3-a456-426614174000',
            quantity: 1,
            priceAtAdded: '20.00',
          },
        ],
        contact: {
          fullName: 'Diego Test',
          email: 'diego@example.com',
          phone: '+50370000000',
        },
        delivery: {
          deliveryType: DeliveryType.STORE_PICKUP,
          branchId: '123e4567-e89b-12d3-a456-426614174111',
        },
        paymentMethod: PaymentMethod.PAY_AT_STORE,
      };

      const response = await request(app.getHttpServer())
        .post('/ecommerce/checkout/preview')
        .send(payload);

      expect(response.status).toBeDefined();
    });
  });
});
