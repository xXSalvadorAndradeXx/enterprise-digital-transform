# Frontend E-Commerce

Frontend del proyecto E-Commerce desarrollado con Next.js, TypeScript y Tailwind CSS.

La aplicación consume un backend local en:

```text
http://localhost:3000
```

El frontend se ejecuta en:

```text
http://localhost:3001
```

## Ejecutar el proyecto

Instalar dependencias:

```bash
npm install
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Abrir en el navegador:

```text
http://localhost:3001
```

## Scripts disponibles

```bash
npm run dev
```

Ejecuta el proyecto en modo desarrollo.

```bash
npm run build
```

Genera la build de producción.

```bash
npm run lint
```

Ejecuta ESLint para revisar el código.

## Arquitectura de carpetas

El proyecto utiliza la estructura de Next.js con App Router. Las rutas principales están dentro de `src/app`, mientras que los componentes reutilizables, servicios, utilidades y tipos se organizan en carpetas separadas.

```text
src
├── app
│   ├── page.tsx
│   ├── login
│   │   └── page.tsx
│   ├── registro
│   │   └── page.tsx
│   └── cuenta
│       └── page.tsx
│
├── components
├── lib
├── services
└── types
```

### Descripción de carpetas

- `app/`: contiene las rutas principales del sistema.
- `app/page.tsx`: representa la ruta principal `/`.
- `app/login/page.tsx`: representa la ruta `/login`.
- `app/registro/page.tsx`: representa la ruta `/registro`.
- `app/cuenta/page.tsx`: representa la ruta protegida `/cuenta`.
- `components/`: almacena componentes reutilizables de la interfaz.
- `lib/`: contiene utilidades del proyecto, como cliente API y manejo de sesión.
- `services/`: contiene servicios tipados para consumir la API.
- `types/`: almacena definiciones de tipos utilizados con TypeScript.

## Endpoints consumidos

El frontend consume la API del backend en `http://localhost:3000`.

Los servicios tipados se encuentran en:

- `src/lib/api-client.ts`: cliente base para peticiones `fetch`.
- `src/services/auth-service.ts`: servicios de autenticación.
- `src/types/user.ts`: tipo compartido de usuario.

### Registro de usuario

```http
POST /auth/register
```

Body enviado desde el frontend:

```json
{
  "nombre": "Nombre del usuario",
  "email": "correo@example.com",
  "password": "Password1"
}
```

Uso en el frontend:

```ts
registerUser({
  nombre,
  email,
  password
});
```

La pantalla que consume este servicio es `src/app/registro/page.tsx`.

### Inicio de sesión

```http
POST /auth/login
```

Body enviado desde el frontend:

```json
{
  "email": "correo@example.com",
  "password": "Password1"
}
```

Respuesta esperada:

```json
{
  "message": "Login exitoso",
  "access_token": "jwt",
  "user": {
    "id": 1,
    "nombre": "Nombre del usuario",
    "email": "correo@example.com",
    "rol": "cliente"
  }
}
```

Uso en el frontend:

```ts
loginUser({
  email,
  password
});
```

La pantalla que consume este servicio es `src/app/login/page.tsx`.

## Flujo de autenticación

Al iniciar sesión correctamente, el frontend guarda el JWT recibido en `localStorage` con la clave `access_token` y guarda los datos del usuario con la clave `user`.

La lógica de sesión se encuentra en:

- `src/lib/auth-session.ts`

Funciones principales:

- `saveAuthSession`: guarda el token y los datos del usuario.
- `readAccessToken`: lee el JWT desde el cliente.
- `hasActiveSession`: valida si existe una sesión activa.
- `readSessionUser`: obtiene los datos del usuario autenticado.
- `clearAuthSession`: elimina la sesión del cliente.

Después del login, el usuario es redirigido automáticamente a:

```text
/cuenta
```

La ruta `src/app/cuenta/page.tsx` valida si existe sesión activa. Si no hay token, redirige al usuario a `/login`.

## Verificación realizada

Se probó el flujo:

```text
registro -> login -> ruta protegida /cuenta
```

Resultado de la prueba contra la API:

- `POST /auth/register`: respuesta `201`.
- `POST /auth/login`: respuesta `201`.
- Se recibió `access_token`.
- La ruta `/cuenta` responde desde el frontend.
