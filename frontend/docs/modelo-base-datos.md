# Modelo de Base de Datos - E-Commerce

## Descripción General

este documento define una propuesta de modelo de base de datos relacional preliminar para el sistema E-Commerce, con el objetivo de definir las entidades principales, atributos y relaciones necesarias para la integración entre Frontend y Backend.

Este modelo servirá como referencia estructural para el desarrollo del Backend y la implementación futura de la base de datos relacional.

---

# Entidades del Sistema

---

## 1. Usuarios

Representa a los usuarios registrados dentro de la plataforma.

| Campo | Tipo | Descripción |
|---|---|---|
| id_usuario | PK | Identificador único del usuario |
| nombre | VARCHAR | Nombre del usuario |
| apellido | VARCHAR | Apellido del usuario |
| correo | VARCHAR | Correo electrónico |
| password | VARCHAR | Contraseña cifrada |
| telefono | VARCHAR | Número telefónico |
| direccion | TEXT | Dirección del usuario |
| rol | VARCHAR | Rol del usuario (ADMIN / CLIENTE) |
| fecha_registro | DATE | Fecha de registro |
| estado | VARCHAR | Estado del usuario |

---

## 2. Categorias

Representa las categorías de los productos.

| Campo | Tipo | Descripción |
|---|---|---|
| id_categoria | PK | Identificador de categoría |
| nombre_categoria | VARCHAR | Nombre de la categoría |
| descripcion | TEXT | Descripción de la categoría |
| estado | VARCHAR | Estado de la categoría |

---

## 3. Productos

Representa los productos disponibles dentro del sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| id_producto | PK | Identificador del producto |
| nombre | VARCHAR | Nombre del producto |
| descripcion | TEXT | Descripción |
| precio | DECIMAL | Precio del producto |
| stock | INT | Cantidad disponible |
| imagen | VARCHAR | URL de imagen |
| id_categoria | FK | Categoría asociada |
| estado | VARCHAR | Estado del producto |
| fecha_creacion | DATE | Fecha de creación |

---

## 4. Carrito

Representa el carrito de compras de los usuarios.

| Campo | Tipo | Descripción |
|---|---|---|
| id_carrito | PK | Identificador del carrito |
| id_usuario | FK | Usuario propietario |
| fecha_creacion | DATE | Fecha de creación |
| estado | VARCHAR | Estado del carrito |
| total | DECIMAL | Total acumulado |

---

## 5. Carrito_Item

Representa los productos agregados dentro del carrito.

| Campo | Tipo | Descripción |
|---|---|---|
| id_item | PK | Identificador del item |
| id_carrito | FK | Carrito asociado |
| id_producto | FK | Producto asociado |
| cantidad | INT | Cantidad del producto |
| precio_unitario | DECIMAL | Precio individual |
| subtotal | DECIMAL | Subtotal del item |

---

# Relaciones del Modelo

```txt
Usuarios 1 --- N Carrito

Categorias 1 --- N Productos

Carrito 1 --- N Carrito_Item

Productos 1 --- N Carrito_Item
```

---

# Explicación de Relaciones

## Usuarios y Carrito

Un usuario puede poseer múltiples carritos de compra.

## Categorias y Productos

Una categoría puede contener múltiples productos.

## Carrito y Carrito_Item

Un carrito puede contener múltiples productos mediante la entidad intermedia Carrito_Item.

## Productos y Carrito_Item

Un producto puede existir en múltiples carritos.

---

# Modelo Relacional Visual

```txt
+-------------------+
|     Usuarios      |
+-------------------+
| PK id_usuario     |
| nombre            |
| apellido          |
| correo            |
| password          |
| telefono          |
| direccion         |
| rol               |
| fecha_registro    |
| estado            |
+-------------------+
          |
          | 1
          |
          | N
+-------------------+
|      Carrito      |
+-------------------+
| PK id_carrito     |
| FK id_usuario     |
| fecha_creacion    |
| estado            |
| total             |
+-------------------+
          |
          | 1
          |
          | N
+-------------------+
|   Carrito_Item    |
+-------------------+
| PK id_item        |
| FK id_carrito     |
| FK id_producto    |
| cantidad          |
| precio_unitario   |
| subtotal          |
+-------------------+
          |
          | N
          |
          | 1
+-------------------+
|     Productos     |
+-------------------+
| PK id_producto    |
| nombre            |
| descripcion       |
| precio            |
| stock             |
| imagen            |
| FK id_categoria   |
| estado            |
| fecha_creacion    |
+-------------------+
          |
          | N
          |
          | 1
+-------------------+
|    Categorias     |
+-------------------+
| PK id_categoria   |
| nombre_categoria  |
| descripcion       |
| estado            |
+-------------------+
```

---

# Objetivo del Modelo

- Definir la estructura inicial de la base de datos.
- Facilitar la integración entre Frontend y Backend.
- Servir como referencia para el desarrollo de APIs.
- Mantener una estructura escalable y organizada.

---

# Tecnologías Relacionadas

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: NestJS
- Base de Datos: PostgreSQL
- ORM sugerido: TypeORM

---

# Conclusión

El modelo diseñado permite una estructura escalable para el sistema E-Commerce, facilitando la administración de usuarios, productos y procesos de compra. Además, proporciona una base sólida para futuras funcionalidades como órdenes, pagos y control administrativo.