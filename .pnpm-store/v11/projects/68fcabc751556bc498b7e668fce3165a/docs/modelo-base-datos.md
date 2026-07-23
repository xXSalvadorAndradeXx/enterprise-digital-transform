# Modelo de Base de Datos - E-Commerce

## Objetivo

Este documento define una propuesta inicial del modelo de base de datos desde la perspectiva del Frontend, su propósito es servir como referencia para el equipo Backend al momento de crear las entidades, relaciones y endpoints principales del sistema.

## Entidades principales

Para el sistema e-commerce se identifican las siguientes entidades principales:

- Usuarios
- Categorías
- Productos
- Carrito
- Carrito Item

Estas entidades representan la base mínima necesaria para permitir el registro de usuarios, la gestión de productos, la clasificación por categorías y el manejo del carrito de compras.




## Atributos de las entidades

### 1. Usuarios

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| id | number | Identificador único del usuario. |
| nombre | string | Nombre completo del usuario. |
| email | string | Correo electrónico del usuario. |
| password | string | Contraseña cifrada del usuario. |
| rol | string | Rol del usuario, por ejemplo: cliente o administrador. |
| createdAt | date | Fecha de creación del usuario. |
| updatedAt | date | Fecha de última actualización. |

### 2. Categorías

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| id | number | Identificador único de la categoría. |
| nombre | string | Nombre de la categoría. |
| descripcion | string | Descripción breve de la categoría. |
| createdAt | date | Fecha de creación. |
| updatedAt | date | Fecha de última actualización. |

### 3. Productos

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| id | number | Identificador único del producto. |
| nombre | string | Nombre del producto. |
| descripcion | string | Descripción del producto. |
| precio | decimal | Precio del producto. |
| stock | number | Cantidad disponible en inventario. |
| imagenUrl | string | URL o ruta de la imagen del producto. |
| categoriaId | number | Relación con la categoría a la que pertenece. |
| createdAt | date | Fecha de creación del producto. |
| updatedAt | date | Fecha de última actualización. |

### 4. Carrito

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| id | number | Identificador único del carrito. |
| usuarioId | number | Relación con el usuario propietario del carrito. |
| estado | string | Estado del carrito, por ejemplo: activo o finalizado. |
| createdAt | date | Fecha de creación del carrito. |
| updatedAt | date | Fecha de última actualización. |

### 5. Carrito Item

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| id | number | Identificador único del item del carrito. |
| carritoId | number | Relación con el carrito al que pertenece. |
| productoId | number | Relación con el producto agregado. |
| cantidad | number | Cantidad del producto seleccionado. |
| precioUnitario | decimal | Precio del producto al momento de agregarlo al carrito. |
| subtotal | decimal | Resultado de cantidad por precio unitario. |
| createdAt | date | Fecha de creación del item. |
| updatedAt | date | Fecha de última actualización. |




## Relaciones entre entidades

### Usuario y Carrito

Un usuario puede tener uno o varios carritos durante el uso del sistema, cada carrito pertenece a un solo usuario.

**Relación:**  
Usuario 1 → N Carritos

### Categoría y Producto

Una categoría puede contener varios productos, cada producto pertenece a una sola categoría.

**Relación:**  
Categoría 1 → N Productos

### Carrito y Carrito Item

Un carrito puede contener varios items, cada item pertenece a un solo carrito.

**Relación:**  
Carrito 1 → N Carrito Items

### Producto y Carrito Item

Un producto puede estar presente en varios items de carrito, cada item hace referencia a un solo producto.

**Relación:**  
Producto 1 → N Carrito Items




## Modelo visual de referencia

```text
USUARIOS
- id
- nombre
- email
- password
- rol
        │
        │ 1 a N
        ▼
CARRITO
- id
- usuarioId
- estado
        │
        │ 1 a N
        ▼
CARRITO_ITEM
- id
- carritoId
- productoId
- cantidad
- precioUnitario
- subtotal
        ▲
        │ N a 1
        │
PRODUCTOS
- id
- nombre
- descripcion
- precio
- stock
- imagenUrl
- categoriaId
        ▲
        │ N a 1
        │
CATEGORÍAS
- id
- nombre
- descripcion





## Nota para el equipo Backend

Este modelo es una propuesta inicial creada desde el Frontend para definir los datos que serán necesarios en la interfaz del e-commerce.

El equipo Backend puede ajustar nombres de campos, tipos de datos o relaciones según la base de datos y el framework utilizado, sin embargo, se recomienda mantener estas entidades principales para asegurar una correcta integración entre Frontend y Backend.

## Endpoints sugeridos para integración futura

| Entidad | Endpoint sugerido | Método | Descripción |
|---|---|---|---|
| Usuarios | /api/usuarios | POST | Registrar un nuevo usuario. |
| Usuarios | /api/auth/login | POST | Iniciar sesión. |
| Categorías | /api/categorias | GET | Obtener listado de categorías. |
| Productos | /api/productos | GET | Obtener listado de productos. |
| Productos | /api/productos/:id | GET | Obtener detalle de un producto. |
| Carrito | /api/carrito | GET | Obtener el carrito del usuario. |
| Carrito Item | /api/carrito/items | POST | Agregar producto al carrito. |
| Carrito Item | /api/carrito/items/:id | DELETE | Eliminar producto del carrito. |

## Consideraciones finales

El modelo propuesto permite organizar las entidades principales del sistema e-commerce sirve como base para que el equipo Backend pueda crear la estructura de datos y los endpoints necesarios para la comunicación con el Frontend.