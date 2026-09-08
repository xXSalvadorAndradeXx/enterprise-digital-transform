"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { ApiRequestError } from "@/lib/api-client";
import {
  createAddress as createAddressRequest,
  deleteAddress as deleteAddressRequest,
  getAddresses as getAddressesRequest,
  setDefaultAddress as setDefaultAddressRequest,
  updateAddress as updateAddressRequest,
} from "@/services/addresses/address.service";
import type {
  AddressOperation,
  CreateAddressRequest,
  CustomerAddress,
  UpdateAddressRequest,
} from "@/types/addresses/address.types";

export interface AddressesError {
  message: string;
  status: number;
  code: string | null;
}

export interface UseAddressesOptions {
  autoLoad?: boolean;
}

export interface UseAddressesValue {
  addresses: CustomerAddress[];
  isLoading: boolean;
  error: AddressesError | null;
  operation: AddressOperation | null;
  operationAddressId: string | null;
  isMutating: boolean;
  loadAddresses: () => Promise<CustomerAddress[] | null>;
  createAddress: (
    data: CreateAddressRequest,
  ) => Promise<CustomerAddress | null>;
  updateAddress: (
    addressId: string,
    data: UpdateAddressRequest,
  ) => Promise<CustomerAddress | null>;
  deleteAddress: (addressId: string) => Promise<boolean>;
  setPrimaryAddress: (
    addressId: string,
  ) => Promise<CustomerAddress | null>;
}

function normalizeAddressesError(error: unknown): AddressesError {
  if (error instanceof ApiRequestError) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
    };
  }

  return {
    message:
      error instanceof Error
        ? error.message
        : "No se pudo completar la operacion de direcciones.",
    status: 0,
    code: null,
  };
}

function sortAddresses(addresses: CustomerAddress[]): CustomerAddress[] {
  return [...addresses].sort(
    (first, second) =>
      Number(second.isDefault) - Number(first.isDefault),
  );
}

function upsertAddress(
  addresses: CustomerAddress[],
  nextAddress: CustomerAddress,
): CustomerAddress[] {
  const exists = addresses.some(
    (address) => address.id === nextAddress.id,
  );

  const nextAddresses = exists
    ? addresses.map((address) =>
        address.id === nextAddress.id ? nextAddress : address,
      )
    : [nextAddress, ...addresses];

  const normalizedAddresses = nextAddress.isDefault
    ? nextAddresses.map((address) => ({
        ...address,
        isDefault: address.id === nextAddress.id,
      }))
    : nextAddresses;

  return sortAddresses(normalizedAddresses);
}

function removeAddress(
  addresses: CustomerAddress[],
  addressId: string,
): CustomerAddress[] {
  return addresses.filter(
    (address) => address.id !== addressId,
  );
}

export function useAddresses(
  options: UseAddressesOptions = {},
): UseAddressesValue {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AddressesError | null>(null);
  const [operation, setOperation] = useState<AddressOperation | null>(
    null,
  );
  const [operationAddressId, setOperationAddressId] = useState<
    string | null
  >(null);

  const requestIdRef = useRef(0);
  const operationInProgressRef = useRef(false);

  const invalidatePendingLoads = useCallback(() => {
    requestIdRef.current += 1;
    setIsLoading(false);
  }, []);

  const loadAddressesWithSignal = useCallback(
    async (
      signal?: AbortSignal,
    ): Promise<CustomerAddress[] | null> => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setIsLoading(true);
      setError(null);

      try {
        const result = await getAddressesRequest(signal);

        if (!signal?.aborted && requestIdRef.current === requestId) {
          setAddresses(result);
        }

        return result;
      } catch (requestError) {
        if (!signal?.aborted && requestIdRef.current === requestId) {
          setAddresses([]);
          setError(normalizeAddressesError(requestError));
        }

        return null;
      } finally {
        if (!signal?.aborted && requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (options.autoLoad === false) {
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadAddressesWithSignal(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadAddressesWithSignal, options.autoLoad]);

  const beginOperation = useCallback(
    (
      nextOperation: AddressOperation,
      addressId: string | null,
    ): boolean => {
      if (operationInProgressRef.current) {
        return false;
      }

      operationInProgressRef.current = true;
      invalidatePendingLoads();
      setOperation(nextOperation);
      setOperationAddressId(addressId);
      setError(null);

      return true;
    },
    [invalidatePendingLoads],
  );

  const finishOperation = useCallback(() => {
    operationInProgressRef.current = false;
    setOperation(null);
    setOperationAddressId(null);
  }, []);

  const createAddress = useCallback(
    async (
      data: CreateAddressRequest,
    ): Promise<CustomerAddress | null> => {
      if (!beginOperation("create", null)) {
        return null;
      }

      try {
        const createdAddress = await createAddressRequest(data);
        setAddresses((currentAddresses) =>
          upsertAddress(currentAddresses, createdAddress),
        );

        return createdAddress;
      } catch (requestError) {
        setError(normalizeAddressesError(requestError));
        return null;
      } finally {
        finishOperation();
      }
    },
    [beginOperation, finishOperation],
  );

  const updateAddress = useCallback(
    async (
      addressId: string,
      data: UpdateAddressRequest,
    ): Promise<CustomerAddress | null> => {
      if (!beginOperation("update", addressId)) {
        return null;
      }

      try {
        const updatedAddress = await updateAddressRequest(
          addressId,
          data,
        );
        setAddresses((currentAddresses) =>
          upsertAddress(currentAddresses, updatedAddress),
        );

        return updatedAddress;
      } catch (requestError) {
        setError(normalizeAddressesError(requestError));
        return null;
      } finally {
        finishOperation();
      }
    },
    [beginOperation, finishOperation],
  );

  const deleteAddress = useCallback(
    async (addressId: string): Promise<boolean> => {
      if (!beginOperation("delete", addressId)) {
        return false;
      }

      try {
        await deleteAddressRequest(addressId);
        setAddresses((currentAddresses) =>
          removeAddress(currentAddresses, addressId),
        );

        return true;
      } catch (requestError) {
        setError(normalizeAddressesError(requestError));
        return false;
      } finally {
        finishOperation();
      }
    },
    [beginOperation, finishOperation],
  );

  const setPrimaryAddress = useCallback(
    async (addressId: string): Promise<CustomerAddress | null> => {
      if (!beginOperation("set-primary", addressId)) {
        return null;
      }

      try {
        const primaryAddress = await setDefaultAddressRequest(addressId);
        setAddresses((currentAddresses) =>
          upsertAddress(currentAddresses, primaryAddress),
        );

        return primaryAddress;
      } catch (requestError) {
        setError(normalizeAddressesError(requestError));
        return null;
      } finally {
        finishOperation();
      }
    },
    [beginOperation, finishOperation],
  );

  return {
    addresses,
    isLoading,
    error,
    operation,
    operationAddressId,
    isMutating: operation !== null,
    loadAddresses: () => loadAddressesWithSignal(),
    createAddress,
    updateAddress,
    deleteAddress,
    setPrimaryAddress,
  };
}

export default useAddresses;
