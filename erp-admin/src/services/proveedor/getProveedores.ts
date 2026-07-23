export interface GetProveedoresParams {
  search: string;
  page: number;
  limit: number;
}

const mockProviders = [
  {
    id: 1,
    provider: "Nike SV",
    phone: "7777-1111",
  },
  {
    id: 2,
    provider: "Pull&Bear",
    phone: "7777-1221",
  },
  {
    id: 3,
    provider: "Zara",
    phone: "7477-1357",
  },
  {
    id: 1,
    provider: "Nike SV",
    phone: "7777-1111",
  },
  {
    id: 2,
    provider: "Pull&Bear",
    phone: "7777-1221",
  },
  {
    id: 3,
    provider: "Zara",
    phone: "7477-1357",
  },
  {
    id: 1,
    provider: "Nike SV",
    phone: "7777-1111",
  },
  {
    id: 2,
    provider: "Pull&Bear",
    phone: "7777-1221",
  },
  {
    id: 3,
    provider: "Zara",
    phone: "7477-1357",
  },
  {
    id: 1,
    provider: "Nike SV",
    phone: "7777-1111",
  },
  {
    id: 2,
    provider: "Pull&Bear",
    phone: "7777-1221",
  },
  {
    id: 3,
    provider: "Zara",
    phone: "7477-1357",
  },
];

export async function getProveedores({
  search,
  page,
  limit,
}: GetProveedoresParams) {
  // Simulamos el tiempo que tardaría una API
  await new Promise((resolve) => setTimeout(resolve, 500));

  throw new Error("Prueba");

  const filtered = mockProviders.filter((provider) =>
    provider.provider.toLowerCase().includes(search.toLowerCase())
  );

  const start = (page - 1) * limit;
  const end = start + limit;

  const data = filtered.slice(start, end);

  return {
    data,
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
    },
  };
}