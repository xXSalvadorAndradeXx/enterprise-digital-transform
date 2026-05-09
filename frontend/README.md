# E-Commerce Frontend

Frontend del proyecto E-Commerce desarrollado con Next.js 14+, TypeScript y Tailwind CSS.

---

## Tecnologías utilizadas

- Next.js 14+
- React
- TypeScript
- Tailwind CSS

---

## Estructura del proyecto

src/
├── app/
│ ├── login/
│ │ └── page.tsx
│ ├── registro/
│ │ └── page.tsx
│ ├── globals.css
│ ├── layout.tsx
│ └── page.tsx
│
├── components/
│ ├── Footer.tsx
│ ├── Header.tsx
│ └── MainLayout.tsx
│
├── lib/
├── types/
└── utils/

---

## Rutas disponibles

| Ruta | Descripción |
|------|-------------|
| `/` | Página principal |
| `/login` | Inicio de sesión |
| `/registro` | Registro de usuario |






# T-08 Conectar todas las pantallas con los endpoints del backend

## Descripción
Se realizó la integración completa entre el Frontend y el Backend utilizando peticiones HTTP con Fetch API y TypeScript.  
Se verificó el flujo completo de autenticación usando JWT.

---

# Funcionalidades implementadas

## 1. Servicios tipados para consumir la API
Se implementaron peticiones usando:
- Fetch API
- TypeScript
- Next.js

### Endpoints consumidos
- POST `/api/auth/register`
- POST `/api/auth/login`

---

# Flujo de Registro

## Endpoint utilizado
```bash
POST /api/auth/register
```

## Body enviado
```json
{
  "name": "Henry",
  "email": "henry@gmail.com",
  "password": "12345678"
}
```

## Respuesta exitosa
```json
{
  "access_token": "jwt_token",
  "user": {
    "id": "uuid",
    "name": "Henry",
    "email": "henry@gmail.com",
    "role": "customer"
  }
}
```

## Validaciones implementadas
- Nombre obligatorio
- Correo obligatorio
- Validación de formato de correo
- Contraseña mínima de 8 caracteres
- Validación de correo duplicado

## Error manejado
```json
{
  "message": "El email ya está registrado",
  "error": "Conflict",
  "statusCode": 409
}
```

---

# Flujo de Login

## Endpoint utilizado
```bash
POST /api/auth/login
```

## Body enviado
```json
{
  "email": "henry@gmail.com",
  "password": "12345678"
}
```

## Respuesta exitosa
```json
{
  "access_token": "jwt_token",
  "user": {
    "id": "uuid",
    "name": "Henry",
    "email": "henry@gmail.com",
    "role": "customer"
  }
}
```

## Funcionalidades implementadas
- Validación de campos vacíos
- Manejo de credenciales inválidas
- Almacenamiento del JWT
- Redirección automática
- Protección de rutas
- Logout

## Error manejado
```json
{
  "message": "Credenciales inválidas",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

# Manejo de sesión JWT

## Guardar token
```ts
localStorage.setItem("token", data.access_token);
```

## Leer token
```ts
const token = localStorage.getItem("token");
```

## Logout
```ts
localStorage.removeItem("token");
```

---

# Protección de rutas

## Funcionamiento
- Si existe token:
  - acceso permitido
- Si no existe token:
  - redirección automática al login

---

# Flujo probado

## Registro → Login → Dashboard

### Pruebas realizadas
- Registro exitoso
- Validación de correo repetido
- Login exitoso
- Login incorrecto
- Protección de dashboard
- Persistencia de sesión
- Logout funcional

---

# Configuración utilizada

## Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Backend
- NestJS
- PostgreSQL
- JWT
- TypeORM

---

# Resultado final

Se conectó correctamente el frontend con el backend permitiendo:
- Registro de usuarios
- Login autenticado
- Manejo de JWT
- Protección de rutas privadas
- Logout
- Validaciones frontend/backend
- Flujo completo Frontend ↔ Backend