# Frontend E-Commerce

Frontend del proyecto E-Commerce desarrollado con Next.js, TypeScript y Tailwind CSS.

La aplicacion consume un backend local en:

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
pnpm install
```

Iniciar el servidor de desarrollo:

```bash
pnpm dev
```

Abrir en el navegador:

```text
http://localhost:3001
```

## Scripts disponibles

```bash
pnpm dev
```

Ejecuta el proyecto en modo desarrollo.

```bash
pnpm build
```

Genera la build de produccion.

```bash
pnpm lint
```

Ejecuta ESLint para revisar el codigo.

## Arquitectura de carpetas

El proyecto utiliza Next.js con App Router. Las rutas principales estan dentro de `src/app`, mientras que los componentes reutilizables, servicios, utilidades y tipos se organizan en carpetas separadas.

```text
src
├── app
│   ├── page.tsx
│   ├── carrito
│   │   └── page.tsx
│   ├── cuenta
│   │   └── page.tsx
│   ├── login
│   │   └── page.tsx
│   ├── producto
│   │   └── [id]
│   │       └── page.tsx
│   ├── productos
│   │   └── page.tsx
│   └── registro
│       └── page.tsx
├── components
├── context
├── hooks
├── lib
├── services
└── types
```

### Descripcion de carpetas

- `app/`: contiene las rutas principales del sistema.
- `components/`: almacena componentes reutilizables de interfaz.
- `context/`: contiene providers globales como `CartProvider`.
- `hooks/`: expone hooks oficiales de consumo como `useCart`.
- `lib/`: contiene utilidades del proyecto, como cliente API y manejo de sesion.
- `services/`: contiene servicios tipados para consumir la API.
- `types/`: almacena definiciones de tipos utilizados con TypeScript.

## Endpoints consumidos

El frontend consume la API del backend en `http://localhost:3000`.

Los servicios tipados principales se encuentran en:

- `src/lib/api-client.ts`: cliente base para peticiones `fetch`.
- `src/services/auth-service.ts`: servicios de autenticacion.
- `src/services/cart-service.ts`: servicios reales del carrito.
- `src/types/user.ts`: tipos de usuario.
- `src/types/product.ts`: tipos de producto.
- `src/types/cart.ts`: tipos de carrito.

## Flujo de autenticacion

Al iniciar sesion correctamente, el frontend guarda el JWT recibido en `localStorage` con la clave `access_token` y guarda los datos del usuario con la clave `user`.

La logica de sesion se encuentra en:

- `src/lib/auth-session.ts`

Funciones principales:

- `saveAuthSession`: guarda el token y los datos del usuario.
- `readAccessToken`: lee el JWT desde el cliente.
- `hasActiveSession`: valida si existe una sesion activa.
- `readSessionUser`: obtiene los datos del usuario autenticado.
- `clearAuthSession`: elimina la sesion del cliente.

Despues del login, el usuario es redirigido automaticamente a `/cuenta`. La ruta `src/app/cuenta/page.tsx` valida si existe sesion activa. Si no hay token, redirige al usuario a `/login`.

## Flujo Data-Driven del carrito

El carrito trabaja con datos reales del backend y no usa productos mock ni datos hardcodeados de carrito.

- `CartProvider` envuelve la aplicacion desde `src/components/Layout.tsx`.
- `src/context/CartContext.tsx` centraliza el estado del carrito y lo sincroniza con el backend.
- `src/hooks/useCart.ts` es el hook oficial para leer y modificar el carrito desde componentes.
- `src/services/cart-service.ts` consume los endpoints reales del backend usando el JWT de la sesion activa.
- Al iniciar sesion o refrescar la pagina, `CartContext` sincroniza el carrito con `GET /cart`.
- Tras agregar, eliminar, actualizar cantidad o limpiar el carrito, `CartContext` actualiza el estado con la respuesta real del backend.
- `/carrito` lista los `items`, `totalItems`, `totalPrice`, `isSyncing` y `syncError` desde `useCart`.
- `Header` muestra contador y total del carrito desde `useCart`.
- `AddToCartButton` consulta `items` desde `useCart` para saber si un producto ya esta agregado.
- Los cambios se reflejan sin recargar porque todos los componentes consumen el mismo `CartProvider`.
- Si el carrito se esta sincronizando, los componentes evitan mostrar estados definitivos hasta recibir la respuesta del backend.

## Verificacion recomendada

Antes de entregar cambios del frontend, ejecutar:

```bash
pnpm lint
pnpm build
```
