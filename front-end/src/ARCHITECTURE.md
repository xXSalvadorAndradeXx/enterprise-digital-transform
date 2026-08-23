# Arquitectura del e-commerce

- `app/`: rutas y layouts de Next.js. Las páginas coordinan los módulos.
- `components/`: interfaz agrupada por dominio (`layout`, `products`, `cart`, `ui`).
- `contexts/`: estado global mediante Context API.
- `hooks/`: lógica reutilizable agrupada por dominio.
- `services/`: acceso a API; no contiene componentes ni lógica visual.
- `types/`: contratos TypeScript agrupados por dominio.
- `lib/`: infraestructura compartida, cliente HTTP, sesión y validaciones Zod.
- `mocks/`: handlers, datos y configuración de MSW para navegador y pruebas.
- `constants/`: valores compartidos que no cambian durante la ejecución.
- `utils/`: funciones puras reutilizables.

## Regla de dependencia

Las páginas consumen componentes y hooks; los hooks consumen servicios; los
servicios consumen el cliente HTTP y los tipos. Los componentes no deben llamar
directamente al backend cuando esa comunicación pueda vivir en un servicio.
