"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  normalizeAuthError,
  type NormalizedAuthError,
} from "@/lib/auth-error";
import {
  getCustomerProfile,
  updateCustomerProfile,
} from "@/services/profile/profile.service";
import type {
  CustomerProfile,
  UpdateCustomerProfileRequest,
} from "@/types/profile/profile.types";

export interface UseCustomerProfileValue {
  profile: CustomerProfile | null;
  isLoading: boolean;
  error: NormalizedAuthError | null;
  isUpdating: boolean;
  retry: () => void;
  updateProfile: (
    payload: UpdateCustomerProfileRequest,
  ) => Promise<CustomerProfile | null>;
}

export function useCustomerProfile(): UseCustomerProfileValue {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<NormalizedAuthError | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(false);

  const retry = useCallback(() => {
    setProfile(null);
    setError(null);
    setIsLoading(true);
    setRequestVersion((currentVersion) => currentVersion + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    getCustomerProfile(controller.signal)
      .then((customerProfile) => {
        if (!controller.signal.aborted) {
          setProfile(customerProfile);
          setError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setProfile(null);
          setError(normalizeAuthError(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [requestVersion]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      updateControllerRef.current?.abort();
    };
  }, []);

  const updateProfile = useCallback(
    async (payload: UpdateCustomerProfileRequest): Promise<CustomerProfile | null> => {
      if (updateControllerRef.current) {
        return null;
      }

      const controller = new AbortController();
      updateControllerRef.current = controller;
      setIsUpdating(true);

      try {
        const customerProfile = await updateCustomerProfile(payload, controller.signal);

        if (controller.signal.aborted || !isMountedRef.current) {
          return null;
        }

        setProfile(customerProfile);
        setError(null);
        return customerProfile;
      } catch (requestError) {
        if (controller.signal.aborted || !isMountedRef.current) {
          return null;
        }

        throw requestError;
      } finally {
        if (updateControllerRef.current === controller) {
          updateControllerRef.current = null;
          if (isMountedRef.current) {
            setIsUpdating(false);
          }
        }
      }
    },
    [],
  );

  return { profile, isLoading, error, isUpdating, retry, updateProfile };
}
