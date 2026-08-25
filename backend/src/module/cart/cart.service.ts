import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariantConfig } from '../products/entities/product-variant-config.entity';
import { CartStatus } from './enums/cart-status.enum';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { ProductSpecification } from '../products/helpers/product-specification.helper';
import { CartResponseDto } from './dto/cart-response.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariantConfig)
    private readonly variantConfigRepository: Repository<ProductVariantConfig>,
  ) {}

  /**
   * Valida la restricción XOR del propietario del carrito a nivel de aplicación.
   */
  private validateCartOwner(customerId?: string | null, guestTokenHash?: string | null): void {
    const hasCustomer = !!customerId;
    const hasGuest = !!guestTokenHash;
    if ((hasCustomer && hasGuest) || (!hasCustomer && !hasGuest)) {
      throw new BadRequestException({
        code: 'INVALID_CART_OWNER',
        message:
          'Un carrito debe pertenecer exclusivamente a un cliente autenticado o a un token de invitado, pero nunca a ambos ni a ninguno.',
      });
    }
  }

  /**
   * Obtiene o crea un carrito activo para un cliente registrado.
   */
  async findOrCreateCartForUser(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { customerId: userId, status: CartStatus.ACTIVE, deletedAt: IsNull() },
      relations: [
        'items',
        'items.product',
        'items.product.images',
        'items.variantConfig',
        'items.variantConfig.inventoryDetail',
      ],
    });

    if (!cart) {
      this.validateCartOwner(userId, null);
      cart = this.cartRepository.create({
        customerId: userId,
        guestTokenHash: null,
        status: CartStatus.ACTIVE,
      });
      cart = await this.cartRepository.save(cart);
      cart.items = [];
    }

    return cart;
  }

  /**
   * Obtiene o crea un carrito activo para un visitante (guestTokenHash).
   */
  async findOrCreateCartForGuest(guestTokenHash: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { guestTokenHash, status: CartStatus.ACTIVE, deletedAt: IsNull() },
      relations: [
        'items',
        'items.product',
        'items.product.images',
        'items.variantConfig',
        'items.variantConfig.inventoryDetail',
      ],
    });

    if (!cart) {
      this.validateCartOwner(null, guestTokenHash);
      cart = this.cartRepository.create({
        customerId: null,
        guestTokenHash,
        status: CartStatus.ACTIVE,
      });
      cart = await this.cartRepository.save(cart);
      cart.items = [];
    }

    return cart;
  }

  /**
   * Busca un carrito activo por su ID y valida su estado.
   */
  async findActiveCartById(cartId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId, deletedAt: IsNull() },
      relations: [
        'items',
        'items.product',
        'items.product.images',
        'items.variantConfig',
        'items.variantConfig.inventoryDetail',
      ],
    });

    if (!cart) {
      throw new NotFoundException({
        code: 'CART_NOT_FOUND',
        message: `El carrito con ID ${cartId} no existe`,
      });
    }

    return cart;
  }

  /**
   * Agrega un ítem al carrito o acumula su cantidad si la variante ya existe.
   */
  async addItemToCart(cartId: string, dto: AddCartItemDto): Promise<CartResponseDto> {
    const cart = await this.findActiveCartById(cartId);

    if (cart.status !== CartStatus.ACTIVE) {
      throw new BadRequestException({
        code: 'CART_NOT_ACTIVE',
        message: 'No es posible modificar un carrito que no se encuentra activo',
      });
    }

    // 1. Validar producto
    const product = await this.productRepository.findOne({
      where: { id: dto.productId, deletedAt: IsNull() },
      relations: ['inventory'],
    });

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `El producto con ID ${dto.productId} no existe`,
      });
    }

    if (!ProductSpecification.isProductPublishableAndSellable(product)) {
      throw new BadRequestException({
        code: 'PRODUCT_NOT_AVAILABLE',
        message: `El producto con ID ${dto.productId} no se encuentra disponible públicamente para venta`,
      });
    }

    // 2. Validar variante pertenezca al producto
    const variantConfig = await this.variantConfigRepository.findOne({
      where: { id: dto.variantId, productId: dto.productId },
    });

    if (!variantConfig) {
      throw new BadRequestException({
        code: 'INVALID_VARIANT',
        message: `La variante con ID ${dto.variantId} no pertenece al producto indicado (${dto.productId})`,
      });
    }

    // 3. Buscar si la variante ya existe en el carrito
    const existingItem = await this.cartItemRepository.findOne({
      where: { cartId: cart.id, variantId: dto.variantId },
    });

    if (existingItem) {
      existingItem.quantity = existingItem.quantity + dto.quantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      const newItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId,
        quantity: dto.quantity,
      });
      await this.cartItemRepository.save(newItem);
    }

    const updatedCart = await this.findActiveCartById(cart.id);
    return CartResponseDto.fromEntity(updatedCart);
  }

  /**
   * Actualiza la cantidad de un ítem existente en el carrito.
   */
  async updateItemQuantity(
    cartId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartResponseDto> {
    if (quantity <= 0) {
      throw new BadRequestException({
        code: 'INVALID_QUANTITY',
        message: 'La cantidad debe ser mayor que cero. Para eliminar, use la operación de eliminación explícita.',
      });
    }

    const cart = await this.findActiveCartById(cartId);

    if (cart.status !== CartStatus.ACTIVE) {
      throw new BadRequestException({
        code: 'CART_NOT_ACTIVE',
        message: 'No es posible modificar un carrito que no se encuentra activo',
      });
    }

    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      throw new NotFoundException({
        code: 'CART_ITEM_NOT_FOUND',
        message: `El ítem con ID ${itemId} no pertenece a este carrito`,
      });
    }

    cartItem.quantity = quantity;
    await this.cartItemRepository.save(cartItem);

    const updatedCart = await this.findActiveCartById(cart.id);
    return CartResponseDto.fromEntity(updatedCart);
  }

  /**
   * Elimina un ítem explícitamente del carrito.
   */
  async removeItem(cartId: string, itemId: string): Promise<CartResponseDto> {
    const cart = await this.findActiveCartById(cartId);

    if (cart.status !== CartStatus.ACTIVE) {
      throw new BadRequestException({
        code: 'CART_NOT_ACTIVE',
        message: 'No es posible modificar un carrito que no se encuentra activo',
      });
    }

    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      throw new NotFoundException({
        code: 'CART_ITEM_NOT_FOUND',
        message: `El ítem con ID ${itemId} no pertenece a este carrito`,
      });
    }

    await this.cartItemRepository.remove(cartItem);

    const updatedCart = await this.findActiveCartById(cart.id);
    return CartResponseDto.fromEntity(updatedCart);
  }

  /**
   * Vacía todos los ítems de un carrito activo.
   */
  async clearCart(cartId: string): Promise<CartResponseDto> {
    const cart = await this.findActiveCartById(cartId);

    if (cart.status !== CartStatus.ACTIVE) {
      throw new BadRequestException({
        code: 'CART_NOT_ACTIVE',
        message: 'No es posible modificar un carrito que no se encuentra activo',
      });
    }

    await this.cartItemRepository.delete({ cartId: cart.id });

    const updatedCart = await this.findActiveCartById(cart.id);
    return CartResponseDto.fromEntity(updatedCart);
  }
}