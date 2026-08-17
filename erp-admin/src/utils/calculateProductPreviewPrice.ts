export function calculateProductPreviewPrice(
  salePrice: string,
  discount: string,
  applyDiscount: boolean,
): number | null {
  const price = Number(salePrice);

  if (
    salePrice.trim() === "" ||
    Number.isNaN(price) ||
    price < 0
  ) {
    return null;
  }

  if (!applyDiscount) {
    return price;
  }

  const discountValue = Number(discount);

  if (
    discount.trim() === "" ||
    Number.isNaN(discountValue) ||
    discountValue < 0 ||
    discountValue > 100
  ) {
    return price;
  }

  return (
    price *
    (1 - discountValue / 100)
  );
}