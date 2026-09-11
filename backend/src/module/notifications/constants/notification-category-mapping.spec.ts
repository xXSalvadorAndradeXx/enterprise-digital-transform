import { NotificationType } from '../enums/notification-type.enum';
import { NotificationTab } from '../enums/notification-tab.enum';
import {
  NOTIFICATION_TYPE_TO_TAB,
  NOTIFICATION_TAB_TO_TYPES,
  getNotificationTab,
  getNotificationTypesForTab,
} from './notification-category-mapping';

describe('Notification Category Mapping (Type -> Tab Contract)', () => {
  describe('Exhaustividad del Contrato', () => {
    it('cada valor del enum NotificationType debe tener una pestaña asignada en NOTIFICATION_TYPE_TO_TAB', () => {
      const allNotificationTypes = Object.values(NotificationType);

      expect(allNotificationTypes.length).toBeGreaterThan(0);
      for (const type of allNotificationTypes) {
        const mappedTab = NOTIFICATION_TYPE_TO_TAB[type];
        expect(mappedTab).toBeDefined();
        expect(Object.values(NotificationTab)).toContain(mappedTab);
        // Ningún tipo individual debe mapear directamente a la pestaña global ALL
        expect(mappedTab).not.toBe(NotificationTab.ALL);
      }
    });

    it('cada pestaña específica debe tener al menos un NotificationType asociado en NOTIFICATION_TAB_TO_TYPES', () => {
      const specificTabs = [
        NotificationTab.ORDERS,
        NotificationTab.OFFERS,
        NotificationTab.SYSTEM,
      ];

      for (const tab of specificTabs) {
        const associatedTypes = NOTIFICATION_TAB_TO_TYPES[tab];
        expect(associatedTypes).toBeDefined();
        expect(Array.isArray(associatedTypes)).toBe(true);
        expect(associatedTypes.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Mapeo Canónico Específico (Pestañas de Frontend)', () => {
    it('ORDER_STATUS_CHANGED debe mapear a la pestaña Pedidos (ORDERS)', () => {
      expect(
        NOTIFICATION_TYPE_TO_TAB[NotificationType.ORDER_STATUS_CHANGED],
      ).toBe(NotificationTab.ORDERS);
      expect(getNotificationTab(NotificationType.ORDER_STATUS_CHANGED)).toBe(
        NotificationTab.ORDERS,
      );
    });

    it('FAVORITE_PRICE_DROPPED debe mapear a la pestaña Ofertas (OFFERS)', () => {
      expect(
        NOTIFICATION_TYPE_TO_TAB[NotificationType.FAVORITE_PRICE_DROPPED],
      ).toBe(NotificationTab.OFFERS);
      expect(getNotificationTab(NotificationType.FAVORITE_PRICE_DROPPED)).toBe(
        NotificationTab.OFFERS,
      );
    });

    it('SYSTEM_ANNOUNCEMENT debe mapear a la pestaña Sistema (SYSTEM)', () => {
      expect(
        NOTIFICATION_TYPE_TO_TAB[NotificationType.SYSTEM_ANNOUNCEMENT],
      ).toBe(NotificationTab.SYSTEM);
      expect(getNotificationTab(NotificationType.SYSTEM_ANNOUNCEMENT)).toBe(
        NotificationTab.SYSTEM,
      );
    });
  });

  describe('getNotificationTab (Helper de Asignación en DTO)', () => {
    it('debe resolver la pestaña correcta pasando el enum o el string equivalente', () => {
      expect(getNotificationTab('ORDER_STATUS_CHANGED')).toBe(
        NotificationTab.ORDERS,
      );
      expect(getNotificationTab('FAVORITE_PRICE_DROPPED')).toBe(
        NotificationTab.OFFERS,
      );
      expect(getNotificationTab('SYSTEM_ANNOUNCEMENT')).toBe(
        NotificationTab.SYSTEM,
      );
    });

    it('debe retornar NotificationTab.SYSTEM como fallback ante valores nulos, vacíos o desconocidos', () => {
      expect(getNotificationTab('')).toBe(NotificationTab.SYSTEM);
      expect(getNotificationTab(null)).toBe(NotificationTab.SYSTEM);
      expect(getNotificationTab(undefined)).toBe(NotificationTab.SYSTEM);
      expect(getNotificationTab('UNKNOWN_TYPE_XYZ')).toBe(
        NotificationTab.SYSTEM,
      );
    });
  });

  describe('getNotificationTypesForTab (Helper de Filtrado en BD)', () => {
    it('debe retornar los tipos correctos para la pestaña ORDERS', () => {
      const types = getNotificationTypesForTab(NotificationTab.ORDERS);
      expect(types).toEqual([NotificationType.ORDER_STATUS_CHANGED]);
    });

    it('debe retornar los tipos correctos para la pestaña OFFERS', () => {
      const types = getNotificationTypesForTab(NotificationTab.OFFERS);
      expect(types).toEqual([NotificationType.FAVORITE_PRICE_DROPPED]);
    });

    it('debe retornar los tipos correctos para la pestaña SYSTEM', () => {
      const types = getNotificationTypesForTab(NotificationTab.SYSTEM);
      expect(types).toEqual([NotificationType.SYSTEM_ANNOUNCEMENT]);
    });

    it('debe retornar null para NotificationTab.ALL o valores falsy (sin filtro SQL de tipo)', () => {
      expect(getNotificationTypesForTab(NotificationTab.ALL)).toBeNull();
      expect(getNotificationTypesForTab('ALL')).toBeNull();
      expect(getNotificationTypesForTab(null)).toBeNull();
      expect(getNotificationTypesForTab(undefined)).toBeNull();
      expect(getNotificationTypesForTab('')).toBeNull();
    });

    it('debe retornar null ante una pestaña inválida o desconocida', () => {
      expect(getNotificationTypesForTab('INVALID_TAB')).toBeNull();
    });
  });
});
