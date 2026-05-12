# Endpoints
| # | Método | Endpoint | URL |
|---|--------|----------|-----|
| 1 | POST | Login | http://localhost:3000/auth/login |
| 2 | POST | Register | http://localhost:3000/auth/register |
| 3 | GET | Categorías | http://localhost:3000/categories |
| 4 | GET | Productos | http://localhost:3000/products |
| 5 | GET | Producto por ID | http://localhost:3000/products/:id |
| 6 | GET | Carrito  | http://localhost:3000/cart |

---

Notas
Endpoint 5 — Para buscar un producto específico, reemplaza :id con el ID deseado.
Ejemplo: http://localhost:3000/products/1

Endpoint 6 — Requiere enviar un Token de autenticación en los headers de la petición.