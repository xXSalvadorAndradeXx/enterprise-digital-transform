import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';

import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,

    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  // =====================================================
  // Obtener carrito del usuario autenticado
  // =====================================================
  async getCart(userId: string): Promise<Cart> {
    const cart = await this.cartRepo.findOne({
      where: {
        user: {
          id: userId,
        },
      },
      relations: [
        'items',
        'items.product',
        'items.product.category',
      ],
    });

    if (!cart) {
      throw new NotFoundException('Carrito no encontrado');
    }

    cart.items = cart.items ?? [];

    return cart;
  }

  // =====================================================
  // Agregar producto al carrito
  // =====================================================
  async addToCart(
    userId: string,
    dto: AddToCartDto,
  ): Promise<Cart> {
    // Buscar producto
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

    // Validar stock
    if (product.stock < dto.quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${product.stock}`,
      );
    }

    // Buscar carrito
    const cart = await this.cartRepo.findOne({
      where: {
        user: {
          id: userId,
        },
      },
      relations: [
        'items',
        'items.product',
      ],
    });

    if (!cart) {
      throw new NotFoundException('Carrito no encontrado');
    }

    cart.items = cart.items ?? [];

    // Buscar si ya existe el producto
    const existingItem = cart.items.find(
      (item) => item.product.id === dto.productId,
    );

    if (existingItem) {
      const newQuantity =
        existingItem.quantity + dto.quantity;

      if (newQuantity > product.stock) {
        throw new BadRequestException(
          `Stock insuficiente. Ya tienes ${existingItem.quantity} en el carrito`,
        );
      }

      existingItem.quantity = newQuantity;
      existingItem.unitPrice = Number(product.price);
      existingItem.subtotal =
        Number(product.price) * newQuantity;

      await this.cartItemRepo.save(existingItem);
    } else {
      const newItem = this.cartItemRepo.create({
        cart,
        product,
        quantity: dto.quantity,
        unitPrice: Number(product.price),
        subtotal:
          Number(product.price) * dto.quantity,
      });

      await this.cartItemRepo.save(newItem);
    }

    return this.getCart(userId);
  }

  // =====================================================
  // Actualizar cantidad de un ítem del carrito
  // =====================================================
  async updateItemQuantity(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ) {
    const item = await this.cartItemRepo.findOne({
      where: {
        id: itemId,
      },
      relations: [
        'cart',
        'cart.user',
        'product',
      ],
    });

    if (!item) {
      throw new NotFoundException(
        `Ítem con id "${itemId}" no encontrado`,
      );
    }

    // =====================================================
    // Validar que el ítem pertenece al usuario autenticado
    // =====================================================

    console.log('Usuario JWT:', userId);
    console.log(
      'Usuario dueño del carrito:',
      item.cart.user?.id,
    );

    if (!item.cart.user) {
      throw new NotFoundException(
        'El carrito no tiene usuario asociado',
      );
    }

    if (item.cart.user.id !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este ítem',
      );
    }

    // =====================================================
    // Validar cantidad
    // =====================================================

    if (dto.quantity < 1) {
      throw new BadRequestException(
        'La cantidad mínima es 1',
      );
    }

    // =====================================================
    // Validar stock
    // =====================================================

    const stockDisponible = item.product.stock;

    if (dto.quantity > stockDisponible) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${stockDisponible}, solicitado: ${dto.quantity}`,
      );
    }

    // =====================================================
    // Actualizar cantidad
    // =====================================================

    item.quantity = dto.quantity;
    item.unitPrice = Number(item.product.price);
    item.subtotal =
      Number(item.product.price) * dto.quantity;

    await this.cartItemRepo.save(item);

    // =====================================================
    // Devolver carrito actualizado
    // =====================================================

    return this.getCartWithTotals(item.cart.id!);
  }

  // =====================================================
  // Obtener carrito con subtotales y total
  // =====================================================
  async getCartWithTotals(cartId: string) {
    const cart = await this.cartRepo.findOne({
      where: {
        id: cartId,
      },
      relations: [
        'items',
        'items.product',
      ],
    });

    if (!cart) {
      throw new NotFoundException(
        'Carrito no encontrado',
      );
    }

    cart.items = cart.items ?? [];

    const items = cart.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
        imageUrl: item.product.imageUrl,
      },
      subtotal:
        Number(item.product.price) * item.quantity,
    }));

    const total = items.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );

    const itemCount = items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    return {
      cartId: cart.id,
      items,
      total: Number(total.toFixed(2)),
      itemCount,
    };
  }
}