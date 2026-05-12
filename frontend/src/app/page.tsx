import ProductCard from "@/components/ProductCard";

export default function ProductosPage() {
  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold mb-8 text-white">
        Productos Destacados
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <ProductCard
          image="https://images.unsplash.com/photo-1496181133206-80ce9b88a853"
          name="Laptop Gamer"
          price={1200}
          buttonText="Ver Producto"
        />

        <ProductCard
          image="https://images.unsplash.com/photo-1527814050087-3793815479db"
          name="Mouse RGB"
          price={45}
          buttonText="Ver Producto"
        />

        <ProductCard
          image="https://images.unsplash.com/photo-1511467687858-23d96c32e4ae"
          name="Teclado Mecánico"
          price={80}
          buttonText="Ver Producto"
        />

      </div>
    </div>
  );
}