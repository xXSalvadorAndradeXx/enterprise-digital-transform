"use client";

import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import { getUserPermissions } from "@/services/auth/permissions.service";

const CUSTOMER_READ_PERMISSION = "customers:read";

interface CustomerReadPermissionState {
  isCheckingCustomerPermission: boolean;
  canReadCustomers: boolean;
  customerPermissionError: string;
}

export function useCustomerReadPermission(): CustomerReadPermissionState {
  const {
    user,
    isAuthenticated,
    isInitializing,
    mustChangePassword,
  } = useAuth();

  const role = user?.rol ?? "";

  const [
    state,
    setState,
  ] = useState<CustomerReadPermissionState>({
    isCheckingCustomerPermission: true,
    canReadCustomers: false,
    customerPermissionError: "",
  });

  useEffect(() => {
    if (isInitializing) {
      setState({
        isCheckingCustomerPermission: true,
        canReadCustomers: false,
        customerPermissionError: "",
      });
      return;
    }

    if (!isAuthenticated || !user || mustChangePassword) {
      setState({
        isCheckingCustomerPermission: false,
        canReadCustomers: false,
        customerPermissionError: "No existe una sesion administrativa activa.",
      });
      return;
    }

    let isCancelled = false;

    setState({
      isCheckingCustomerPermission: true,
      canReadCustomers: false,
      customerPermissionError: "",
    });

    void getUserPermissions(
      role,
      user.permissions,
    )
      .then((result) => {
        if (isCancelled) {
          return;
        }

        const hasPermission = result.permissions.includes(
          CUSTOMER_READ_PERMISSION,
        );

        setState({
          isCheckingCustomerPermission: false,
          canReadCustomers: hasPermission,
          customerPermissionError: hasPermission
            ? ""
            : "Acceso denegado.",
        });
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setState({
          isCheckingCustomerPermission: false,
          canReadCustomers: false,
          customerPermissionError:
            "No fue posible verificar los permisos administrativos.",
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [
    isAuthenticated,
    isInitializing,
    mustChangePassword,
    role,
    user,
  ]);

  return state;
}
