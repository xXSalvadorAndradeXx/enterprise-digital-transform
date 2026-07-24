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
  
  const productosData = [
    // --- Categoría 1: Electrónica ---
    { nombre: 'Smartphone X Pro', descripcion: 'Teléfono de última generación con pantalla OLED de 6.5 pulgadas y triple cámara.', precio: 899.99, stock: 50, imagenUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop', category: cat1 },
    { nombre: 'Laptop UltraSlim', descripcion: 'Portátil ligero con procesador i7, 16GB RAM y 512GB SSD. Ideal para profesionales.', precio: 1299.50, stock: 30, imagenUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=1000&auto=format&fit=crop', category: cat1 },
    { nombre: 'Auriculares Inalámbricos Noise Cancelling', descripcion: 'Auriculares con cancelación de ruido activa y hasta 30 horas de autonomía.', precio: 199.99, stock: 100, imagenUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1000&auto=format&fit=crop', category: cat1 },
    { nombre: 'Smartwatch Fitness Tracker', descripcion: 'Reloj inteligente resistente al agua con monitor de ritmo cardíaco y GPS.', precio: 149.00, stock: 75, imagenUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=1000&auto=format&fit=crop', category: cat1 },
    { nombre: 'Tablet Pro 11"', descripcion: 'Tablet perfecta para diseño gráfico y entretenimiento con lápiz digital incluido.', precio: 649.00, stock: 40, imagenUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=1000&auto=format&fit=crop', category: cat1 },
    { nombre: 'Cámara Mirrorless 4K', descripcion: 'Cámara sin espejo con grabación en 4K y lente intercambiable de 50mm.', precio: 950.00, stock: 15, imagenUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop', category: cat1 },
    { nombre: 'Monitor Curvo 27" 144Hz', descripcion: 'Monitor gaming curvo con alta tasa de refresco y tiempo de respuesta de 1ms.', precio: 299.99, stock: 60, imagenUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1000&auto=format&fit=crop', category: cat1 },
    { nombre: 'Teclado Mecánico RGB', descripcion: 'Teclado mecánico con switches rojos y retroiluminación RGB personalizable.', precio: 89.90, stock: 120, imagenUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=1000&auto=format&fit=crop', category: cat1 },
    { nombre: 'Ratón Gaming Inalámbrico', descripcion: 'Ratón ergonómico con sensor óptico de alta precisión y botones programables.', precio: 59.99, stock: 85, imagenUrl: 'https://images.unsplash.com/photo-1527814050087-37938154798f?q=80&w=1000&auto=format&fit=crop', category: cat1 },
    { nombre: 'Altavoz Bluetooth Portátil', descripcion: 'Altavoz compacto con sonido 360 y resistencia al agua IPX7.', precio: 45.00, stock: 200, imagenUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=1000&auto=format&fit=crop', category: cat1 },

    // --- Categoría 2: Ropa ---
    { nombre: 'Camiseta de Algodón Orgánico', descripcion: 'Camiseta básica de manga corta en algodón 100% orgánico.', precio: 19.99, stock: 300, imagenUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop', category: cat2 },
    { nombre: 'Jeans Slim Fit Clásicos', descripcion: 'Pantalones vaqueros de corte ajustado y tejido elástico para mayor comodidad.', precio: 49.50, stock: 150, imagenUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000&auto=format&fit=crop', category: cat2 },
    { nombre: 'Chaqueta de Cuero Vintage', descripcion: 'Chaqueta de cuero genuino con forro interior y cremalleras metálicas.', precio: 159.00, stock: 40, imagenUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop', category: cat2 },
    { nombre: 'Zapatillas Deportivas Running', descripcion: 'Zapatillas ligeras con suela de amortiguación avanzada para correr.', precio: 85.00, stock: 90, imagenUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop', category: cat2 },
    { nombre: 'Sudadera con Capucha', descripcion: 'Sudadera unisex con bolsillo canguro y capucha ajustable.', precio: 35.00, stock: 200, imagenUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop', category: cat2 },
    { nombre: 'Gorra de Béisbol Ajustable', descripcion: 'Gorra clásica de algodón transpirable con cierre de correa trasera.', precio: 15.99, stock: 150, imagenUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000&auto=format&fit=crop', category: cat2 },
    { nombre: 'Abrigo de Lana Invierno', descripcion: 'Elegante abrigo de lana con botones cruzados, ideal para el frío.', precio: 120.00, stock: 25, imagenUrl: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?q=80&w=1000&auto=format&fit=crop', category: cat2 },
    { nombre: 'Pantalón Deportivo Jogger', descripcion: 'Pantalón deportivo cómodo con cintura elástica y bolsillos laterales.', precio: 29.90, stock: 110, imagenUrl: 'https://images.unsplash.com/photo-1584865288642-42078afe6942?q=80&w=1000&auto=format&fit=crop', category: cat2 },
    { nombre: 'Mochila Casual de Lona', descripcion: 'Mochila resistente al agua con compartimento especial para portátil.', precio: 45.00, stock: 80, imagenUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop', category: cat2 },
    { nombre: 'Gafas de Sol Polarizadas', descripcion: 'Gafas de sol con protección UV400 y montura ligera de acetato.', precio: 25.50, stock: 140, imagenUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1000&auto=format&fit=crop', category: cat2 },

    // --- Categoría 3: Hogar ---
    { nombre: 'Cafetera Espresso Automática', descripcion: 'Cafetera italiana de 15 bares con espumador de leche.', precio: 180.00, stock: 20, imagenUrl: 'https://images.unsplash.com/photo-1517246268060-9afce62809e2?q=80&w=1000&auto=format&fit=crop', category: cat3 },
    { nombre: 'Lámpara de Mesa Minimalista', descripcion: 'Lámpara LED regulable con diseño nórdico y base de madera.', precio: 39.99, stock: 65, imagenUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1000&auto=format&fit=crop', category: cat3 },
    { nombre: 'Sartén Antiadherente de Titanio', descripcion: 'Sartén de 28cm apta para inducción con recubrimiento libre de PFOA.', precio: 32.50, stock: 85, imagenUrl: 'https://images.unsplash.com/photo-1584990347449-a6efa1a53afb?q=80&w=1000&auto=format&fit=crop', category: cat3 },
    { nombre: 'Juego de Sábanas de Bambú', descripcion: 'Set de cama ultra suave e hipoalergénico, incluye fundas de almohada.', precio: 65.00, stock: 45, imagenUrl: 'https://images.unsplash.com/photo-1522771731478-44eb10f52bce?q=80&w=1000&auto=format&fit=crop', category: cat3 },
    { nombre: 'Humidificador Ultrasónico', descripcion: 'Humidificador de aire silencioso con aromaterapia y luz nocturna.', precio: 28.00, stock: 100, imagenUrl: 'https://images.unsplash.com/photo-1585565804112-f201f68c48b4?q=80&w=1000&auto=format&fit=crop', category: cat3 },
    { nombre: 'Cojines Decorativos (Set de 2)', descripcion: 'Cojines de lino texturizado con relleno incluido, 45x45cm.', precio: 22.90, stock: 120, imagenUrl: 'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?q=80&w=1000&auto=format&fit=crop', category: cat3 },
    { nombre: 'Robot Aspirador Inteligente', descripcion: 'Robot aspirador y friegasuelos compatible con asistentes de voz.', precio: 249.99, stock: 15, imagenUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=1000&auto=format&fit=crop', category: cat3 },
    { nombre: 'Vela Aromática de Vainilla', descripcion: 'Vela de cera de soja 100% natural con duración de hasta 50 horas.', precio: 12.50, stock: 250, imagenUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=1000&auto=format&fit=crop', category: cat3 },
    { nombre: 'Maceta de Cerámica con Soporte', descripcion: 'Elegante maceta de cerámica blanca con pie de madera de fresno.', precio: 25.00, stock: 90, imagenUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=1000&auto=format&fit=crop', category: cat3 },
    { nombre: 'Alfombra de Estilo Bereber', descripcion: 'Alfombra de salón mullida y cálida con diseño geométrico, 160x230cm.', precio: 89.00, stock: 35, imagenUrl: 'https://images.unsplash.com/photo-1600166898405-da9535204843?q=80&w=1000&auto=format&fit=crop', category: cat3 }
  ];

  const productsToInsert = productosData.map(data => productRepo.create(data));
  await productRepo.save(productsToInsert);

  console.log('Seeder ejecutado con éxito. ¡Productos y categorías de prueba cargados!');
  await dataSource.destroy();
}

runSeeder().catch(console.error);
