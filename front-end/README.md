This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Arquitectura inicial de carpetas

El proyecto front-end utiliza la estructura de Next.js con App Router, las rutas principales se encuentran dentro de `src/app`, mientras que los componentes reutilizables, utilidades y tipos se organizan en carpetas separadas.

```text
src
├── app
│   ├── page.tsx
│   ├── login
│   │   └── page.tsx
│   └── registro
│       └── page.tsx
│
├── components
├── lib
└── types
```

### Descripción de carpetas

- `app/`: contiene las rutas principales del sistema.
- `app/page.tsx`: representa la ruta principal `/`.
- `app/login/page.tsx`: representa la ruta `/login`.
- `app/registro/page.tsx`: representa la ruta `/registro`.
- `components/`: almacena componentes reutilizables de la interfaz.
- `lib/`: contiene funciones auxiliares, configuraciones o constantes del proyecto.
- `types/`: almacena definiciones de tipos utilizados con TypeScript.