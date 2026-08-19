import { DataSource } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import typeOrmConfig from '../../../typeorm.config';
import { ProductStatus } from '../products/enums/product-status.enum';

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
    { commercialName: 'Smartphone X Pro', description: 'Teléfono de última generación con pantalla OLED de 6.5 pulgadas y triple cámara.', salePrice: 899.99, status: ProductStatus.ACTIVE },
    { commercialName: 'Laptop UltraSlim', description: 'Portátil ligero con procesador i7, 16GB RAM y 512GB SSD. Ideal para profesionales.', salePrice: 1299.50, status: ProductStatus.ACTIVE },
    { commercialName: 'Auriculares Inalámbricos Noise Cancelling', description: 'Auriculares con cancelación de ruido activa y hasta 30 horas de autonomía.', salePrice: 199.99, status: ProductStatus.ACTIVE },
    { commercialName: 'Smartwatch Fitness Tracker', description: 'Reloj inteligente resistente al agua con monitor de ritmo cardíaco y GPS.', salePrice: 149.00, status: ProductStatus.ACTIVE },
    { commercialName: 'Tablet Pro 11"', description: 'Tablet perfecta para diseño gráfico y entretenimiento con lápiz digital incluido.', salePrice: 649.00, status: ProductStatus.ACTIVE },
    { commercialName: 'Cámara Mirrorless 4K', description: 'Cámara sin espejo con grabación en 4K y lente intercambiable de 50mm.', salePrice: 950.00, status: ProductStatus.ACTIVE },
    { commercialName: 'Monitor Curvo 27" 144Hz', description: 'Monitor gaming curvo con alta tasa de refresco y tiempo de respuesta de 1ms.', salePrice: 299.99, status: ProductStatus.ACTIVE },
    { commercialName: 'Teclado Mecánico RGB', description: 'Teclado mecánico con switches rojos y retroiluminación RGB personalizable.', salePrice: 89.90, status: ProductStatus.ACTIVE },
    { commercialName: 'Ratón Gaming Inalámbrico', description: 'Ratón ergonómico con sensor óptico de alta precisión y botones programables.', salePrice: 59.99, status: ProductStatus.ACTIVE },
    { commercialName: 'Altavoz Bluetooth Portátil', description: 'Altavoz compacto con sonido 360 y resistencia al agua IPX7.', salePrice: 45.00, status: ProductStatus.ACTIVE },

    // --- Categoría 2: Ropa ---
    { commercialName: 'Camiseta de Algodón Orgánico', description: 'Camiseta básica de manga corta en algodón 100% orgánico.', salePrice: 19.99, status: ProductStatus.ACTIVE },
    { commercialName: 'Jeans Slim Fit Clásicos', description: 'Pantalones vaqueros de corte ajustado y tejido elástico para mayor comodidad.', salePrice: 49.50, status: ProductStatus.ACTIVE },
    { commercialName: 'Chaqueta de Cuero Vintage', description: 'Chaqueta de cuero genuino con forro interior y cremalleras metálicas.', salePrice: 159.00, status: ProductStatus.ACTIVE },
    { commercialName: 'Zapatillas Deportivas Running', description: 'Zapatillas ligeras con suela de amortiguación avanzada para correr.', salePrice: 85.00, status: ProductStatus.ACTIVE },
    { commercialName: 'Sudadera con Capucha', description: 'Sudadera unisex con bolsillo canguro y capucha ajustable.', salePrice: 35.00, status: ProductStatus.ACTIVE },
    { commercialName: 'Gorra de Béisbol Ajustable', description: 'Gorra clásica de algodón transpirable con cierre de correa trasera.', salePrice: 15.99, status: ProductStatus.ACTIVE },
    { commercialName: 'Abrigo de Lana Invierno', description: 'Elegante abrigo de lana con botones cruzados, ideal para el frío.', salePrice: 120.00, status: ProductStatus.ACTIVE },
    { commercialName: 'Pantalón Deportivo Jogger', description: 'Pantalón deportivo cómodo con cintura elástica y bolsillos laterales.', salePrice: 29.90, status: ProductStatus.ACTIVE },
    { commercialName: 'Mochila Casual de Lona', description: 'Mochila resistente al agua con compartimento especial para portátil.', salePrice: 45.00, status: ProductStatus.ACTIVE },
    { commercialName: 'Gafas de Sol Polarizadas', description: 'Gafas de sol con protección UV400 y montura ligera de acetato.', salePrice: 25.50, status: ProductStatus.ACTIVE },

    // --- Categoría 3: Hogar ---
    { commercialName: 'Cafetera Espresso Automática', description: 'Cafetera italiana de 15 bares con espumador de leche.', salePrice: 180.00, status: ProductStatus.ACTIVE },
    { commercialName: 'Lámpara de Mesa Minimalista', description: 'Lámpara LED regulable con diseño nórdico y base de madera.', salePrice: 39.99, status: ProductStatus.ACTIVE },
    { commercialName: 'Sartén Antiadherente de Titanio', description: 'Sartén de 28cm apta para inducción con recubrimiento libre de PFOA.', salePrice: 32.50, status: ProductStatus.ACTIVE },
    { commercialName: 'Juego de Sábanas de Bambú', description: 'Set de cama ultra suave e hipoalergénico, incluye fundas de almohada.', salePrice: 65.00, status: ProductStatus.ACTIVE },
    { commercialName: 'Humidificador Ultrasónico', description: 'Humidificador de aire silencioso con aromaterapia y luz nocturna.', salePrice: 28.00, status: ProductStatus.ACTIVE },
    { commercialName: 'Cojines Decorativos (Set de 2)', description: 'Cojines de lino texturizado con relleno incluido, 45x45cm.', salePrice: 22.90, status: ProductStatus.ACTIVE },
    { commercialName: 'Robot Aspirador Inteligente', description: 'Robot aspirador y friegasuelos compatible con asistentes de voz.', salePrice: 249.99, status: ProductStatus.ACTIVE },
    { commercialName: 'Vela Aromática de Vainilla', description: 'Vela de cera de soja 100% natural con duración de hasta 50 horas.', salePrice: 12.50, status: ProductStatus.ACTIVE },
    { commercialName: 'Maceta de Cerámica con Soporte', description: 'Elegante maceta de cerámica blanca con pie de madera de fresno.', salePrice: 25.00, status: ProductStatus.ACTIVE },
    { commercialName: 'Alfombra de Estilo Bereber', description: 'Alfombra de salón mullida y cálida con diseño geométrico, 160x230cm.', salePrice: 89.00, status: ProductStatus.ACTIVE }
  ];

  const productsToInsert = productRepo.create(productosData);
  await productRepo.save(productsToInsert);

  console.log('Seeder ejecutado con éxito. ¡Productos y categorías de prueba cargados!');
  await dataSource.destroy();
}

runSeeder().catch(console.error);
