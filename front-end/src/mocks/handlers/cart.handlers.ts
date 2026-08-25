import {
  http,
  HttpResponse,
} from "msw";

import type {
  AddCartItemRequest,
  ApiCart,
  ApiCartItem,
  CartResponse,
  UpdateCartItemQuantityRequest,
} from "@/types/cart/cart.types";

import {
  cartWithMultipleProductsMock,
  emptyCartMock,
  guestCartMock,
  mergedCartMock,
  mockCartItem,
  mockSecondCartItem,
  MOCK_GUEST_CART_TOKEN,
} from "@/mocks/data/cart.mock";

const API_BASE_URL =
  "http://localhost:3000";

type CartScenario =
  | "EMPTY"
  | "WITH_PRODUCTS"
  | "UNAUTHORIZED"
  | "SERVER_ERROR"
  | "GUEST";

let currentScenario: CartScenario =
  "SERVER_ERROR";

/*
 * Estado temporal utilizado únicamente por MSW.
 *
 * Se clona para evitar modificar directamente
 * los objetos definidos en cart.mock.ts.
 */
let currentCart: ApiCart =
  structuredClone(
        cartWithMultipleProductsMock,
  );

function createSuccessResponse(
  cart: ApiCart,
  message = "Cart operation completed successfully",
): CartResponse {
  return {
    success: true,
    message,
    data: cart,
    timestamp:
      new Date().toISOString(),
  };
}

function createApiError(
  statusCode: number,
  code: string,
  message: string,
  path: string,
  details?: Record<string, unknown>,
) {
  return {
    success: false,
    statusCode,
    code,
    message,
    error:
      statusCode >= 500
        ? "Internal Server Error"
        : statusCode === 401
          ? "Unauthorized"
          : statusCode === 409
            ? "Conflict"
            : "Bad Request",
    details,
    timestamp:
      new Date().toISOString(),
    path,
  };
}

function recalculateCart(
  cart: ApiCart,
): ApiCart {
  const subtotal =
    cart.items.reduce(
      (
        accumulator,
        item,
      ) =>
        accumulator +
        Number(item.unitPrice) *
          item.quantity,
      0,
    );

  const discountTotal =
    cart.items.reduce(
      (
        accumulator,
        item,
      ) =>
        accumulator +
        Number(item.lineDiscount),
      0,
    );

  const total =
    cart.items.reduce(
      (
        accumulator,
        item,
      ) =>
        accumulator +
        Number(item.lineTotal),
      0,
    );

  return {
    ...cart,

    subtotal:
      subtotal.toFixed(2),

    discountTotal:
      discountTotal.toFixed(2),

    total:
      total.toFixed(2),
  };
}

function updateLineTotals(
  item: ApiCartItem,
  quantity: number,
): ApiCartItem {
  const previousQuantity =
    Math.max(
      1,
      item.quantity,
    );

  const lineDiscountPerUnit =
    Number(item.lineDiscount) /
    previousQuantity;

  const lineTotalPerUnit =
    Number(item.lineTotal) /
    previousQuantity;

  return {
    ...item,

    quantity,

    lineDiscount:
      (
        lineDiscountPerUnit *
        quantity
      ).toFixed(2),

    lineTotal:
      (
        lineTotalPerUnit *
        quantity
      ).toFixed(2),
  };
}

/*
 * Permite cambiar el escenario desde pruebas
 * o temporalmente desde código de desarrollo.
 */
export function setCartMockScenario(
  scenario: CartScenario,
) {
  currentScenario = scenario;

  switch (scenario) {
    case "EMPTY":
      currentCart =
        structuredClone(
          emptyCartMock,
        );
      break;

    case "GUEST":
      currentCart =
        structuredClone(
          guestCartMock,
        );
      break;

    case "WITH_PRODUCTS":
    default:
      currentCart =
        structuredClone(
          cartWithMultipleProductsMock,
        );
      break;
  }
}

/*
 * Reinicia el carrito MSW.
 */
export function resetCartMock() {
  currentScenario =
    "WITH_PRODUCTS";

  currentCart =
    structuredClone(
      cartWithMultipleProductsMock,
    );
}

/*
 * GET /cart
 */
const getCartHandler =
  http.get(
    `${API_BASE_URL}/cart`,
    ({ request }) => {
      if (
        currentScenario ===
        "UNAUTHORIZED"
      ) {
        return HttpResponse.json(
          createApiError(
            401,
            "CART_TOKEN_INVALID",
            "El carrito no pudo ser identificado.",
            "/cart",
          ),
          {
            status: 401,
          },
        );
      }

      if (
        currentScenario ===
        "SERVER_ERROR"
      ) {
        return HttpResponse.json(
          createApiError(
            500,
            "INTERNAL_SERVER_ERROR",
            "Ocurrió un error inesperado al obtener el carrito.",
            "/cart",
          ),
          {
            status: 500,
          },
        );
      }

      const headers =
        new Headers();

      if (
        currentScenario ===
        "GUEST"
      ) {
        headers.set(
          "X-Cart-Token",
          MOCK_GUEST_CART_TOKEN,
        );
      }

      return HttpResponse.json(
        createSuccessResponse(
          currentCart,
          "Cart retrieved successfully",
        ),
        {
          status: 200,
          headers,
        },
      );
    },
  );

/*
 * POST /cart/items
 */
const addCartItemHandler =
  http.post(
    `${API_BASE_URL}/cart/items`,
    async ({
      request,
    }) => {
      if (
        currentScenario ===
        "UNAUTHORIZED"
      ) {
        return HttpResponse.json(
          createApiError(
            401,
            "CART_TOKEN_INVALID",
            "No fue posible identificar el carrito.",
            "/cart/items",
          ),
          {
            status: 401,
          },
        );
      }

      if (
        currentScenario ===
        "SERVER_ERROR"
      ) {
        return HttpResponse.json(
          createApiError(
            500,
            "INTERNAL_SERVER_ERROR",
            "No se pudo agregar el producto al carrito.",
            "/cart/items",
          ),
          {
            status: 500,
          },
        );
      }

      const body =
        await request.json() as
          AddCartItemRequest;

      const existingItem =
        currentCart.items.find(
          (item) =>
            item.variantId ===
            body.variantId,
        );

      if (existingItem) {
        const requestedQuantity =
          existingItem.quantity +
          body.quantity;

        if (
          requestedQuantity >
          existingItem.availableStock
        ) {
          return HttpResponse.json(
            createApiError(
              409,
              "STOCK_INSUFFICIENT",
              "La cantidad solicitada supera el stock disponible.",
              "/cart/items",
              {
                variantId:
                  existingItem.variantId,

                availableStock:
                  existingItem.availableStock,

                requestedQuantity,
              },
            ),
            {
              status: 409,
            },
          );
        }

        currentCart = {
          ...currentCart,

          items:
            currentCart.items.map(
              (item) =>
                item.variantId ===
                body.variantId
                  ? updateLineTotals(
                      item,
                      requestedQuantity,
                    )
                  : item,
            ),
        };
      } else {
        /*
         * Para MSW utilizamos uno de los
         * productos simulados disponibles.
         */
        const sourceItem =
          body.variantId ===
          mockSecondCartItem.variantId
            ? mockSecondCartItem
            : mockCartItem;

        const quantity =
          Math.max(
            1,
            body.quantity,
          );

        if (
          quantity >
          sourceItem.availableStock
        ) {
          return HttpResponse.json(
            createApiError(
              409,
              "STOCK_INSUFFICIENT",
              "La cantidad solicitada supera el stock disponible.",
              "/cart/items",
              {
                variantId:
                  body.variantId,

                availableStock:
                  sourceItem.availableStock,

                requestedQuantity:
                  quantity,
              },
            ),
            {
              status: 409,
            },
          );
        }

        currentCart = {
          ...currentCart,

          items: [
            ...currentCart.items,

            updateLineTotals(
              {
                ...sourceItem,

                id:
                  `cart-item-${Date.now()}`,

                variantId:
                  body.variantId,
              },
              quantity,
            ),
          ],
        };
      }

      currentCart =
        recalculateCart(
          currentCart,
        );

      /*
       * Si no existe Authorization ni
       * X-Cart-Token simulamos la creación
       * de un carrito invitado.
       */
      const authorization =
        request.headers.get(
          "Authorization",
        );

      const receivedCartToken =
        request.headers.get(
          "X-Cart-Token",
        );

      const headers =
        new Headers();

      if (
        !authorization &&
        !receivedCartToken
      ) {
        headers.set(
          "X-Cart-Token",
          MOCK_GUEST_CART_TOKEN,
        );

        currentScenario =
          "GUEST";
      }

      return HttpResponse.json(
        createSuccessResponse(
          currentCart,
          "Item added successfully",
        ),
        {
          status: 200,
          headers,
        },
      );
    },
  );

/*
 * PATCH /cart/items/:itemId
 */
const updateCartItemHandler =
  http.patch(
    `${API_BASE_URL}/cart/items/:itemId`,
    async ({
      params,
      request,
    }) => {
      if (
        currentScenario ===
        "UNAUTHORIZED"
      ) {
        return HttpResponse.json(
          createApiError(
            401,
            "CART_TOKEN_INVALID",
            "No fue posible identificar el carrito.",
            `/cart/items/${String(
              params.itemId,
            )}`,
          ),
          {
            status: 401,
          },
        );
      }

      if (
        currentScenario ===
        "SERVER_ERROR"
      ) {
        return HttpResponse.json(
          createApiError(
            500,
            "INTERNAL_SERVER_ERROR",
            "No se pudo actualizar la cantidad.",
            `/cart/items/${String(
              params.itemId,
            )}`,
          ),
          {
            status: 500,
          },
        );
      }

      const itemId =
        String(
          params.itemId,
        );

      const body =
        await request.json() as
          UpdateCartItemQuantityRequest;

      const currentItem =
        currentCart.items.find(
          (item) =>
            item.id === itemId,
        );

      if (!currentItem) {
        return HttpResponse.json(
          createApiError(
            404,
            "CART_ITEM_NOT_FOUND",
            "La línea del carrito no fue encontrada.",
            `/cart/items/${itemId}`,
          ),
          {
            status: 404,
          },
        );
      }

      const quantity =
        Math.max(
          1,
          Math.floor(
            body.quantity,
          ),
        );

      if (
        quantity >
        currentItem.availableStock
      ) {
        return HttpResponse.json(
          createApiError(
            409,
            "STOCK_INSUFFICIENT",
            "La cantidad solicitada supera el stock disponible.",
            `/cart/items/${itemId}`,
            {
              variantId:
                currentItem.variantId,

              availableStock:
                currentItem.availableStock,

              requestedQuantity:
                quantity,
            },
          ),
          {
            status: 409,
          },
        );
      }

      currentCart = {
        ...currentCart,

        items:
          currentCart.items.map(
            (item) =>
              item.id ===
              itemId
                ? updateLineTotals(
                    item,
                    quantity,
                  )
                : item,
          ),
      };

      currentCart =
        recalculateCart(
          currentCart,
        );

      return HttpResponse.json(
        createSuccessResponse(
          currentCart,
          "Cart item updated successfully",
        ),
        {
          status: 200,
        },
      );
    },
  );

/*
 * DELETE /cart/items/:itemId
 */
const deleteCartItemHandler =
  http.delete(
    `${API_BASE_URL}/cart/items/:itemId`,
    ({
      params,
    }) => {
      if (
        currentScenario ===
        "UNAUTHORIZED"
      ) {
        return HttpResponse.json(
          createApiError(
            401,
            "CART_TOKEN_INVALID",
            "No fue posible identificar el carrito.",
            `/cart/items/${String(
              params.itemId,
            )}`,
          ),
          {
            status: 401,
          },
        );
      }

      if (
        currentScenario ===
        "SERVER_ERROR"
      ) {
        return HttpResponse.json(
          createApiError(
            500,
            "INTERNAL_SERVER_ERROR",
            "No se pudo eliminar el producto del carrito.",
            `/cart/items/${String(
              params.itemId,
            )}`,
          ),
          {
            status: 500,
          },
        );
      }

      const itemId =
        String(
          params.itemId,
        );

      const exists =
        currentCart.items.some(
          (item) =>
            item.id === itemId,
        );

      if (!exists) {
        return HttpResponse.json(
          createApiError(
            404,
            "CART_ITEM_NOT_FOUND",
            "La línea del carrito no fue encontrada.",
            `/cart/items/${itemId}`,
          ),
          {
            status: 404,
          },
        );
      }

      currentCart = {
        ...currentCart,

        items:
          currentCart.items.filter(
            (item) =>
              item.id !==
              itemId,
          ),
      };

      currentCart =
        recalculateCart(
          currentCart,
        );

      return HttpResponse.json(
        createSuccessResponse(
          currentCart,
          "Cart item removed successfully",
        ),
        {
          status: 200,
        },
      );
    },
  );

/*
 * POST /cart/merge
 */
const mergeCartHandler =
  http.post(
    `${API_BASE_URL}/cart/merge`,
    ({
      request,
    }) => {
      if (
        currentScenario ===
        "SERVER_ERROR"
      ) {
        return HttpResponse.json(
          createApiError(
            500,
            "INTERNAL_SERVER_ERROR",
            "No se pudo combinar el carrito.",
            "/cart/merge",
          ),
          {
            status: 500,
          },
        );
      }

      const authorization =
        request.headers.get(
          "Authorization",
        );

      const cartToken =
        request.headers.get(
          "X-Cart-Token",
        );

      if (
        !authorization ||
        !cartToken
      ) {
        return HttpResponse.json(
          createApiError(
            401,
            "CART_TOKEN_INVALID",
            "Se requiere una sesión y un carrito invitado para realizar el merge.",
            "/cart/merge",
          ),
          {
            status: 401,
          },
        );
      }

      /*
       * Este token especial puede utilizarse
       * para probar el conflicto de stock.
       */
      if (
        cartToken ===
        "mock-stock-conflict-token"
      ) {
        return HttpResponse.json(
          createApiError(
            409,
            "STOCK_INSUFFICIENT",
            "El stock cambió durante la combinación del carrito.",
            "/cart/merge",
            {
              variantId:
                mockCartItem.variantId,

              availableStock: 1,

              requestedQuantity: 2,
            },
          ),
          {
            status: 409,
          },
        );
      }

      currentCart =
        structuredClone(
          mergedCartMock,
        );

      return HttpResponse.json(
        createSuccessResponse(
          currentCart,
          "Cart merged successfully",
        ),
        {
          status: 200,
        },
      );
    },
  );

export const cartHandlers = [
  getCartHandler,
  addCartItemHandler,
  updateCartItemHandler,
  deleteCartItemHandler,
  mergeCartHandler,
];