import { useState } from "react";
import "./index.css";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  icon: string;
}

export function App() {
  const [cartCount, setCartCount] = useState(3);
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    { name: "Smartphones", icon: "fa-mobile-alt", count: "12 modelos" },
    { name: "Audífonos", icon: "fa-headphones", count: "+20 productos" },
    { name: "Tablets", icon: "fa-tablet-alt", count: "Lectura y más" },
    { name: "Smartwatches", icon: "fa-clock", count: "Fit & tech" },
    { name: "Gaming", icon: "fa-gamepad", count: "Accesorios" },
    { name: "Accesorios", icon: "fa-plug", count: "Cargadores, cables" },
  ];

  const featuredProducts: Product[] = [
    { id: 1, name: "Audífonos ANC Pro", category: "Audio", price: 79.90, oldPrice: 129.00, icon: "fa-headphones" },
    { id: 2, name: "PhoneX 14 Pro Max", category: "Smartphones", price: 899.00, oldPrice: 1099.00, icon: "fa-mobile-alt" },
    { id: 3, name: "UltraBook Slim i7", category: "Computadoras", price: 1249.00, oldPrice: 1499.00, icon: "fa-laptop" },
    { id: 4, name: "Smartwatch Sport 5", category: "Wearables", price: 189.90, oldPrice: 249.90, icon: "fa-clock" },
    { id: 5, name: "Tab Ultra HD", category: "Tablets", price: 329.00, oldPrice: 429.00, icon: "fa-tablet-alt" },
    { id: 6, name: "Micrófono Condensador", category: "Streaming", price: 59.90, oldPrice: 99.00, icon: "fa-microphone-alt" },
  ];

  const newArrivals: Product[] = [
    { id: 7, name: "Gafas VR X-One", category: "Realidad Virtual", price: 399.00, icon: "fa-vr-cardboard" },
    { id: 8, name: "Teclado Mecánico RGB", category: "Periféricos", price: 89.90, oldPrice: 129.00, icon: "fa-keyboard" },
    { id: 9, name: "Powerbank 20000mAh", category: "Carga rápida", price: 39.90, icon: "fa-charging-station" },
  ];

  const handleAddToCart = (productName: string) => {
    setCartCount(prev => prev + 1);
    // Aquí puedes agregar lógica para mostrar notificación
    console.log(`${productName} añadido al carrito`);
  };

  const handleCategoryClick = (categoryName: string) => {
    alert(`Explorando productos en: ${categoryName}. Pronto más novedades.`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Buscando: ${searchTerm}`);
  };

  return (
    <div className="app">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="container nav-content">
          <div className="logo">
            <h1>TechStore</h1>
            <span>Innovación para tu día a día</span>
          </div>
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Buscar productos, marcas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit"><i className="fas fa-search"></i> Buscar</button>
          </form>
          <div className="nav-icons">
            <div className="icon-item"><i className="far fa-heart"></i></div>
            <div className="icon-item">
              <i className="fas fa-shopping-bag"></i>
              <span className="cart-badge">{cartCount}</span>
            </div>
            <div className="icon-item"><i className="far fa-user-circle"></i></div>
          </div>
        </div>
      </nav>

      <main>
        <div className="container">
          {/* HERO SECTION */}
          <section className="hero">
            <div className="hero-text">
              <span className="badge">✨ Ofertas exclusivas</span>
              <h2>Nuevos lanzamientos<br />hasta -30% OFF</h2>
              <p>Descubre lo último en tecnología, wearables y audio premium. Envío gratis en compras mayores a $50.</p>
              <button className="cta-button" onClick={() => alert('🚀 Descubre nuestras ofertas destacadas.')}>
                Comprar ahora <i className="fas fa-arrow-right"></i>
              </button>
            </div>
            <div className="hero-image">
              <i className="fas fa-laptop-code"></i>
            </div>
          </section>

          {/* CATEGORÍAS */}
          <div className="section-header">
            <h3>Categorías destacadas</h3>
            <a href="#">Ver todas <i className="fas fa-chevron-right"></i></a>
          </div>
          <div className="categories-grid">
            {categories.map((cat, idx) => (
              <div key={idx} className="category-card" onClick={() => handleCategoryClick(cat.name)}>
                <i className={`fas ${cat.icon}`}></i>
                <h4>{cat.name}</h4>
                <p>{cat.count}</p>
              </div>
            ))}
          </div>

          {/* PRODUCTOS DESTACADOS */}
          <div className="section-header">
            <h3>🔥 Productos más vendidos</h3>
            <a href="#">Ver colección <i className="fas fa-arrow-right"></i></a>
          </div>
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-img">
                  <i className={`fas ${product.icon}`}></i>
                </div>
                <div className="product-info">
                  <div className="product-category">{product.category}</div>
                  <div className="product-title">{product.name}</div>
                  <div className="price">
                    ${product.price.toFixed(2)}
                    {product.oldPrice && (
                      <span className="old-price">${product.oldPrice.toFixed(2)}</span>
                    )}
                  </div>
                  <button 
                    className="add-to-cart"
                    onClick={() => handleAddToCart(product.name)}
                  >
                    <i className="fas fa-shopping-cart"></i> Añadir al carrito
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* BANNER PROMOCIONAL */}
          <div className="promo-banner">
            <div className="promo-text">
              <h4>Hasta 40% OFF en audio</h4>
              <p>Audífonos, parlantes y más. Código: TECH40 · Por tiempo limitado.</p>
            </div>
            <button className="promo-btn" onClick={() => alert('🎧 Código TECH40 aplicado en el carrito.')}>
              Aprovechar oferta <i className="fas fa-tag"></i>
            </button>
          </div>

          {/* NUEVOS LLEGADOS */}
          <div className="section-header">
            <h3>✨ Recién llegados</h3>
            <a href="#">Explorar novedades</a>
          </div>
          <div className="products-grid">
            {newArrivals.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-img">
                  <i className={`fas ${product.icon}`}></i>
                </div>
                <div className="product-info">
                  <div className="product-category">{product.category}</div>
                  <div className="product-title">{product.name}</div>
                  <div className="price">
                    ${product.price.toFixed(2)}
                    {product.oldPrice && (
                      <span className="old-price">${product.oldPrice.toFixed(2)}</span>
                    )}
                  </div>
                  <button 
                    className="add-to-cart"
                    onClick={() => handleAddToCart(product.name)}
                  >
                    <i className="fas fa-shopping-cart"></i> Añadir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <h5>TechStore</h5>
              <p>La mejor tienda online de tecnología con envíos a toda Latinoamérica. Calidad y garantía en cada producto.</p>
              <div className="social-icons">
                <i className="fab fa-facebook-f"></i>
                <i className="fab fa-instagram"></i>
                <i className="fab fa-x-twitter"></i>
                <i className="fab fa-youtube"></i>
              </div>
            </div>
            <div className="footer-col">
              <h5>Compra</h5>
              <a href="#">Ofertas del día</a>
              <a href="#">Productos destacados</a>
              <a href="#">Nuevos ingresos</a>
              <a href="#">Próximamente</a>
            </div>
            <div className="footer-col">
              <h5>Soporte</h5>
              <a href="#">Centro de ayuda</a>
              <a href="#">Devoluciones</a>
              <a href="#">Garantía</a>
              <a href="#">Preguntas frecuentes</a>
            </div>
            <div className="footer-col">
              <h5>Contacto</h5>
              <a href="#"><i className="fas fa-envelope"></i> hola@techstore.com</a>
              <a href="#"><i className="fas fa-phone-alt"></i> +1 (800) 123-4567</a>
              <p><i className="fas fa-map-marker-alt"></i> Av. Tecnológica 123, CDMX</p>
            </div>
          </div>
          <div className="copyright">
            <p>&copy; 2025 TechStore. Todos los derechos reservados. | Hecho con <i className="fas fa-heart" style={{color: "#ef4444"}}></i> para los amantes de la tecnología</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
