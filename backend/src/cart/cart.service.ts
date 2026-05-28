import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

import { Product } from '../products/entities/product.entity';

import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,

    @InjectRepository(CartItem)
    private cartItemRepo: Repository<CartItem>,

    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  // ─────────────────────────────────────────────
  // Obtener carrito del usuario autenticado
  // ─────────────────────────────────────────────
  async getCart(userId: string): Promise<Cart> {
    const cart = await this.cartRepo.findOne({
      where: { user: { id: userId } },
      relations: [
        'items',
        'items.product',
        'items.product.category',
      ],
    });

    if (!cart) {
      throw new NotFoundException('Carrito no encontrado');
    }

    // 🔥 FIX: evitar undefined en items
    cart.items = cart.items ?? [];

    return cart;
  }

  // ─────────────────────────────────────────────
  // Agregar producto al carrito
  // ─────────────────────────────────────────────
  async addToCart(
    userId: string,
    dto: AddToCartDto,
  ): Promise<Cart> {

    // 1. Verificar producto
    const product = await this.productRepo.findOne({
      where: {
        id: dto.productId,
        isActive: true,
      },
    });

    if (!product) {
      throw new NotFoundException(
        `Producto con id "${dto.productId}" no encontrado`,
      );
    }

    // 2. Verificar stock
    if (product.stock < dto.quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${product.stock}`,
      );
    }

    // 3. Buscar carrito
    const cart = await this.cartRepo.findOne({
      where: {
        user: { id: userId },
      },
      relations: [
        'items',
        'items.product',
      ],
    });

    if (!cart) {
      throw new NotFoundException('Carrito no encontrado');
    }

    // 🔥 FIX: asegurar array seguro
    cart.items = cart.items ?? [];

    // 4. Verificar si ya existe el producto
    const existingItem = cart.items.find(
      (item) => item.product.id === dto.productId,
    );

    if (existingItem) {

      const newQuantity =
        existingItem.quantity + dto.quantity;

      // Validar stock nuevamente
      if (product.stock < newQuantity) {
        throw new BadRequestException(
          `Stock insuficiente. Ya tienes ${existingItem.quantity} en el carrito`,
        );
      }

      existingItem.quantity = newQuantity;
          existingItem.subtotal =
            existingItem.unitPrice * newQuantity;
      await this.cartItemRepo.save(existingItem);

    } else {

      const newItem = this.cartItemRepo.create({
        cart,
        product,
        quantity: dto.quantity,

        unitPrice: product.price,
        subtotal: product.price * dto.quantity,
      });

      await this.cartItemRepo.save(newItem);
    }

    // 5. Retornar carrito actualizado
    return this.getCart(userId);
  }
}