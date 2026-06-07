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
  // Obtener carrito del usuario
  // =====================================================
  async getCart(userId: string): Promise<Cart> {
    const cart = await this.cartRepo.findOne({
      where: {
        user: { id: userId },
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
  async addToCart(userId: string, dto: AddToCartDto): Promise<Cart> {
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

    if (product.stock < dto.quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${product.stock}`,
      );
    }

    const cart = await this.cartRepo.findOne({
      where: {
        user: { id: userId },
      },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException('Carrito no encontrado');
    }

    cart.items = cart.items ?? [];

    const existingItem = cart.items.find(
      (item) => item.product.id === dto.productId,
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + dto.quantity;

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
        subtotal: Number(product.price) * dto.quantity,
      });

      await this.cartItemRepo.save(newItem);
    }

    return this.getCart(userId);
  }

  // =====================================================
  // Actualizar cantidad de ítem
  // =====================================================
  async updateItemQuantity(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ) {
    const item = await this.cartItemRepo.findOne({
      where: { id: itemId },
      relations: ['cart', 'cart.user', 'product'],
    });

    if (!item) {
      throw new NotFoundException(`Ítem "${itemId}" no encontrado`);
    }

    if (!item.cart.user) {
      throw new NotFoundException('El carrito no tiene usuario asociado');
    }

    if (item.cart.user.id !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este ítem',
      );
    }

    if (dto.quantity < 1) {
      throw new BadRequestException('La cantidad mínima es 1');
    }

    const stockDisponible = item.product.stock;

    if (dto.quantity > stockDisponible) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${stockDisponible}, solicitado: ${dto.quantity}`,
      );
    }

    item.quantity = dto.quantity;
    item.unitPrice = Number(item.product.price);
    item.subtotal =
      Number(item.product.price) * dto.quantity;

    await this.cartItemRepo.save(item);

    return this.getCartWithTotals(item.cart.id!);
  }

  // =====================================================
  // ELIMINAR ITEM
  // =====================================================
  async removeItem(userId: string, itemId: string) {
    const item = await this.cartItemRepo.findOne({
      where: { id: itemId },
      relations: ['cart', 'cart.user', 'product'],
    });

    if (!item) {
      throw new NotFoundException(`Ítem "${itemId}" no encontrado`);
    }

    if (!item.cart.user) {
      throw new NotFoundException('El carrito no tiene usuario asociado');
    }

    if (item.cart.user.id !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este ítem',
      );
    }

    const cartId = item.cart.id!;

    await this.cartItemRepo.remove(item);

    return this.getCartWithTotals(cartId);
  }

  // =====================================================
  // VACÍAR CARRITO
  // =====================================================
  async clearCart(userId: string) {
    const cart = await this.cartRepo.findOne({
      where: {
        user: { id: userId },
      },
      relations: ['items', 'items.product', 'user'],
    });

    if (!cart) {
      throw new NotFoundException('Carrito no encontrado');
    }

    if (!cart.user) {
      throw new NotFoundException('El carrito no tiene usuario asociado');
    }

    if (cart.user.id !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para vaciar este carrito',
      );
    }

    cart.items = cart.items ?? [];

    if (cart.items.length === 0) {
      return {
        cartId: cart.id,
        items: [],
        total: 0,
        itemCount: 0,
        message: 'El carrito ya estaba vacío',
      };
    }

    await this.cartItemRepo.remove(cart.items);

    return {
      cartId: cart.id,
      items: [],
      total: 0,
      itemCount: 0,
      message: 'Carrito vaciado correctamente',
    };
  }

  // =====================================================
  // CARRO CON TOTALES
  // =====================================================
  async getCartWithTotals(cartId: string) {
    const cart = await this.cartRepo.findOne({
      where: { id: cartId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException('Carrito no encontrado');
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
      subtotal: Number(item.product.price) * item.quantity,
    }));

    const total = items.reduce((sum, i) => sum + i.subtotal, 0);

    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

    return {
      cartId: cart.id,
      items,
      total: Number(total.toFixed(2)),
      itemCount,
    };
  }
}