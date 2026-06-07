// src/cart/cart.service.ts

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
  // GET CART
  // =====================================================
  async getCart(userId: string): Promise<Cart> {
    const cart = await this.cartRepo.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'items.product.category'],
    });

    if (!cart) {
      throw new NotFoundException('Carrito no encontrado');
    }

    cart.items = cart.items ?? [];
    return cart;
  }

  // =====================================================
  // MÉTODO CENTRAL (TOTALES)
  // =====================================================
  async getCartWithTotals(cartIdOrUserId: string, isUserId = false) {
    const cart = await this.cartRepo.findOne({
      where: isUserId
        ? { user: { id: cartIdOrUserId } }
        : { id: cartIdOrUserId },
      relations: ['items', 'items.product', 'user'],
    });

    if (!cart) {
      throw new NotFoundException('Carrito no encontrado');
    }

    const items = (cart.items ?? []).map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.unitPrice) * item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
        imageUrl: item.product.imageUrl ?? null,
        stock: item.product.stock,
      },
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
      summary: {
        itemCount,
        distinctItems: items.length,
        total: Number(total.toFixed(2)),
      },
    };
  }

  // =====================================================
  // ADD TO CART
  // =====================================================
  async addToCart(userId: string, dto: AddToCartDto) {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${product.stock}`,
      );
    }

    const cart = await this.cartRepo.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException('Carrito no encontrado');
    }

    cart.items = cart.items ?? [];

    const existing = cart.items.find(
      (i) => i.product.id === dto.productId,
    );

    if (existing) {
      const newQty = existing.quantity + dto.quantity;

      if (newQty > product.stock) {
        throw new BadRequestException('Stock insuficiente');
      }

      existing.quantity = newQty;
      existing.unitPrice = Number(product.price);

      await this.cartItemRepo.save(existing);
    } else {
      const newItem = this.cartItemRepo.create({
        cart,
        product,
        quantity: dto.quantity,
        unitPrice: Number(product.price),
      });

      await this.cartItemRepo.save(newItem);
    }

    return this.getCartWithTotals(userId, true);
  }

  // =====================================================
  // UPDATE ITEM
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
      throw new NotFoundException('Ítem no encontrado');
    }

    if (!item.cart.user || item.cart.user.id !== userId) {
      throw new ForbiddenException('No autorizado');
    }

    if (dto.quantity < 1) {
      throw new BadRequestException('Cantidad mínima 1');
    }

    if (dto.quantity > item.product.stock) {
      throw new BadRequestException('Stock insuficiente');
    }

    item.quantity = dto.quantity;
    item.unitPrice = Number(item.product.price);

    await this.cartItemRepo.save(item);

    if (!item.cart.id) {
      throw new NotFoundException('Carrito inválido');
    }

    return this.getCartWithTotals(item.cart.id);
  }

  // =====================================================
  // REMOVE ITEM
  // =====================================================
  async removeItem(userId: string, itemId: string) {
    const item = await this.cartItemRepo.findOne({
      where: { id: itemId },
      relations: ['cart', 'cart.user'],
    });

    if (!item) {
      throw new NotFoundException('Ítem no encontrado');
    }

    if (!item.cart.user || item.cart.user.id !== userId) {
      throw new ForbiddenException('No autorizado');
    }

    const cartId = item.cart.id;

    if (!cartId) {
      throw new NotFoundException('Carrito inválido');
    }

    await this.cartItemRepo.remove(item);

    return this.getCartWithTotals(cartId);
  }

  // =====================================================
  // CLEAR CART
  // =====================================================
  async clearCart(userId: string) {
    const cart = await this.cartRepo.findOne({
      where: { user: { id: userId } },
      relations: ['items'],
    });

    if (!cart) {
      throw new NotFoundException('Carrito no encontrado');
    }

    const items = cart.items ?? [];

    if (items.length === 0) {
      return {
        cartId: cart.id,
        items: [],
        summary: {
          itemCount: 0,
          distinctItems: 0,
          total: 0,
        },
        message: 'Carrito ya estaba vacío',
      };
    }

    await this.cartItemRepo.remove(items);

    return {
      cartId: cart.id,
      items: [],
      summary: {
        itemCount: 0,
        distinctItems: 0,
        total: 0,
      },
      message: 'Carrito vaciado correctamente',
    };
  }
}