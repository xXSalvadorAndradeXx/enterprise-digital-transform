# Referencia de Endpoints

**URL Base:** `http://localhost:3000`

---

## Listado de Endpoints

| # | Método | Endpoint | URL |
|---|--------|----------|-----|
| 1 | `POST` | Login | `http://localhost:3000/auth/login` |
| 2 | `POST` | Register | `http://localhost:3000/auth/register` |
| 3 | `GET` | Categorías | `http://localhost:3000/categories` |
| 4 | `GET` | Productos | `http://localhost:3000/products` |
| 5 | `GET` | Producto por ID | `http://localhost:3000/products/:id` |
| 6 | `GET` | Carrito | `http://localhost:3000/cart` |

---

## Notas y Detalles

### Endpoint 5 — Producto por ID

Reemplaza `:id` con el ID numérico del producto deseado.

```
GET http://localhost:3000/products/1
```

### Endpoint 6 — Carrito

Requiere enviar un token de autenticación en el header de la petición.

```
Authorization: Bearer <token>
```

---

## Filtros y Búsqueda — Endpoint 4 (`/products`)

El endpoint de productos acepta los siguientes query params de forma individual o combinada:

| Parámetro | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `search` | string | Búsqueda por texto | `?search=gamer` |
| `minPrice` | number | Precio mínimo | `?minPrice=100` |
| `maxPrice` | number | Precio máximo | `?maxPrice=2000` |
| `categoryId` | number | Filtrar por categoría | `?categoryId=1` |
| `limit` | number | Máx. resultados a retornar | `?limit=10` |
| `offset` | number | Registros a omitir (paginación) | `?offset=0` |

### Ejemplos de uso

**Búsqueda por texto:**
```
GET http://localhost:3000/products?search=gamer
```

**Rango de precios:**
```
GET http://localhost:3000/products?minPrice=100&maxPrice=2000
```

**Filtrar por categoría:**
```
GET http://localhost:3000/products?categoryId=1
```

**Combinado con paginación:**
```
GET http://localhost:3000/products?search=laptop&minPrice=1000&categoryId=1&limit=5&offset=0
```