import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findUserCart(userId: number) {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException('Carrito no encontrado para este usuario');
    }

    return cart;
  }

  async addItemToCart(userId: number, dto: AddCartItemDto) {
    const cart = await this.findUserCart(userId);
    
    const product = await this.productRepository.findOne({ where: { id: dto.productId } });
    if (!product) {
      throw new NotFoundException(`El producto con ID ${dto.productId} no existe`);
    }

    if (dto.quantity > product.stock) {
      throw new BadRequestException(`Stock insuficiente. Solo hay ${product.stock} unidades disponibles.`);
    }

    const existingItem = cart.items?.find(item => item.product.id === dto.productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + dto.quantity;
      if (newQuantity > product.stock) {
        throw new BadRequestException(`Stock insuficiente. Ya tienes ${existingItem.quantity} en tu carrito y solo quedan ${product.stock} unidades disponibles en total.`);
      }
      existingItem.quantity = newQuantity;
      existingItem.subtotal = newQuantity * existingItem.unitPrice;
      await this.cartItemRepository.save(existingItem);
    } else {
      const newItem = this.cartItemRepository.create({
        cart: { id: cart.id },
        product: { id: product.id },
        quantity: dto.quantity,
        unitPrice: product.precio,
        subtotal: dto.quantity * product.precio,
      });
      await this.cartItemRepository.save(newItem);
    }

    // Retornamos el carrito actualizado
    return this.findUserCart(userId);
  }
}