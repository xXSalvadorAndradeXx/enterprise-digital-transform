export interface PriceDropNotificationText {
  title: string;
  message: string;
  discountPercentage?: number;
}

export interface FormatPriceDropNotificationParams {
  commercialName: string;
  oldPrice?: number | null;
  newPrice: number;
  discountPercentage?: number | null;
}

/**
 * Genera el título y mensaje normalizado para notificaciones de rebaja en productos favoritos.
 * Si cuenta con un snapshot de precio anterior válido (oldPrice > newPrice), calcula y destaca el descuento.
 * Si no cuenta con snapshot anterior o no hay rebaja vs oldPrice, formatea un mensaje de precio especial seguro.
 */
export function getFavoritePriceDropNotificationText(
  params: FormatPriceDropNotificationParams,
): PriceDropNotificationText {
  const { commercialName, oldPrice, newPrice } = params;
  const numNewPrice = Number(newPrice);
  const numOldPrice =
    oldPrice !== null && oldPrice !== undefined ? Number(oldPrice) : null;

  // Caso 1: Snapshot completo con rebaja efectiva verificable (oldPrice > newPrice)
  if (numOldPrice !== null && numOldPrice > numNewPrice && numOldPrice > 0) {
    const calculatedDiscount = Math.max(
      1,
      Math.round(((numOldPrice - numNewPrice) / numOldPrice) * 100),
    );
    const discountPercentage =
      params.discountPercentage && params.discountPercentage > 0
        ? params.discountPercentage
        : calculatedDiscount;

    return {
      title: '¡Bajó de precio un favorito!',
      message: `"${commercialName}" bajó a $${numNewPrice.toFixed(2)} (${discountPercentage}% de descuento, antes $${numOldPrice.toFixed(2)}).`,
      discountPercentage,
    };
  }

  // Caso 2: Snapshot no provisto o precio especial (evitar datos inconsistentes si oldPrice <= newPrice)
  return {
    title: '¡Tu favorito tiene precio especial!',
    message: `"${commercialName}" ahora está disponible por $${numNewPrice.toFixed(2)}. ¡Aprovecha la oportunidad!`,
  };
}
