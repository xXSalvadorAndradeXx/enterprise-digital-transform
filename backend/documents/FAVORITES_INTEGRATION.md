# Contrato de Integración y Documentación del Módulo de Favoritos (BE-CUST-FAV)

## 1. Visión General de la Arquitectura
El módulo de Favoritos (`CustomerFavorite`) gestiona la relación comercial entre **Clientes** (`Customer`) y **Productos** (`Product`).

### Principios Clave de Diseño:
1. **Persistencia Pura de Relación:** Se almacena únicamente `(customer_id, product_id, created_at)`. No se duplican imágenes, precios, nombres ni stock.
2. **Aislamiento de la Lógica de Carrito:** Favoritos no persiste variantes (tallas/colores) ni cantidades. La acción *"Mover/Añadir al carrito"* desde la lista de Favoritos reutiliza directamente la API existente de Carrito (`POST /api/v1/cart/items`).
3. **Cálculo en Tiempo Real:** El precio efectivo, descuentos vigentes y el stock se calculan en tiempo real consumiendo `ProductSpecification` y `PublicProductResponseDto`.
4. **Seguridad y Ownership:** Todos los endpoints requieren autenticación mediante JWT de cliente (`CustomerJwtAuthGuard`). El `customerId` jamás se envía en la petición HTTP; se resuelve automáticamente en el servidor desde `req.user.id`.

---

## 2. Endpoints REST Expuestos

### 2.1 GET `/api/v1/customers/me/favorites` — Listar Favoritos
* **Descripción:** Retorna la lista paginada de productos favoritos del cliente autenticado.
* **Query Params:** `page` (default 1), `limit` (default 10).
* **Respuesta Exitosa (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "favoriteId": "c9f8a7b6-e5d4-4000-a000-ef1234567890",
        "createdAt": "2026-08-25T20:00:00.000Z",
        "product": {
          "id": "a1b2c3d4-e5f6-4000-a000-ef1234567890",
          "commercialName": "Tenis Deportivos Runner Pro",
          "description": "Tenis de alto rendimiento",
          "brand": "Nike",
          "gender": "UNISEX",
          "category": { "id": "cat-01", "name": "Calzado" },
          "salePrice": "50.00",
          "effectivePrice": "40.00",
          "finalPrice": "40.00",
          "discount": { "percentage": 20, "isActive": true },
          "imageUrl": "http://localhost:3000/uploads/products/front-01.webp",
          "hasDiscount": true,
          "stockTotal": 15,
          "inStock": true,
          "availability": "IN_STOCK",
          "isPublished": true,
          "availableSizes": ["38", "39", "40"],
          "variants": [
            {
              "id": "var-cfg-uuid-1",
              "sku": "SKU-TENIS-38",
              "size": "38",
              "color": "Negro",
              "stock": 5,
              "stockStatus": "IN_STOCK"
            }
          ]
        }
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 2.2 POST `/api/v1/customers/me/favorites` — Agregar a Favoritos
* **Descripción:** Agrega un producto a la lista del cliente de forma **idempotente**.
* **Body:**
```json
{
  "productId": "a1b2c3d4-e5f6-4000-a000-ef1234567890"
}
```
* **Respuesta Exitosa (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "favoriteId": "c9f8a7b6-e5d4-4000-a000-ef1234567890",
    "createdAt": "2026-08-25T20:00:00.000Z",
    "product": { ... }
  }
}
```

---

### 2.3 GET `/api/v1/customers/me/favorites/:productId/status` — Verificar Estado (Corazón Global)
* **Descripción:** Retorna rápidamente si un producto específico está marcado como favorito por el cliente.
* **Respuesta Exitosa (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "productId": "a1b2c3d4-e5f6-4000-a000-ef1234567890",
    "isFavorite": true
  }
}
```

---

### 2.4 DELETE `/api/v1/customers/me/favorites/:productId` — Eliminar Favorito Individual
* **Descripción:** Elimina un producto específico de la lista del cliente.
* **Respuesta Exitosa (`200 OK`):**
```json
{
  "success": true,
  "message": "Producto eliminado de favoritos correctamente"
}
```

---

### 2.5 DELETE `/api/v1/customers/me/favorites` — Vaciar Lista Completa (`clear-all`)
* **Descripción:** Elimina en una sola instrucción SQL masiva todos los favoritos del cliente.
* **Respuesta Exitosa (`200 OK`):**
```json
{
  "success": true,
  "message": "Todos los favoritos han sido eliminados correctamente",
  "data": {
    "deletedCount": 5
  }
}
```

---

## 3. Integración Frontend: Favoritos → Detalle de Producto / Carrito

1. **Añadir al Carrito desde Favoritos:**
   * Al hacer clic en *"Añadir al carrito"* dentro de la tarjeta de favoritos:
   * Si el producto posee múltiples variantes (`product.variants`), el Frontend despliega la modal de selección de talla/color (`BuyNowVariantModal`).
   * Una vez seleccionada la variante (`variantId`), el Frontend invoca `POST /api/v1/cart/items` pasando `{ productId, variantId, quantity }`.
   * **Favoritos no requiere ni almacena `variantId`.**

2. **Productos Despublicados o Agotados:**
   * Si un producto es despublicado (`isPublished = false`), el backend responde con `inStock: false` y `availability: "UNAVAILABLE"`.
   * Si el producto no tiene existencias (`stockTotal = 0`), el backend responde con `inStock: false` y `availability: "OUT_OF_STOCK"`.
   * Si el producto fue eliminado (`deletedAt !== null`), el backend lo excluye automáticamente del listado.

---

## 4. Estándar de Errores

| Código de Estado | `error.code` | Descripción |
| :--- | :--- | :--- |
| **`400 Bad Request`** | `VALIDATION_ERROR` | El `productId` no cumple con el formato UUID v4. |
| **`401 Unauthorized`** | `UNAUTHORIZED` | Token JWT ausente, expirado o inválido. |
| **`404 Not Found`** | `PRODUCT_NOT_FOUND` | El producto a agregar no existe o fue eliminado. |
| **`404 Not Found`** | `FAVORITE_NOT_FOUND` | Intento de eliminar un producto que no está en favoritos. |
| **`409 Conflict`** | `FAVORITE_ALREADY_EXISTS` | Intento de agregar un producto que ya pertenece a la lista. |
