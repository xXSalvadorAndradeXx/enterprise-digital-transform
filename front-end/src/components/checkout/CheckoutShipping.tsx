"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Building2, MapPin, Phone, Store, Truck } from "lucide-react";
import { useAddresses } from "@/hooks/addresses/useAddresses";
import { hasActiveSession } from "@/lib/auth-session";
import {
  getDepartments,
  getDistricts,
  getPickupBranches,
  type CheckoutBranchOption,
  type CheckoutCatalogOption,
} from "@/services/checkout/checkout-catalog.service";

type DeliveryType = "HOME_DELIVERY" | "STORE_PICKUP";

interface CheckoutShippingProps {
  deliveryType: DeliveryType;
  onDeliveryTypeChange: (value: DeliveryType) => void;
  onDataChange?: (data: ShippingData) => void;
}

export interface ShippingData {
  departmentId: string;
  districtId: string;
  addressLine: string;
  city: string;
  branchId: string;
  saveInfo: boolean;
}

interface SavedShippingInfo {
  departmentId: string;
  districtId: string;
  addressLine: string;
  city: string;
}

const STORAGE_KEY = "woden_checkout_shipping";

function toCheckoutId(value: number | string | null | undefined): string {
  return value === undefined || value === null ? "" : String(value);
}

export default function CheckoutShipping({
  deliveryType,
  onDeliveryTypeChange,
  onDataChange,
}: CheckoutShippingProps) {
  const hasUserEditedShippingRef = useRef(false);
  const hasPrefilledPrimaryAddressRef = useRef(false);

  const [departmentId, setDepartmentId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [saveInfo, setSaveInfo] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [departments, setDepartments] = useState<CheckoutCatalogOption[]>([]);
  const [districts, setDistricts] = useState<CheckoutCatalogOption[]>([]);
  const [branches, setBranches] = useState<CheckoutBranchOption[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [canLoadAddresses, setCanLoadAddresses] = useState(false);

  const { addresses, error: addressesError } = useAddresses({
    autoLoad: canLoadAddresses,
  });

  const primaryAddress = useMemo(
    () => addresses.find((address) => address.isDefault) ?? null,
    [addresses],
  );

  useEffect(() => {
    let isActive = true;

    void Promise.all([getDepartments(), getPickupBranches()]).then(
      ([departmentOptions, branchOptions]) => {
        if (!isActive) {
          return;
        }

        setDepartments(departmentOptions);
        setBranches(branchOptions);
        setCatalogError("");
      },
      () => {
        if (isActive) {
          setCatalogError("No se pudieron cargar las opciones de entrega.");
        }
      },
    );

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    if (!departmentId) {
      Promise.resolve().then(() => {
        if (isActive) {
          setDistricts([]);
        }
      });

      return () => {
        isActive = false;
      };
    }

    void getDistricts(departmentId).then(
      (options) => {
        if (!isActive) {
          return;
        }

        setDistricts(options);
        setCatalogError("");
      },
      () => {
        if (isActive) {
          setCatalogError("No se pudieron cargar los distritos.");
        }
      },
    );

    return () => {
      isActive = false;
    };
  }, [departmentId]);

  useEffect(() => {
    onDataChange?.({
      departmentId,
      districtId,
      addressLine,
      city,
      branchId,
      saveInfo,
    });
  }, [addressLine, branchId, city, departmentId, districtId, onDataChange, saveInfo]);

  /*
   * Cargar información previamente guardada
   * para el usuario invitado.
   */
  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(() => {
      if (!isActive || hasUserEditedShippingRef.current) {
        return;
      }

      try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) return;

        const parsed = JSON.parse(saved) as SavedShippingInfo;

        setDepartmentId(parsed.departmentId ?? "");
        setDistrictId(parsed.districtId ?? "");
        setAddressLine(parsed.addressLine ?? "");
        setCity(parsed.city ?? "");
      } catch (error) {
        console.error(
          "No se pudo cargar la información guardada:",
          error,
        );
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(() => {
      if (isActive) {
        setCanLoadAddresses(hasActiveSession());
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (
      deliveryType !== "HOME_DELIVERY" ||
      !primaryAddress ||
      hasPrefilledPrimaryAddressRef.current ||
      hasUserEditedShippingRef.current
    ) {
      return undefined;
    }

    const nextDepartmentId = toCheckoutId(primaryAddress.department?.id);
    const nextDistrictId = toCheckoutId(primaryAddress.district?.id);
    const nextCity = primaryAddress.city?.trim() ?? "";
    const nextAddressLine = primaryAddress.addressLine.trim();

    if (
      !nextDepartmentId &&
      !nextDistrictId &&
      !nextCity &&
      !nextAddressLine
    ) {
      return undefined;
    }

    let isActive = true;

    hasPrefilledPrimaryAddressRef.current = true;

    Promise.resolve().then(() => {
      if (!isActive || hasUserEditedShippingRef.current) {
        return;
      }

      setDepartmentId(nextDepartmentId);
      setDistrictId(nextDistrictId);
      setCity(nextCity);
      setAddressLine(nextAddressLine);
    });

    return () => {
      isActive = false;
    };
  }, [deliveryType, primaryAddress]);

  /*
   * Guardar información cuando el usuario
   * marca "Guardar mi información".
   */
  useEffect(() => {
    if (!saveInfo) return;

    const shippingInfo: SavedShippingInfo = {
      departmentId,
      districtId,
      addressLine,
      city,
    };

    /*
     * Solo guardamos cuando hay información.
     * No se envía nada al Backend.
     */
    if (
      departmentId ||
      districtId ||
      addressLine ||
      city
    ) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(shippingInfo),
      );
    }
  }, [
    saveInfo,
    departmentId,
    districtId,
    addressLine,
    city,
  ]);

  const handleSaveInfoChange = (
    checked: boolean,
  ) => {
    hasUserEditedShippingRef.current = true;
    setSaveInfo(checked);

    if (!checked) {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleDepartmentChange = (
    value: string,
  ) => {
    hasUserEditedShippingRef.current = true;
    setDepartmentId(value);

    // Al cambiar departamento se limpia el distrito.
    setDistrictId("");
  };

  const handleDistrictChange = (
    value: string,
  ) => {
    hasUserEditedShippingRef.current = true;
    setDistrictId(value);
  };

  const handleAddressLineChange = (
    value: string,
  ) => {
    hasUserEditedShippingRef.current = true;
    setAddressLine(value);
  };

  const handleCityChange = (
    value: string,
  ) => {
    hasUserEditedShippingRef.current = true;
    setCity(value);
  };

  const handleBranchChange = (
    value: string,
  ) => {
    hasUserEditedShippingRef.current = true;
    setBranchId(value);
  };

  const handleDeliveryTypeChange = (
    value: DeliveryType,
  ) => {
    hasUserEditedShippingRef.current = true;
    onDeliveryTypeChange(value);
  };

  const selectedBranch = branches.find(
    (branch) => branch.id === branchId,
  );

  return (
    <div className="flex flex-col gap-5">
      {catalogError && (
        <p role="alert" className="text-sm text-red-600">{catalogError}</p>
      )}

      {canLoadAddresses && addressesError ? (
        <p role="alert" className="text-sm text-amber-700">
          No pudimos precargar tu dirección principal. Puedes completar los
          datos manualmente.
        </p>
      ) : null}
      {/* OPCIONES DE ENTREGA */}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() =>
            handleDeliveryTypeChange(
              "HOME_DELIVERY",
            )
          }
          className={`flex items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition ${
            deliveryType === "HOME_DELIVERY"
              ? "border-[#1B21D1] text-[#1B21D1] ring-1 ring-[#1B21D1]"
              : "border-gray-300 text-gray-500 hover:border-gray-500"
          }`}
        >
          <Truck className="h-4 w-4" />
          Domicilio
        </button>

        <button
          type="button"
          onClick={() =>
            handleDeliveryTypeChange(
              "STORE_PICKUP",
            )
          }
          className={`flex items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition ${
            deliveryType === "STORE_PICKUP"
              ? "border-[#1B21D1] text-[#1B21D1] ring-1 ring-[#1B21D1]"
              : "border-gray-300 text-gray-500 hover:border-gray-500"
          }`}
        >
          <Store className="h-4 w-4" />
          Retiro en tienda
        </button>
      </div>

      {/* DOMICILIO */}

      {deliveryType === "HOME_DELIVERY" && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="departmentId"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Departamento
              </label>

              <select
                id="departmentId"
                name="departmentId"
                value={departmentId}
                onChange={(e) =>
                  handleDepartmentChange(
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1B21D1] focus:ring-2 focus:ring-[#1B21D1]/15"
              >
                <option value="">
                  Selecciona un departamento
                </option>

                {departments.map(
                  (department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="districtId"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Distrito
              </label>

              <select
                id="districtId"
                name="districtId"
                value={districtId}
                onChange={(e) =>
                  handleDistrictChange(
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1B21D1] focus:ring-2 focus:ring-[#1B21D1]/15"
              >
                <option value="">
                  Selecciona un distrito
                </option>

                {districts.map(
                  (district) => (
                    <option
                      key={district.id}
                      value={district.id}
                    >
                      {district.name}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="addressLine"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Dirección
              </label>

              <input
                id="addressLine"
                name="addressLine"
                type="text"
                value={addressLine}
                onChange={(e) =>
                  handleAddressLineChange(
                    e.target.value,
                  )
                }
                placeholder="Dirección de entrega"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#1B21D1] focus:ring-2 focus:ring-[#1B21D1]/15"
              />
            </div>

            <div>
              <label
                htmlFor="city"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Ciudad
              </label>

              <input
                id="city"
                name="city"
                type="text"
                value={city}
                onChange={(e) =>
                  handleCityChange(e.target.value)
                }
                placeholder="Ciudad"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#1B21D1] focus:ring-2 focus:ring-[#1B21D1]/15"
              />
            </div>
          </div>

          {/* GUARDAR INFORMACIÓN */}

          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={saveInfo}
              onChange={(e) =>
                handleSaveInfoChange(
                  e.target.checked,
                )
              }
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1B21D1] focus:ring-[#1B21D1]/30"
            />

            <span>
              Guardar mi información y
              consultar más rápidamente la
              próxima vez
            </span>
          </label>
        </div>
      )}

      {/* RETIRO EN TIENDA */}

      {deliveryType === "STORE_PICKUP" && (
        <div>
          <label
            htmlFor="branchId"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Sucursal
          </label>

          <div className="relative">
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            />

            <select
              id="branchId"
              name="branchId"
              value={branchId}
              onChange={(event) => handleBranchChange(event.target.value)}
              className="w-full appearance-none rounded-md border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 outline-none focus:border-[#1B21D1] focus:ring-2 focus:ring-[#1B21D1]/15"
            >
              <option value="">
                Selecciona una sucursal
              </option>

              {branches.map(
                (branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name}
                  </option>
                ),
              )}
            </select>
          </div>

          {selectedBranch && (
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <Store className="mt-0.5 h-5 w-5 shrink-0 text-[#1B21D1]" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">
                    {selectedBranch.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Código: {selectedBranch.code ?? "No disponible"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1B21D1]" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Dirección
                    </p>
                    <p className="mt-0.5">
                      {selectedBranch.address ?? "Dirección no disponible"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#1B21D1]" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Teléfono
                    </p>
                    <p className="mt-0.5">
                      {selectedBranch.phone ?? "No disponible"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:col-span-2">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1B21D1]" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Ubicación
                    </p>
                    <p className="mt-0.5">
                      {[
                        selectedBranch.district?.name,
                        selectedBranch.department?.name,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Ubicación no disponible"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
