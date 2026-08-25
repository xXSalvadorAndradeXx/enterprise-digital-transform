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
import { generateGuestToken, hashGuestToken } from '../../common/utils/security.util';

export interface ResolvedCartResult {
  cart: Cart;
  createdGuestToken: string | null;
}

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
   * Resuelve el carrito dando prioridad a la identidad JWT (customerId) o al header X-Cart-Token (guestTokenHash).
   */
  async resolveCart(
    userId?: string | null,
    xCartToken?: string | null,
    isCreateOnPost = false,
  ): Promise<ResolvedCartResult> {
    // 1. Prioridad: JWT Autenticado (customerId)
    if (userId) {
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
        if (isCreateOnPost) {
          this.validateCartOwner(userId, null);
          cart = this.cartRepository.create({
            customerId: userId,
            guestTokenHash: null,
            status: CartStatus.ACTIVE,
          });
          cart = await this.cartRepository.save(cart);
          cart.items = [];
        } else {
          throw new NotFoundException({
            code: 'CART_NOT_FOUND',
            message: 'El carrito solicitado no existe o no se encuentra activo',
          });
        }
      }

      return { cart, createdGuestToken: null };
    }

    // 2. Visitante con X-Cart-Token
    if (xCartToken && xCartToken.trim().length > 0) {
      const guestTokenHash = hashGuestToken(xCartToken.trim());
      const cart = await this.cartRepository.findOne({
        where: { guestTokenHash, deletedAt: IsNull() },
        relations: [
          'items',
          'items.product',
          'items.product.images',
          'items.variantConfig',
          'items.variantConfig.inventoryDetail',
        ],
      });

      if (!cart || cart.status !== CartStatus.ACTIVE) {
        throw new BadRequestException({
          code: 'CART_TOKEN_INVALID',
          message: 'El token del carrito no es válido',
        });
      }

      // Verificación de expiración (expiresAt)
      if (cart.expiresAt && cart.expiresAt.getTime() < Date.now()) {
        cart.status = CartStatus.ABANDONED;
        await this.cartRepository.save(cart);
        throw new BadRequestException({
          code: 'CART_TOKEN_INVALID',
          message: 'El token del carrito no es válido',
        });
      }

      return { cart, createdGuestToken: null };
    }

    // 3. Visitante sin X-Cart-Token
    if (isCreateOnPost) {
      const plainToken = generateGuestToken();
      const guestTokenHash = hashGuestToken(plainToken);
      const ttlHours = Number(process.env.GUEST_CART_TTL_HOURS) || 168; // 7 días por defecto
      const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

      this.validateCartOwner(null, guestTokenHash);
      let cart = this.cartRepository.create({
        customerId: null,
        guestTokenHash,
        status: CartStatus.ACTIVE,
        expiresAt,
      });

      cart = await this.cartRepository.save(cart);
      cart.items = [];

      return { cart, createdGuestToken: plainToken };
    }

    // Sin JWT ni X-Cart-Token en operaciones de lectura/modificación
    throw new BadRequestException({
      code: 'CART_TOKEN_INVALID',
      message: 'El token del carrito no es válido',
    });
  }

  /**
   * Obtiene o crea un carrito activo para un cliente registrado.
   */
  async findOrCreateCartForUser(userId: string): Promise<Cart> {
    const { cart } = await this.resolveCart(userId, null, true);
    return cart;
  }

  /**
   * Obtiene o crea un carrito activo para un visitante.
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
   * Agrega un ítem al carrito resuelto o acumula su cantidad si la variante ya existe.
   */
  async addItemToCart(cartId: string, dto: AddCartItemDto): Promise<CartResponseDto> {
    const cart = await this.findActiveCartById(cartId);

    if (cart.status !== CartStatus.ACTIVE) {
      throw new BadRequestException({
        code: 'CART_NOT_ACTIVE',
        message: 'No es posible modificar un carrito que no se encuentra activo',
      });
    }

    // 1. Validar producto publicable
    const product = await this.productRepository.findOne({
      where: { id: dto.productId, deletedAt: IsNull() },
      relations: ['inventory'],
    });

    if (!product || !ProductSpecification.isProductPublishableAndSellable(product)) {
      throw new BadRequestException({
        code: 'PRODUCT_NOT_PUBLISHED',
        message: 'El producto no se encuentra disponible para compra',
        details: {
          productId: dto.productId,
        },
      });
    }

    // 2. Validar variante exista y pertenezca al producto
    const variantConfig = await this.variantConfigRepository.findOne({
      where: { id: dto.variantId, productId: dto.productId },
      relations: ['inventoryDetail'],
    });

    if (!variantConfig || variantConfig.productId !== dto.productId) {
      throw new BadRequestException({
        code: 'VARIANT_NOT_FOUND',
        message: 'La variante seleccionada no existe o no está disponible',
        details: {
          variantId: dto.variantId,
        },
      });
    }

    // 3. Buscar si la variante ya existe en el carrito para calcular la cantidad final acumulada
    const existingItem = await this.cartItemRepository.findOne({
      where: { cartId: cart.id, variantId: dto.variantId },
    });

    const existingQuantity = existingItem ? existingItem.quantity : 0;
    const finalRequestedQuantity = existingQuantity + dto.quantity;

    // 4. Validar cantidad final acumulada contra stock disponible de la variante
    const availableStock = variantConfig.inventoryDetail
      ? Number(variantConfig.inventoryDetail.stock)
      : 0;

    if (finalRequestedQuantity > availableStock) {
      throw new BadRequestException({
        code: 'STOCK_INSUFFICIENT',
        message: 'No existe suficiente stock para la cantidad solicitada',
        details: {
          variantId: dto.variantId,
          requestedQuantity: finalRequestedQuantity,
          availableStock,
        },
      });
    }

    // 5. Insertar o acumular la línea en el carrito
    if (existingItem) {
      existingItem.quantity = finalRequestedQuantity;
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
        message: 'El producto solicitado no existe en el carrito',
      });
    }

    // Validar stock disponible de la variante antes de actualizar la cantidad
    const variantConfig = await this.variantConfigRepository.findOne({
      where: { id: cartItem.variantId },
      relations: ['inventoryDetail'],
    });

    const availableStock = variantConfig?.inventoryDetail
      ? Number(variantConfig.inventoryDetail.stock)
      : 0;

    if (quantity > availableStock) {
      throw new BadRequestException({
        code: 'STOCK_INSUFFICIENT',
        message: 'No existe suficiente stock para la cantidad solicitada',
        details: {
          variantId: cartItem.variantId,
          requestedQuantity: quantity,
          availableStock,
        },
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
        message: 'El producto solicitado no existe en el carrito',
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