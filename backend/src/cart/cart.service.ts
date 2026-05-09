import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private repo: Repository<Cart>,
  ) {}

  // Busca el carrito del usuario autenticado
  // userId viene del JWT (req.user.id)
  async getCart(userId: string) {
    const cart = await this.repo.findOne({
      where: { user: { id: userId } },
      relations: [
        'items',              // los ítems del carrito
        'items.product',      // el producto de cada ítem
        'items.product.category', // la categoría del producto
      ],
    });

    if (!cart) throw new NotFoundException('Carrito no encontrado');
    return cart;
  }
}
