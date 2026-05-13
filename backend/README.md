## Endpoints

### Productos

#### GET /api/products

Retorna el listado de productos activos con paginación.

**Query Parameters**

| Parámetro | Tipo    | Requerido | Default | Descripción                      |
|-----------|---------|-----------|---------|----------------------------------|
| limit     | integer | No        | 10      | Cantidad de resultados (1–100)   |
| offset    | integer | No        | 0       | Número de registros a saltar     |

**Ejemplos de petición**

\`\`\`
GET /api/products
GET /api/products?limit=20&offset=0
GET /api/products?limit=10&offset=30
\`\`\`

**Respuesta exitosa — 200 OK**

\`\`\`json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Teclado Mecánico",
      "price": "89.99",
      "stock": 15,
      "category": { "id": "...", "name": "Periféricos" },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 47,
    "limit": 10,
    "offset": 0,
    "totalPages": 5,
    "currentPage": 1,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
\`\`\`

**Respuestas de error**

| Código | Causa                           |
|--------|---------------------------------|
| 400    | limit o offset con valor inválido |
| 500    | Error interno del servidor      |

**Fórmula para navegar páginas**

\`\`\`
offset = (página - 1) × limit
\`\`\`