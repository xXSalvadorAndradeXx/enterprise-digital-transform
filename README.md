<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
</p>

<h1 align="center">Enterprise Digital Transform</h1>

<p align="center">
Sistema ERP y E-Commerce desarrollado con una arquitectura moderna basada en <strong>NestJS</strong>, <strong>React</strong> y <strong>Vite</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-v11-E0234E?logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/React-v19-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-v7-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-18-336791?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

# 📖 Descripción

Este proyecto corresponde al desarrollo de una plataforma empresarial compuesta por un **ERP** y un **E-Commerce**, diseñada bajo una arquitectura escalable y modular.

## Tecnologías principales

### Backend

- NestJS
- TypeScript
- TypeORM
- PostgreSQL
- JWT Authentication
- Passport
- Swagger

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS

---

# 📂 Arquitectura

```
enterprise-digital-transform/
│
├── erp-pmv/
│   
│   
├── erp-admin/
│
|
├── frontend/
│
│
└
```

---

# 🚀 Instalación

## Clonar el repositorio

```bash
git clone <repository-url>

cd backend
```

## Instalar dependencias

```bash
pnpm install
```

---

# ⚙️ Variables de entorno

Crear un archivo `.env` basado en `.env.example`.

Ejemplo:

```env
NODE_ENV=development

PORT=3000

API_PREFIX=api/v1

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=user
DB_PASSWORD=password
DB_DATABASE=name-db

JWT_SECRET=secret
JWT_EXPIRES_IN=1h

JWT_REFRESH_SECRET=refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
```

---

# ▶️ Ejecutar el proyecto

Modo desarrollo

```bash
pnpm run start:dev
```

Modo producción

```bash
pnpm run start:prod
```

Compilar

```bash
pnpm run build
```

---

# 🧪 Pruebas

Unitarias

```bash
pnpm run test
```

End-to-End

```bash
pnpm run test:e2e
```

Cobertura

```bash
pnpm run test:cov
```

---

# 📦 Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| NestJS | Backend |
| React | Frontend |
| Vite | Build Tool |
| TypeScript | Lenguaje |
| PostgreSQL | Base de Datos |
| TypeORM | ORM |
| JWT | Autenticación |
| Tailwind CSS | Estilos |

---

# 📌 Módulos del ERP

- Autenticación
- Usuarios
- Roles y Permisos
- Clientes
- Proveedores
- Productos
- Inventario
- Compras
- Ventas
- Facturación Electrónica (DTE)
- Dashboard

---

# 📄 Licencia

Este proyecto es de uso privado y su código fuente es confidencial. No está permitida su distribución o reproducción sin autorización.
