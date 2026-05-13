import { AppDataSource } from '../data-source';
import { Category } from '../../categories/entities/category.entity';
import { Product } from '../../products/entities/product.entity';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Conectado a la DB ✓');

    const categoryRepo = AppDataSource.getRepository(Category);
    const productRepo = AppDataSource.getRepository(Product);

    // limpiar tablas relacionadas
    await AppDataSource.query(`
      TRUNCATE TABLE
        cart_items,
        products,
        categories
      RESTART IDENTITY CASCADE;
    `);

    console.log('Tablas limpiadas ✓');

    const categories = await categoryRepo.save([
      { name: 'Electrónica', description: 'Dispositivos y gadgets' },
      { name: 'Ropa', description: 'Moda y accesorios' },
      { name: 'Hogar', description: 'Artículos para el hogar' },
    ]);

    console.log(`${categories.length} categorías creadas ✓`);

    const [electronica, ropa, hogar] = categories;

    const products = await productRepo.save([
      {
        name: 'Auriculares Bluetooth',
        description: 'Sonido premium con cancelación de ruido',
        price: 89.99,
        stock: 50,
        imageUrl: 'https://placehold.co/400x400?text=Auriculares',
        category: electronica,
      },
      {
        name: 'Smartphone X20',
        description: '128GB, cámara 108MP',
        price: 449.99,
        stock: 20,
        imageUrl: 'https://placehold.co/400x400?text=Smartphone',
        category: electronica,
      },
      {
        name: 'Camiseta Algodón',
        description: '100% algodón orgánico, varios colores',
        price: 24.99,
        stock: 200,
        imageUrl: 'https://placehold.co/400x400?text=Camiseta',
        category: ropa,
      },
      {
        name: 'Zapatillas Running',
        description: 'Suela de gel, ligeras',
        price: 79.99,
        stock: 80,
        imageUrl: 'https://placehold.co/400x400?text=Zapatillas',
        category: ropa,
      },
      {
        name: 'Lámpara LED',
        description: 'Regulable, 3 tonos de luz',
        price: 34.99,
        stock: 100,
        imageUrl: 'https://placehold.co/400x400?text=Lampara',
        category: hogar,
      },
      {
        name: 'Cafetera Italiana',
        description: 'Acero inoxidable, 6 tazas',
        price: 29.99,
        stock: 60,
        imageUrl: 'https://placehold.co/400x400?text=Cafetera',
        category: hogar,
      },
    ]);

    console.log(`${products.length} productos creados ✓`);
    console.log('Seeder completado exitosamente ✓');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error en el seeder:', error);
    process.exit(1);
  }
}

seed();