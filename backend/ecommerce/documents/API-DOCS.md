# Documentación de API

**URL Base Local:** `http://localhost:3000`

---

## Índice

1. [Autenticación](#1-autenticación)
   - [Registrar Usuario](#11-registrar-usuario)
   - [Iniciar Sesión](#12-iniciar-sesión)
2. [Catálogo Público](#2-catálogo-público)
   - [Listar Productos](#21-listar-productos-con-paginación)
   - [Listar Categorías](#22-listar-categorías)
   - [Obtener Producto por ID](#23-obtener-producto-por-id)
3. [Gestión de Productos *(Admin)*](#3-gestión-de-productos-admin)
   - [Crear Producto](#31-crear-producto)
   - [Actualizar Producto](#32-actualizar-producto)
   - [Eliminar Producto](#33-eliminar-producto-soft-delete)
4. [Carrito Privado](#4-carrito-privado)
   - [Ver Carrito Activo](#41-verificar--ver-carrito-activo)

---

## 1. Autenticación

Endpoints públicos que no requieren token. Tras un login exitoso el servidor devuelve un JWT que debe incluirse en el header `Authorization` para todas las rutas protegidas.

---

### 1.1 Registrar Usuario

| Campo | Detalle |
|---|---|
| **Método** | `POST` |
| **Endpoint** | `/auth/register` |
| **Autenticación** | No requerida |
| **Descripción** | Crea un nuevo usuario en la base de datos. |

**Body (JSON):**
```json
{
  "nombre": "Juan Perez",
  "email": "juan@example.com",
  "password": "password123",
  "rol": "cliente"
}
```

---

### 1.2 Iniciar Sesión

| Campo | Detalle |
|---|---|
| **Método** | `POST` |
| **Endpoint** | `/auth/login` |
| **Autenticación** | No requerida |
| **Descripción** | Valida las credenciales y devuelve un token JWT de acceso. |

**Body (JSON):**
```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

---

## 2. Catálogo Público

Endpoints de solo lectura accesibles sin autenticación.

---

### 2.1 Listar Productos (con Paginación)

| Campo | Detalle |
|---|---|
| **Método** | `GET` |
| **Endpoint** | `/products` |
| **Autenticación** | No requerida |
| **Descripción** | Obtiene la lista de productos disponibles. Soporta paginación mediante query params. |

**Query Params (opcionales):**

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `limit` | number | `10` | Cantidad máxima de registros a retornar. |
| `offset` | number | `0` | Cantidad de registros a omitir. |

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Productos obtenidos",
  "data": {
    "products": [
      {
        "id": 1,
        "nombre": "Laptop Gamer",
        "precio": "1500.00",
        "stock": 10,
        "category": {
          "id": 1,
          "nombre": "Laptops"
        }
      }
    ],
    "total": 1
  }
}
```

---

### 2.2 Listar Categorías

| Campo | Detalle |
|---|---|
| **Método** | `GET` |
| **Endpoint** | `/categories` |
| **Autenticación** | No requerida |
| **Descripción** | Obtiene todas las categorías disponibles. |

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Categorías obtenidas",
  "data": [
    {
      "id": 1,
      "nombre": "Laptops",
      "descripcion": "Equipos portátiles para trabajo"
    }
  ]
}
```

---

### 2.3 Obtener Producto por ID

| Campo | Detalle |
|---|---|
| **Método** | `GET` |
| **Endpoint** | `/products/:id` |
| **Autenticación** | No requerida |
| **Descripción** | Retorna un producto específico por su ID. Devuelve `404` si no existe. |

**Ejemplos de petición:**
```http
# Producto existente
GET http://localhost:3000/products/1

# Producto no existente (prueba de 404)
GET http://localhost:3000/products/9999
```

---

## 3. Gestión de Productos *(Admin)*

Endpoints protegidos que requieren un JWT válido de un usuario con rol `admin`.

> **Header requerido en todos los endpoints de esta sección:**
> ```
> Authorization: Bearer <token>
> Content-Type: application/json
> ```

---

### 3.1 Crear Producto

| Campo | Detalle |
|---|---|
| **Método** | `POST` |
| **Endpoint** | `/products` |
| **Autenticación** | Requerida — rol `admin` |
| **Descripción** | Crea un nuevo producto en el catálogo. |

**Body (JSON):**
```json
{
  "nombre": "Nuevo Producto",
  "descripcion": "Descripción detallada del nuevo producto.",
  "precio": 99.99,
  "stock": 50,
  "imagenUrl": "https://ejemplo.com/imagen.png",
  "categoryId": 1
}
```

---

### 3.2 Actualizar Producto

| Campo | Detalle |
|---|---|
| **Método** | `PATCH` |
| **Endpoint** | `/products/:id` |
| **Autenticación** | Requerida — rol `admin` |
| **Descripción** | Actualiza parcialmente los datos de un producto existente. |

**Body (JSON):** *(solo los campos a modificar)*
```json
{
  "precio": 89.99
}
```

---

### 3.3 Eliminar Producto *(Soft Delete)*

| Campo | Detalle |
|---|---|
| **Método** | `DELETE` |
| **Endpoint** | `/products/:id` |
| **Autenticación** | Requerida — rol `admin` |
| **Descripción** | Realiza un borrado lógico del producto (no se elimina físicamente de la base de datos). |

**Ejemplo de petición:**
```http
DELETE http://localhost:3000/products/1
Authorization: Bearer <token>
```

---

## 4. Carrito Privado

Endpoints accesibles únicamente por usuarios autenticados con rol `cliente`.

---

### 4.1 Verificar / Ver Carrito Activo

| Campo | Detalle |
|---|---|
| **Método** | `GET` |
| **Endpoint** | `/cart` |
| **Autenticación** | Requerida — `Authorization: Bearer <token>` |
| **Descripción** | Retorna el carrito activo del usuario autenticado junto con sus ítems. |

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Conexión verificada",
  "data": [
    {
      "id": 1,
      "estado": "activo",
      "createdAt": "2026-05-09T10:05:00.000Z",
      "items": [
        {
          "id": 1,
          "cantidad": 2,
          "precioUnitario": "1250.50",
          "productId": 1
        }
      ]
    }
  ]
}
```