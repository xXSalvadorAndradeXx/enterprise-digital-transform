# ERP PMV — API REST

Sistema ERP (Enterprise Resource Planning) — Producto Mínimo Viable.

**Stack:** NestJS 10 · PostgreSQL 15 · TypeORM · JWT · Swagger (OpenAPI 3.0)

---

## Requisitos previos

- Node.js LTS (≥ 20.x)
- PNPM (≥ 8.x)
- Docker + Docker Compose
- PostgreSQL 15 (o usar el de Docker Compose)

---

## Instalación y arranque local

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd erp-pmv

# 2. Instalar dependencias
pnpm install

# 3. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores locales

# 4. Levantar PostgreSQL con Docker
docker-compose up postgres -d

# 5. Ejecutar migraciones
pnpm migration:run

# 6. Ejecutar seeds
pnpm seed:run

# 7. Iniciar en modo desarrollo
pnpm start:dev
```

---

## Con Docker Compose completo

```bash
cp .env.example .env
docker-compose up --build
```

---

## URLs disponibles

| Recurso       | URL                                    |
|---------------|----------------------------------------|
| API           | http://localhost:3000/api/v1           |
| Swagger       | http://localhost:3000/api/docs         |
| PostgreSQL    | localhost:5432                         |

---

## Scripts disponibles

| Script                | Descripción                                   |
|-----------------------|-----------------------------------------------|
| `pnpm start:dev`      | Desarrollo con hot-reload                     |
| `pnpm build`          | Compilar para producción                      |
| `pnpm start:prod`     | Iniciar build de producción                   |
| `pnpm test`           | Ejecutar pruebas unitarias                    |
| `pnpm test:cov`       | Pruebas con reporte de cobertura              |
| `pnpm migration:run`  | Ejecutar migraciones pendientes               |
| `pnpm migration:revert` | Revertir última migración                   |
| `pnpm migration:generate -- src/database/migrations/NombreMigracion` | Generar migración |
| `pnpm seed:run`       | Ejecutar seeds                                |

---

## Estructura del proyecto