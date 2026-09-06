"use client";

import { useCallback, useEffect, useState } from "react";
import {
  normalizeAuthError,
  type NormalizedAuthError,
} from "@/lib/auth-error";
import { getCustomerProfile } from "@/services/profile/profile.service";
import type { CustomerProfile } from "@/types/profile/profile.types";

export interface UseCustomerProfileValue {
  profile: CustomerProfile | null;
  isLoading: boolean;
  error: NormalizedAuthError | null;
  retry: () => void;
}

export function useCustomerProfile(): UseCustomerProfileValue {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<NormalizedAuthError | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

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

  return { profile, isLoading, error, retry };
}
