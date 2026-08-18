"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getInventory,
  getInventoryById,
} from "@/app/(erp)/inventario/services/inventory.service";

import {
  mapInventoryToProductView,
} from "@/types/productos/inventory-product.mapper";

import type {
  InventoryProductView,
} from "@/types/productos/product-form.types";

interface UseInventorySelectionReturn {
  search: string;

  results:
    InventoryProductView[];

  selectedInventory:
    | InventoryProductView
    | null;

  isLoading: boolean;

  error:
    | string
    | null;

  hasSearched: boolean;

  setSearch: (
    value: string,
  ) => void;

  selectInventory: (
    inventoryId: string,
  ) => Promise<void>;

  clearSelection:
    () => void;
}

export function useInventorySelection():
  UseInventorySelectionReturn {
  const [
    search,
    setSearchState,
  ] = useState("");

  const [
    results,
    setResults,
  ] = useState<
    InventoryProductView[]
  >([]);

  const [
    selectedInventory,
    setSelectedInventory,
  ] =
    useState<
      InventoryProductView | null
    >(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    hasSearched,
    setHasSearched,
  ] = useState(false);

  /**
   * Permite ignorar respuestas
   * correspondientes a búsquedas
   * anteriores.
   */
  const requestId =
    useRef(0);

  const setSearch = (
    value: string,
  ): void => {
    setSearchState(value);
  };

  /**
   * Búsqueda con debounce.
   */
  useEffect(() => {
    const normalizedSearch =
      search.trim();

    /**
     * No buscamos hasta tener
     * al menos dos caracteres.
     *
     * Promise.resolve evita realizar
     * actualizaciones síncronas
     * directamente dentro del effect.
     */
    if (
      normalizedSearch.length < 2
    ) {
      void Promise.resolve().then(
        () => {
          setResults([]);
          setHasSearched(false);
          setIsLoading(false);
          setError(null);
        },
      );

      return;
    }

    const currentRequest =
      ++requestId.current;

    const timeoutId =
      window.setTimeout(
        async () => {
          setIsLoading(true);
          setError(null);

          try {
            const response =
              await getInventory({
                search:
                  normalizedSearch,

                page: 1,

                limit: 10,
              });

            /**
             * Si comenzó otra búsqueda,
             * ignoramos esta respuesta.
             */
            if (
              currentRequest !==
              requestId.current
            ) {
              return;
            }

            /**
             * El listado no contiene
             * details.
             *
             * Para mostrar resultados
             * construimos temporalmente
             * la información básica.
             * Los details se obtienen
             * únicamente al seleccionar.
             */
            const mappedResults =
              response.data.map(
                (inventory) => ({
                  inventoryId:
                    inventory.id,

                  name:
                    inventory.productName,

                  brand:
                    inventory.brand,

                  supplier:
                    inventory
                      .supplier.name,

                  category:
                    inventory
                      .category.name,

                  inventoryStatus:
                    inventory.status,

                  totalStock:
                    inventory.totalStock,

                  variants: [],
                }),
              );

            setResults(
              mappedResults,
            );

            setHasSearched(true);
          } catch (caughtError) {
            if (
              currentRequest !==
              requestId.current
            ) {
              return;
            }

            setResults([]);

            setHasSearched(true);

            setError(
              caughtError instanceof
                Error
                ? caughtError.message
                : "No se pudo realizar la búsqueda de inventario.",
            );
          } finally {
            if (
              currentRequest ===
              requestId.current
            ) {
              setIsLoading(false);
            }
          }
        },
        400,
      );

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [search]);

  /**
   * Selecciona un inventario.
   *
   * Aquí obtenemos el detalle completo
   * porque GET /inventory únicamente
   * devuelve la cabecera.
   */
  const selectInventory = async (
    inventoryId: string,
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response =
        await getInventoryById(
          inventoryId,
        );

      const inventory =
        mapInventoryToProductView(
          response.data,
        );

      /**
       * No permitimos seleccionar
       * inventarios sin stock.
       */
      if (
        inventory.inventoryStatus ===
        "OUT_OF_STOCK"
      ) {
        setError(
          "El inventario seleccionado no tiene stock disponible.",
        );

        return;
      }

      setSelectedInventory(
        inventory,
      );

      setResults([]);

      setSearchState("");

      setHasSearched(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo seleccionar el inventario.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearSelection =
    (): void => {
      setSelectedInventory(
        null,
      );
    };

  return {
    search,

    results,

    selectedInventory,

    isLoading,

    error,

    hasSearched,

    setSearch,

    selectInventory,

    clearSelection,
  };
}