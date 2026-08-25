import type {
  ApiCart,
  ApiCartItem,
} from "@/types/cart/cart.types";

/*
 * Producto de prueba utilizado en los escenarios MSW.
 */
export const mockCartItem: ApiCartItem = {
  id: "cart-item-001",

  productId: "product-001",

  variantId: "variant-001",

  productName: "Zapatos Nike básicos en rosa",

  imageUrl: "/images/zapato.jpeg",

  variant: {
    size: "6",
    colorName: "Rosa",
    colorHex: "#F5B6C8",
  },

  quantity: 1,

  availableStock: 8,

  unitPrice: "97.32",

  lineDiscount: "0.00",

  lineTotal: "97.32",
};

/*
 * Segunda variante para probar:
 *
 * - múltiples líneas
 * - eliminación
 * - actualización de cantidades
 * - merge
 */
export const mockSecondCartItem: ApiCartItem = {
  id: "cart-item-002",

  productId: "product-002",

  variantId: "variant-002",

  productName: "Camiseta básica negra",

  imageUrl: null,

  variant: {
    size: "M",
    colorName: "Negro",
    colorHex: "#000000",
  },

  quantity: 2,

  availableStock: 10,

  unitPrice: "25.00",

  lineDiscount: "5.00",

  lineTotal: "45.00",
};

/*
 * Carrito vacío.
 */
export const emptyCartMock: ApiCart = {
  id: "cart-mock-empty",

  status: "ACTIVE",

  items: [],

  subtotal: "0.00",

  discountTotal: "0.00",

  total: "0.00",
};

/*
 * Carrito con un producto.
 */
export const cartWithProductsMock: ApiCart = {
  id: "cart-mock-products",

  status: "ACTIVE",

  items: [
    mockCartItem,
  ],

  subtotal: "97.32",

  discountTotal: "0.00",

  total: "97.32",
};

/*
 * Carrito con varias líneas.
 *
 * Nos servirá especialmente para probar
 * actualización y eliminación.
 */
export const cartWithMultipleProductsMock: ApiCart = {
  id: "cart-mock-multiple",

  status: "ACTIVE",

  items: [
    mockCartItem,
    mockSecondCartItem,
  ],

  subtotal: "147.32",

  discountTotal: "5.00",

  total: "142.32",
};

/*
 * Carrito invitado.
 *
 * El X-Cart-Token no se almacena aquí.
 * El token será enviado como header desde
 * los handlers de MSW.
 */
export const guestCartMock: ApiCart = {
  id: "cart-mock-guest",

  status: "ACTIVE",

  items: [
    mockCartItem,
  ],

  subtotal: "97.32",

  discountTotal: "0.00",

  total: "97.32",
};

/*
 * Carrito de usuario autenticado.
 *
 * Utilizado para probar posteriormente
 * el merge con el carrito invitado.
 */
export const authenticatedCartMock: ApiCart = {
  id: "cart-mock-authenticated",

  status: "ACTIVE",

  items: [
    mockSecondCartItem,
  ],

  subtotal: "50.00",

  discountTotal: "5.00",

  total: "45.00",
};

/*
 * Resultado esperado después del merge:
 *
 * carrito invitado
 * +
 * carrito autenticado
 */
export const mergedCartMock: ApiCart = {
  id: "cart-mock-merged",

  status: "ACTIVE",

  items: [
    mockCartItem,
    mockSecondCartItem,
  ],

  subtotal: "147.32",

  discountTotal: "5.00",

  total: "142.32",
};

/*
 * Token exclusivamente para pruebas MSW.
 *
 * Nunca debe utilizarse como token real
 * ni escribirse en logs.
 */
export const MOCK_GUEST_CART_TOKEN =
  "mock-guest-cart-token";