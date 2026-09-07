"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  normalizeAuthError,
  type NormalizedAuthError,
} from "@/lib/auth-error";
import {
  readAuthSessionIdentity,
  syncSessionUserProfile,
} from "@/lib/auth-session";
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
  const loadControllerRef = useRef<AbortController | null>(null);
  const loadVersionRef = useRef(0);
  const updateControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(false);

  const retry = useCallback(() => {
    setProfile(null);
    setError(null);
    setIsLoading(true);
    setRequestVersion((currentVersion) => currentVersion + 1);
  }, []);

  useEffect(() => {
    const requestIdentity = readAuthSessionIdentity();
    const loadVersion = loadVersionRef.current + 1;

    loadVersionRef.current = loadVersion;
    loadControllerRef.current?.abort();

    if (!requestIdentity) {
      loadControllerRef.current = null;
      return;
    }

    const controller = new AbortController();
    loadControllerRef.current = controller;

    const isCurrentLoad = () =>
      !controller.signal.aborted &&
      loadControllerRef.current === controller &&
      loadVersionRef.current === loadVersion &&
      readAuthSessionIdentity() === requestIdentity;

    getCustomerProfile(controller.signal)
      .then((customerProfile) => {
        if (
          !isCurrentLoad() ||
          !syncSessionUserProfile(customerProfile, requestIdentity)
        ) {
          return;
        }

        setProfile(customerProfile);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (!isCurrentLoad()) return;

        setProfile(null);
        setError(normalizeAuthError(requestError));
      })
      .finally(() => {
        if (!isCurrentLoad()) return;

        loadControllerRef.current = null;
        setIsLoading(false);
      });

    return () => {
      controller.abort();

      if (loadControllerRef.current === controller) {
        loadControllerRef.current = null;
      }
    };
  }, [requestVersion]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      loadVersionRef.current += 1;
      loadControllerRef.current?.abort();
      updateControllerRef.current?.abort();
    };
  }, []);

  const updateProfile = useCallback(
    async (payload: UpdateCustomerProfileRequest): Promise<CustomerProfile | null> => {
      if (updateControllerRef.current) {
        return null;
      }

      const requestIdentity = readAuthSessionIdentity();

      if (!requestIdentity) {
        return null;
      }

      const controller = new AbortController();
      updateControllerRef.current = controller;
      setIsUpdating(true);

      try {
        const customerProfile = await updateCustomerProfile(payload, controller.signal);

        if (
          controller.signal.aborted ||
          !isMountedRef.current ||
          readAuthSessionIdentity() !== requestIdentity ||
          !syncSessionUserProfile(customerProfile, requestIdentity)
        ) {
          return null;
        }

        loadVersionRef.current += 1;
        loadControllerRef.current?.abort();
        loadControllerRef.current = null;
        setProfile(customerProfile);
        setError(null);
        setIsLoading(false);
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
