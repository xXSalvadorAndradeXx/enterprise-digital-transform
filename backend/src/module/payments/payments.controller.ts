import { Controller, Post, Body, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ProcessCardPaymentDto } from './dto/process-card-payment.dto';
import { Payment } from './entities/payment.entity';

@ApiTags('Pagos')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva solicitud de pago para una orden' })
  @ApiResponse({ status: 201, description: 'Solicitud de pago creada exitosamente', type: Payment })
  @ApiResponse({ status: 400, description: 'Petición incorrecta' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  @ApiResponse({ status: 409, description: 'Ya existe un pago registrado para esta orden' })
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    const payment = await this.paymentsService.createPayment(createPaymentDto);
    return {
      status: 'success',
      message: 'Solicitud de pago creada exitosamente',
      data: payment,
    };
  }

  @Post(':id/process-card')
  @ApiOperation({ summary: 'Simular/Procesar la confirmación de pago con tarjeta de crédito/débito' })
  @ApiParam({ name: 'id', description: 'UUID del pago' })
  @ApiResponse({ status: 200, description: 'Tarjeta procesada y estado de pago actualizado', type: Payment })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida o datos de entrada incorrectos' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async processCard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() processCardPaymentDto: ProcessCardPaymentDto,
  ) {
    const payment = await this.paymentsService.processCardPayment(id, processCardPaymentDto);
    return {
      status: 'success',
      message: `Tarjeta procesada. El estado actual del pago es ${payment.status}`,
      data: payment,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener los detalles de un pago por su ID' })
  @ApiParam({ name: 'id', description: 'UUID del pago' })
  @ApiResponse({ status: 200, description: 'Pago encontrado', type: Payment })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const payment = await this.paymentsService.findOne(id);
    return {
      status: 'success',
      message: 'Pago recuperado exitosamente',
      data: payment,
    };
  }
}
