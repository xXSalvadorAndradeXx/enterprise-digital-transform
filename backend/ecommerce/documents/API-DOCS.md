# Documentación de API 

**URL Base Local:** `http://localhost:3000`  

## 1. Autenticación

### Registrar Usuario
* **Método:** `POST`
* **Endpoint:** `/auth/register`
* **Descripción:** Crea un nuevo usuario en la base de datos.
* **Body (JSON):**
  ```json
  {
    "nombre": "Juan Perez",
    "email": "juan@example.com",
    "password": "password123",
    "rol": "cliente" 
  }

### Iniciar Sesión
* **Método:** `POST`
* **Endpoint:** `/auth/login`
* **Descripción:** Valida las credenciales y devuelve un token de acceso.
* **Body (JSON):**
  ```json
  {
    "email": "juan@example.com",
    "password": "password123"
  }  

## 2. Catálogo Público

### Listar Productos (Con Paginación)
* **Método:** `GET`
* **Endpoint:** `/products`
* **Descripción:** Obtiene la lista de productos disponibles. Soporta paginación mediante query params.
* **Query Params (Opcionales):**
  * `limit` (number): Cantidad máxima de registros a retornar (Default: 10).
  * `offset` (number): Cantidad de registros a omitir (Default: 0).
* **Headers:** No requiere.
* **Respuesta Exitosa (200):**
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

### Listar Categorías
* **Método:** `GET`
* **Endpoint:** `/categories`
* **Descripción:** Obtiene todas las categorías disponibles.
* **Headers:** No requiere.
* **Respuesta Exitosa (200):**
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

## 3. Carrito Privado

### Verificar / Ver Carrito Activo
* **Método:** `GET`
* **Endpoint:** `/cart`
* **Descripción:** Retorna el carrito activo del usuario autenticado junto con sus items.
* **Headers Requeridos:** `Authorization: Bearer <token>`
* **Respuesta Exitosa (200):**
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