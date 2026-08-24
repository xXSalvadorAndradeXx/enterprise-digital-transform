import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';

import { ProductSpecification } from '../products/helpers/product-specification.helper';

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

  async findUserCart(userId: string) {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'items.product.inventory'],
    });

    if (!cart) {
      throw new NotFoundException('Carrito no encontrado para este usuario');
    }

    if (cart.items && cart.items.length > 0) {
      for (const item of cart.items) {
        if (item.product) {
          const effectivePrice = ProductSpecification.calculateEffectivePrice(
            item.product.salePrice,
            item.product.discount,
            item.product.discountStartsAt,
            item.product.discountEndsAt,
          );
          item.unitPrice = effectivePrice;
          item.subtotal = item.quantity * effectivePrice;
        }
      }
    }

    cart.total = cart.items?.reduce((acc, item) => acc + Number(item.subtotal), 0) || 0;

    return cart;
  }

  async addItemToCart(userId: string, dto: AddCartItemDto) {
    const cart = await this.findUserCart(userId);
    
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
      relations: ['inventory'],
    });
    if (!product) {
      throw new NotFoundException(`El producto con ID ${dto.productId} no existe`);
    }

    if (!ProductSpecification.isProductPublishableAndSellable(product)) {
      throw new BadRequestException(
        `El producto con ID ${dto.productId} no se encuentra publicado o disponible para venta`,
      );
    }

    const effectivePrice = ProductSpecification.calculateEffectivePrice(
      product.salePrice,
      product.discount,
      product.discountStartsAt,
      product.discountEndsAt,
    );

    const existingItem = cart.items?.find(item => item.product.id === dto.productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + dto.quantity;
      existingItem.quantity = newQuantity;
      existingItem.unitPrice = effectivePrice;
      existingItem.subtotal = newQuantity * effectivePrice;
      await this.cartItemRepository.save(existingItem);
    } else {
      const newItem = this.cartItemRepository.create({
        cart: { id: cart.id },
        product: { id: product.id },
        quantity: dto.quantity,
        unitPrice: effectivePrice,
        subtotal: dto.quantity * effectivePrice,
      });
      await this.cartItemRepository.save(newItem);
    }

    // Retornamos el carrito actualizado
    return this.findUserCart(userId);
  }

  async updateItemQuantity(userId: string, itemId: number, quantity: number) {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId },
      relations: ['cart', 'cart.user', 'product'],
    });

    if (!cartItem) {
      throw new NotFoundException(`El ítem con ID ${itemId} no se encuentra en el carrito`);
    }

    if (cartItem.cart.user.id !== userId) {
      throw new NotFoundException(`El ítem con ID ${itemId} no se encuentra en el carrito`);
    }

    cartItem.quantity = quantity;
    cartItem.subtotal = quantity * cartItem.unitPrice;
    await this.cartItemRepository.save(cartItem);

    return this.findUserCart(userId);
  }

  async removeItem(userId: string, itemId: number) {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId },
      relations: ['cart', 'cart.user'],
    });

    if (!cartItem) {
      throw new NotFoundException(`El ítem con ID ${itemId} no se encuentra en el carrito`);
    }

    if (cartItem.cart.user.id !== userId) {
      throw new NotFoundException(`El ítem con ID ${itemId} no se encuentra en el carrito`);
    }

    await this.cartItemRepository.remove(cartItem);

    return this.findUserCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.findUserCart(userId);

    await this.cartItemRepository.delete({ cart: { id: cart.id } });

    return this.findUserCart(userId);
  }
}