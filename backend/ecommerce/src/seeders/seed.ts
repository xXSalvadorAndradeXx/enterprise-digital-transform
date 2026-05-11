import { DataSource } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import typeOrmConfig from '../../typeorm.config';

async function runSeeder() {
  console.log('Iniciando seeder...');
  const dataSource = await typeOrmConfig.initialize();
  
  const categoryRepo = dataSource.getRepository(Category);
  const productRepo = dataSource.getRepository(Product);

  console.log('Limpiando tablas...');
  await dataSource.query('TRUNCATE TABLE products, categories CASCADE;');

  console.log('Insertando categorías...');
  const cat1 = categoryRepo.create({ nombre: 'Electrónica', descripcion: 'Dispositivos, gadgets y tecnología' });
  const cat2 = categoryRepo.create({ nombre: 'Ropa', descripcion: 'Prendas de vestir y accesorios' });
  const cat3 = categoryRepo.create({ nombre: 'Hogar', descripcion: 'Artículos para el hogar' });
  await categoryRepo.save([cat1, cat2, cat3]);

  console.log('Insertando productos...');
  const p1 = productRepo.create({
    nombre: 'Laptop Pro 15',
    descripcion: 'Laptop de alto rendimiento para desarrolladores',
    precio: 1500.00,
    stock: 15,
    imagenUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=2071&auto=format&fit=crop',
    category: cat1,
  });

  const p2 = productRepo.create({
    nombre: 'Smartphone X Max',
    descripcion: 'Teléfono inteligente con cámara de 108MP',
    precio: 899.99,
    stock: 30,
    imagenUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2080&auto=format&fit=crop',
    category: cat1,
  });

  const p3 = productRepo.create({
    nombre: 'Camiseta de Algodón Orgánico',
    descripcion: 'Cómoda camiseta para el día a día',
    precio: 25.50,
    stock: 100,
    imagenUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2080&auto=format&fit=crop',
    category: cat2,
  });

  const p4 = productRepo.create({
    nombre: 'Cafetera Espresso Automática',
    descripcion: 'Prepara el mejor café con un solo botón',
    precio: 250.00,
    stock: 10,
    imagenUrl: 'https://images.unsplash.com/photo-1517246268060-9afce62809e2?q=80&w=2072&auto=format&fit=crop',
    category: cat3,
  });

  await productRepo.save([p1, p2, p3, p4]);

  console.log('Seeder ejecutado con éxito. ¡Productos y categorías de prueba cargados!');
  await dataSource.destroy();
}

runSeeder().catch(console.error);
