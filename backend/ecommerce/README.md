# 🚀 Backend — Proyecto de Transformación Digital

Backend RESTful construido con **NestJS**, **TypeScript** y **PostgreSQL**, implementando arquitectura relacional y autenticación segura mediante **JWT**.

---

## 📋 Tabla de Contenidos

- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración de la Base de Datos](#-configuración-de-la-base-de-datos)
- [Ejecución](#-ejecución)
- [Pruebas de Endpoints](#-pruebas-de-endpoints)
- [Estructura del Proyecto](#-estructura-del-proyecto)

---

## 🛠 Tecnologías

| Tecnología     | Versión  | Uso                             |
|----------------|----------|---------------------------------|
| Node.js        | v24.15.0 | Entorno de ejecución            |
| NestJS         | Latest   | Framework principal del backend |
| TypeScript     | Latest   | Tipado estático                 |
| PostgreSQL      | v18.3    | Base de datos relacional        |
| TypeORM        | Latest   | ORM para manejo de entidades    |
| JWT + Passport | Latest   | Autenticación y autorización    |
| Bcrypt         | Latest   | Hashing de contraseñas          |

---

## ✅ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

- **[Node.js](https://nodejs.org/)** — `v24.15.0`
- **[PostgreSQL](https://www.postgresql.org/)** — `v18.3`
- **[Visual Studio Code](https://code.visualstudio.com/)** *(recomendado)*
  - Extensión: **Thunder Client** — para probar los endpoints de la API

---

## 📦 Instalación

Sigue los pasos en orden para configurar el entorno de desarrollo local.

### 1. Instalar NestJS CLI de forma global

```bash
npm i -g @nestjs/cli
```

### 2. Instalar dependencias del proyecto

Desde la raíz del proyecto, ejecuta los siguientes comandos:

```bash
# Variables de entorno y utilidades de DTOs
npm i @nestjs/config
npm i @nestjs/mapped-types

# Base de datos (TypeORM y driver de PostgreSQL)
npm i @nestjs/typeorm typeorm pg

# Validaciones
npm i class-validator class-transformer

# Motor de Express
npm i @nestjs/platform-express
```

### 3. Configuración de Seguridad y Autenticación

```bash
# Hashing de contraseñas con Bcrypt
npm i bcrypt
npm i -D @types/bcrypt

# JWT y Passport para autenticación
npm i @nestjs/jwt
npm i @nestjs/passport passport passport-jwt --legacy-peer-deps
npm i -D @types/passport-jwt --legacy-peer-deps
```

> **Nota:** Se utiliza `--legacy-peer-deps` para evitar conflictos de versiones con Passport.

---

## 🗄 Configuración de la Base de Datos

### Paso 1: Reinicio del esquema *(opcional)*

Si necesitas partir desde cero, ejecuta este script directamente en tu gestor de PostgreSQL:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### Paso 2: Generar y ejecutar migraciones

```bash
# Compilar TypeScript a JavaScript
npm run build

# Generar el archivo de migración inicial
npm run migration:generate src/migrations/InitialSchema

# Aplicar los cambios a la base de datos (Ejecuta automáticamente el sembrado de permisos y usuario Super Admin)
npm run migration:run
```

### Paso 3: Sembrado de Datos e Idempotencia

El proyecto incluye dos mecanismos de sembrado de datos para agilizar el arranque del sistema en ambientes de desarrollo:

#### A. Permisos, Roles y Usuario Super Admin (Sembrado por Migración)
Este proceso es **idempotente** y se ejecuta automáticamente al correr `npm run migration:run`:
*   **Catálogo de Permisos**: Inserta o actualiza todos los permisos mediante `recurso:accion` (upsert por `code`).
*   **Rol SUPERADMIN**: Se crea el rol con `is_system = true` y se le asocian la totalidad de los permisos.
*   **Usuario Super Admin Inicial**: Si no existe, se crea la cuenta con credenciales:
    *   **Email**: `superadmin@ecommerce.local`
    *   **Contraseña**: `superadmin123` (encriptada dinámicamente usando Bcrypt)
    *   **Carrito**: Se crea automáticamente un registro en la tabla `carts` asociado al usuario.

#### B. Productos y Categorías de Prueba (Sembrado por Script)
Para poblar el catálogo de productos y categorías de prueba para desarrollo, puedes ejecutar el siguiente script:

```bash
npm run seed
```

> ⚠️ **Atención:** El comando de seed para productos/categorías realiza una limpieza previa de tablas (`TRUNCATE ... CASCADE`), por lo que no debe ejecutarse en producción.

---

## 💻 Ejecución

Una vez configuradas las dependencias y la base de datos, levanta el servidor en modo desarrollo:

```bash
npm run start:dev
```

El servidor estará disponible en: `http://localhost:3000`

---

## 🧪 Pruebas de Endpoints

1. Instala la extensión **Thunder Client** en Visual Studio Code.
2. Asegúrate de que el servidor esté corriendo (`npm run start:dev`).
3. Crea una nueva petición apuntando a `http://localhost:3000`.
4. Importa tus colecciones o crea peticiones manualmente desde la interfaz de Thunder Client.

---

## 📑 Endpoints Documentados

### Productos

`GET /products`

Obtiene un listado de productos paginado y filtrado.

**Query Parameters Soportados para Ordenamiento:**

*   `sortBy` (Opcional): Campo por el cual se ordenarán los resultados.
    *   Valores permitidos: `precio`, `stock`, `createdAt`.
    *   *Por defecto:* `createdAt`
*   `order` (Opcional): Dirección del ordenamiento.
    *   Valores permitidos: `ASC` (Ascendente), `DESC` (Descendente).
    *   *Por defecto:* `DESC`

**Ejemplo de uso:**
`GET /products?sortBy=precio&order=ASC`

---

## 📁 Estructura del Proyecto

```
src/
├── migrations/       # Archivos de migración de TypeORM
├── modules/          # Módulos de la aplicación (auth, users, etc.)
├── common/           # Guards, decoradores y utilidades compartidas
├── config/           # Configuración de la aplicación y variables de entorno
└── main.ts           # Punto de entrada de la aplicación
```

---

> Proyecto desarrollado con ❤️ usando NestJS y TypeScript. 
