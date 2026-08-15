"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  InventoryProductView,
} from "@/types/productos/product-form.types";

interface UseInventorySelectionProps {
  searchInventory?: (
    search: string,
  ) => Promise<InventoryProductView[]>;
}

interface UseInventorySelectionReturn {
  search: string;

  results: InventoryProductView[];

  selectedInventory:
    | InventoryProductView
    | null;

  isLoading: boolean;

  error: string | null;

  hasSearched: boolean;

  setSearch: (
    value: string,
  ) => void;

  selectInventory: (
    inventory: InventoryProductView,
  ) => void;

  clearSelection: () => void;
}

export function useInventorySelection({
  searchInventory,
}: UseInventorySelectionProps): UseInventorySelectionReturn {
  const [
    search,
    setSearch,
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
    useState<InventoryProductView | null>(
      null,
    );

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

  useEffect(() => {
    const normalizedSearch =
      search.trim();

    /*
     * Evitamos realizar búsquedas demasiado
     * cortas y limpiamos resultados previos.
     */
    if (
      normalizedSearch.length < 2
    ) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      setError(null);

      return;
    }

    /*
     * Mientras Inventario no esté conectado,
     * no intentamos ejecutar una consulta.
     */
    if (!searchInventory) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      setError(null);

      return;
    }

    let isCancelled = false;

    /*
     * Debounce:
     * Esperamos 400 ms después de la última
     * escritura antes de realizar la búsqueda.
     */
    const timeoutId =
      window.setTimeout(
        async () => {
          setIsLoading(true);
          setError(null);

          try {
            const data =
              await searchInventory(
                normalizedSearch,
              );

            if (isCancelled) {
              return;
            }

            setResults(data);
            setHasSearched(true);
          } catch {
            if (isCancelled) {
              return;
            }

            setResults([]);

            setHasSearched(true);

            setError(
              "No se pudo realizar la búsqueda de inventario.",
            );
          } finally {
            if (!isCancelled) {
              setIsLoading(
                false,
              );
            }
          }
        },
        400,
      );

    return () => {
      isCancelled = true;

      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    search,
    searchInventory,
  ]);

  const selectInventory = (
    inventory: InventoryProductView,
  ): void => {
    /*
     * Solo puede existir un inventario seleccionado.
     */
    setSelectedInventory(
      inventory,
    );

    /*
     * Una vez seleccionado, cerramos los
     * resultados de búsqueda.
     */
    setResults([]);

    setSearch("");

    setHasSearched(false);

    setError(null);
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