import {
  ORDER_STATUS_VALUES,
  type AdminCustomerAddress,
  type AdminCustomerDetail,
  type AdminCustomerListItem,
  type AdminCustomerOrderHistoryItem,
} from "@/types/customers";

export const mockAdminCustomers: AdminCustomerListItem[] = [
  {
    id: "0f9db36f-7df2-4d19-8d35-13f62307e16c",
    fullName: "Ana Lopez",
    email: "ana.lopez@example.com",
    lastOrderAt: "2026-08-21T18:00:00.000Z",
    totalOrders: 4,
    totalSpent: "240.00",
  },
  {
    id: "2d9fa0ec-6dd1-45ff-a64a-4e2c601f4f96",
    fullName: "Carlos Ramos",
    email: "carlos.ramos@example.com",
    lastOrderAt: "2026-08-18T14:30:00.000Z",
    totalOrders: 2,
    totalSpent: "89.50",
  },
  {
    id: "34b8400e-d6f8-4a0c-b44a-fb339120fc1b",
    fullName: "Sofia Martinez",
    email: "sofia.martinez@example.com",
    lastOrderAt: "2026-08-10T09:45:00.000Z",
    totalOrders: 7,
    totalSpent: "510.75",
  },
  {
    id: "493f7c0f-50c5-43a8-9aa9-52f26cc8938e",
    fullName: "Miguel Hernandez",
    email: "miguel.hernandez@example.com",
    lastOrderAt: "2026-07-29T20:15:00.000Z",
    totalOrders: 1,
    totalSpent: "35.00",
  },
  {
    id: "5b91b21b-3f86-4e75-935e-657a64adff7f",
    fullName: "Daniela Torres",
    email: "daniela.torres@example.com",
    lastOrderAt: "2026-07-20T16:10:00.000Z",
    totalOrders: 5,
    totalSpent: "320.25",
  },
  {
    id: "6cf21513-828d-4441-aafe-0301d9a5fcdb",
    fullName: "Roberto Castillo",
    email: "roberto.castillo@example.com",
    lastOrderAt: "2026-07-05T11:25:00.000Z",
    totalOrders: 3,
    totalSpent: "150.00",
  },
  {
    id: "7d7c7611-9736-4ff0-95c2-9d0da9fa8183",
    fullName: "Laura Mendez",
    email: "laura.mendez@example.com",
    lastOrderAt: "2026-06-28T13:05:00.000Z",
    totalOrders: 8,
    totalSpent: "780.90",
  },
  {
    id: "80bd86c3-3bd2-44e1-9a48-81923221e47d",
    fullName: "Jorge Aguilar",
    email: "jorge.aguilar@example.com",
    lastOrderAt: "2026-06-14T22:40:00.000Z",
    totalOrders: 6,
    totalSpent: "455.10",
  },
  {
    id: "9a4bff9f-faf5-495f-9c3a-3f65c15b5c3a",
    fullName: "Patricia Flores",
    email: "patricia.flores@example.com",
    lastOrderAt: "2026-05-30T08:20:00.000Z",
    totalOrders: 9,
    totalSpent: "925.40",
  },
  {
    id: "a52be7a0-b37f-4584-ad44-91be0d9fb8ab",
    fullName: "Elena Rivera",
    email: "elena.rivera@example.com",
    lastOrderAt: "2026-05-12T19:55:00.000Z",
    totalOrders: 2,
    totalSpent: "120.00",
  },
  {
    id: "b1f6ce01-4fbc-4901-9107-b69e60a9d015",
    fullName: "Oscar Mejia",
    email: "oscar.mejia@example.com",
    lastOrderAt: null,
    totalOrders: 0,
    totalSpent: "0.00",
  },
  {
    id: "cc00e188-0e5e-4d44-a2e6-cf9f2f34f8bb",
    fullName: "Valeria Cruz",
    email: "valeria.cruz@example.com",
    lastOrderAt: "2026-04-09T10:00:00.000Z",
    totalOrders: 11,
    totalSpent: "1310.60",
  },
];

export type MockAdminCustomerOrderHistoryItem =
  AdminCustomerOrderHistoryItem;

export type MockAdminCustomerAddress =
  AdminCustomerAddress;

export type MockAdminCustomerDetail =
  AdminCustomerDetail;

function buildMockOrderId(
  customerIndex: number,
  orderIndex: number,
): string {
  return `10000000-0000-4000-8000-${String(
    customerIndex + 1,
  ).padStart(4, "0")}${String(
    orderIndex + 1,
  ).padStart(8, "0")}`;
}

function buildMockOrderHistory(
  customer: AdminCustomerListItem,
  customerIndex: number,
): MockAdminCustomerOrderHistoryItem[] {
  if (
    customer.totalOrders === 0 ||
    !customer.lastOrderAt
  ) {
    return [];
  }

  const lastOrderAt =
    customer.lastOrderAt;

  const orderTotal =
    (
      Number(customer.totalSpent) /
      customer.totalOrders
    ).toFixed(2);

  return Array.from(
    {
      length:
        customer.totalOrders,
    },
    (_, orderIndex) => {
      const createdAt =
        new Date(lastOrderAt);

      createdAt.setUTCDate(
        createdAt.getUTCDate() -
          orderIndex * 7,
      );

      return {
        id:
          buildMockOrderId(
            customerIndex,
            orderIndex,
          ),
        orderNumber: `ORD-${String(
          customerIndex + 1,
        ).padStart(2, "0")}-${String(
          orderIndex + 1,
        ).padStart(4, "0")}`,
        createdAt:
          createdAt.toISOString(),
        total:
          orderTotal,
        status:
          orderIndex === 0
            ? "DELIVERED"
            : ORDER_STATUS_VALUES[
                (customerIndex + orderIndex) %
                  ORDER_STATUS_VALUES.length
              ],
      };
    },
  );
}

export const mockAdminCustomerOrders =
  mockAdminCustomers.reduce<
    Record<
      string,
      MockAdminCustomerOrderHistoryItem[]
    >
  >(
    (
      ordersByCustomer,
      customer,
      customerIndex,
    ) => {
      ordersByCustomer[customer.id] =
        buildMockOrderHistory(
          customer,
          customerIndex,
        );

      return ordersByCustomer;
    },
    {},
  );

/*
 * MOCK PROVISIONAL TASK 893:
 * Backend todavia no define GET /admin/customers/:id.
 * Se reutiliza el listado confirmado y se agrega solo phone
 * para renderizar la vista read-only solicitada.
 */
const mockAdminCustomerPhones: Record<
  string,
  string
> = {
  "0f9db36f-7df2-4d19-8d35-13f62307e16c":
    "7777-0101",
  "2d9fa0ec-6dd1-45ff-a64a-4e2c601f4f96":
    "7777-0102",
  "34b8400e-d6f8-4a0c-b44a-fb339120fc1b":
    "7777-0103",
  "493f7c0f-50c5-43a8-9aa9-52f26cc8938e":
    "7777-0104",
  "5b91b21b-3f86-4e75-935e-657a64adff7f":
    "7777-0105",
  "6cf21513-828d-4441-aafe-0301d9a5fcdb":
    "7777-0106",
  "7d7c7611-9736-4ff0-95c2-9d0da9fa8183":
    "7777-0107",
  "80bd86c3-3bd2-44e1-9a48-81923221e47d":
    "7777-0108",
  "9a4bff9f-faf5-495f-9c3a-3f65c15b5c3a":
    "7777-0109",
  "a52be7a0-b37f-4584-ad44-91be0d9fb8ab":
    "7777-0110",
  "b1f6ce01-4fbc-4901-9107-b69e60a9d015":
    "7777-0111",
  "cc00e188-0e5e-4d44-a2e6-cf9f2f34f8bb":
    "7777-0112",
};

const mockAdminCustomerAddresses: Record<
  string,
  MockAdminCustomerAddress[]
> = {
  "0f9db36f-7df2-4d19-8d35-13f62307e16c": [
    {
      id: "20000000-0000-4000-8000-000000000001",
      label: "Casa",
      department: {
        id: 6,
        name: "San Salvador",
      },
      district: {
        id: 61,
        name: "San Salvador Centro",
      },
      city: "San Salvador",
      addressLine:
        "Colonia Escalon, avenida Norte, casa 12",
      isDefault:
        true,
    },
    {
      id: "20000000-0000-4000-8000-000000000002",
      label: "Oficina",
      department: {
        id: 5,
        name: "La Libertad",
      },
      district: {
        id: 52,
        name: "La Libertad Este",
      },
      city: "Santa Tecla",
      addressLine:
        "Residencial Las Palmas, poligono B, casa 8",
      isDefault:
        false,
    },
  ],
  "2d9fa0ec-6dd1-45ff-a64a-4e2c601f4f96": [
    {
      id: "20000000-0000-4000-8000-000000000003",
      label: "Casa",
      department: {
        id: 6,
        name: "San Salvador",
      },
      district: {
        id: 62,
        name: "San Salvador Este",
      },
      city: "Soyapango",
      addressLine:
        "Reparto Los Santos, pasaje 4, casa 19",
      isDefault:
        true,
    },
  ],
  "34b8400e-d6f8-4a0c-b44a-fb339120fc1b": [
    {
      id: "20000000-0000-4000-8000-000000000004",
      label: "Oficina",
      department: {
        id: 5,
        name: "La Libertad",
      },
      district: {
        id: 51,
        name: "La Libertad Centro",
      },
      city: "Antiguo Cuscatlan",
      addressLine:
        "Boulevard Orden de Malta, edificio 3",
      isDefault:
        false,
    },
    {
      id: "20000000-0000-4000-8000-000000000005",
      label: "Casa",
      department: {
        id: 12,
        name: "San Miguel",
      },
      district: {
        id: 121,
        name: "San Miguel Centro",
      },
      city: "San Miguel",
      addressLine:
        "Barrio El Centro, 2a calle poniente",
      isDefault:
        true,
    },
    {
      id: "20000000-0000-4000-8000-000000000006",
      label: "Retiro",
      department: {
        id: 5,
        name: "La Libertad",
      },
      district: {
        id: 53,
        name: "La Libertad Costa",
      },
      city: null,
      addressLine:
        "Playa El Tunco, local 5",
      isDefault:
        false,
    },
  ],
  "b1f6ce01-4fbc-4901-9107-b69e60a9d015": [],
};

export const mockAdminCustomerDetails:
  MockAdminCustomerDetail[] =
  mockAdminCustomers.map(
    (customer, customerIndex) => ({
      ...customer,
      dui: `${String(
        customerIndex + 1,
      ).padStart(8, "0")}-${String(
        (customerIndex + 1) % 10,
      )}`,
      phone:
        mockAdminCustomerPhones[
          customer.id
        ] ?? "",
      isActive:
        true,
      addresses:
        mockAdminCustomerAddresses[
          customer.id
        ] ?? [],
    }),
  );
