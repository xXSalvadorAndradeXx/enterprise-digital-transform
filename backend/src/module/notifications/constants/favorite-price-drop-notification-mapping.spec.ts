import { getFavoritePriceDropNotificationText } from './favorite-price-drop-notification-mapping';

describe('FavoritePriceDropNotificationMapping', () => {
  const commercialName = 'Taladro Percutor 1/2';

  it('debe calcular porcentaje y generar mensaje de rebaja cuando oldPrice > newPrice', () => {
    const result = getFavoritePriceDropNotificationText({
      commercialName,
      oldPrice: 100,
      newPrice: 75,
    });

    expect(result.title).toBe('¡Bajó de precio un favorito!');
    expect(result.discountPercentage).toBe(25);
    expect(result.message).toBe(
      '"Taladro Percutor 1/2" bajó a $75.00 (25% de descuento, antes $100.00).',
    );
  });

  it('debe respetar discountPercentage si viene especificado en el evento', () => {
    const result = getFavoritePriceDropNotificationText({
      commercialName,
      oldPrice: 100,
      newPrice: 70,
      discountPercentage: 30,
    });

    expect(result.title).toBe('¡Bajó de precio un favorito!');
    expect(result.discountPercentage).toBe(30);
    expect(result.message).toContain('30% de descuento');
  });

  it('debe generar mensaje de precio especial si oldPrice no está definido (sin snapshot previo)', () => {
    const result = getFavoritePriceDropNotificationText({
      commercialName,
      newPrice: 49.99,
    });

    expect(result.title).toBe('¡Tu favorito tiene precio especial!');
    expect(result.discountPercentage).toBeUndefined();
    expect(result.message).toBe(
      '"Taladro Percutor 1/2" ahora está disponible por $49.99. ¡Aprovecha la oportunidad!',
    );
  });

  it('debe generar mensaje de precio especial si oldPrice es menor o igual a newPrice para evitar incoherencias', () => {
    const result = getFavoritePriceDropNotificationText({
      commercialName,
      oldPrice: 50,
      newPrice: 50,
    });

    expect(result.title).toBe('¡Tu favorito tiene precio especial!');
    expect(result.discountPercentage).toBeUndefined();
    expect(result.message).toBe(
      '"Taladro Percutor 1/2" ahora está disponible por $50.00. ¡Aprovecha la oportunidad!',
    );
  });
});
