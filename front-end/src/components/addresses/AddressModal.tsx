"use client";

import { Loader2, X } from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { locationsService } from "@/services/locations/locations.service";
import type { CustomerAddress } from "@/types/addresses/address.types";
import type { Department, District } from "@/types/locations/location.types";

export type AddressModalMode = "create" | "edit";

export interface AddressModalSubmitValues {
  label: string;
  departmentId: string;
  districtId: string;
  city: string;
  addressLine: string;
  phone: string;
}

interface AddressModalProps {
  open: boolean;
  mode: AddressModalMode;
  initialAddress?: CustomerAddress | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: AddressModalSubmitValues) => void | Promise<void>;
}

type AddressFormErrors = Partial<Record<keyof AddressModalSubmitValues, string>>;

const emptyValues: AddressModalSubmitValues = {
  label: "",
  departmentId: "",
  districtId: "",
  city: "",
  addressLine: "",
  phone: "",
};

const inputClassName =
  "h-12 w-full rounded-lg border border-slate-200 bg-[#f7f7f8] px-4 text-sm text-[#333] outline-none transition placeholder:text-[#8d8d93] focus:border-[#2528dc] focus:bg-white focus:ring-4 focus:ring-[#2528dc]/10 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-500";

function toSelectValue(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function getInitialValues(
  initialAddress: CustomerAddress | null | undefined,
): AddressModalSubmitValues {
  if (!initialAddress) {
    return emptyValues;
  }

  return {
    label: initialAddress.label,
    departmentId: toSelectValue(initialAddress.department?.id),
    districtId: toSelectValue(initialAddress.district?.id),
    city: initialAddress.city ?? "",
    addressLine: initialAddress.addressLine,
    phone: "",
  };
}

function ErrorText({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1.5 text-xs font-semibold text-red-600">{message}</p>
  ) : null;
}

function validateValues(values: AddressModalSubmitValues): AddressFormErrors {
  const errors: AddressFormErrors = {};
  const phoneDigits = values.phone.replace(/\D/g, "");

  if (!values.label.trim()) {
    errors.label = "Ingresa una etiqueta.";
  }

  if (!values.departmentId) {
    errors.departmentId = "Selecciona un departamento.";
  }

  if (!values.districtId) {
    errors.districtId = "Selecciona un distrito.";
  }

  if (values.addressLine.trim().length < 5) {
    errors.addressLine = "Ingresa una dirección exacta.";
  }

  if (values.phone.trim() && phoneDigits.length < 8) {
    errors.phone = "Ingresa un teléfono válido.";
  }

  return errors;
}

export default function AddressModal({
  open,
  mode,
  initialAddress = null,
  isSubmitting = false,
  onClose,
  onSubmit,
}: AddressModalProps) {
  const [values, setValues] = useState<AddressModalSubmitValues>(() =>
    getInitialValues(initialAddress),
  );
  const [errors, setErrors] = useState<AddressFormErrors>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [districtCatalog, setDistrictCatalog] = useState<{
    departmentId: number;
    items: District[];
  } | null>(null);
  const [catalogError, setCatalogError] = useState("");

  const title = mode === "edit" ? "Editar dirección" : "Nueva dirección";
  const submitLabel = mode === "edit" ? "Guardar cambios" : "Guardar dirección";

  const selectedDepartmentId = useMemo(() => {
    const numericValue = Number(values.departmentId);

    return Number.isFinite(numericValue) && numericValue > 0
      ? numericValue
      : null;
  }, [values.departmentId]);

  const districtOptions =
    districtCatalog?.departmentId === selectedDepartmentId
      ? districtCatalog.items
      : [];

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const controller = new AbortController();

    locationsService
      .getDepartments(controller.signal)
      .then((items) => {
        setDepartments(items);
        setCatalogError("");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCatalogError("No pudimos cargar los departamentos.");
        }
      });

    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (!open || !selectedDepartmentId) {
      return undefined;
    }

    const controller = new AbortController();

    locationsService
      .getDistricts(selectedDepartmentId, controller.signal)
      .then((items) => {
        setDistrictCatalog({
          departmentId: selectedDepartmentId,
          items,
        });
        setCatalogError("");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCatalogError("No pudimos cargar los distritos.");
        }
      });

    return () => controller.abort();
  }, [open, selectedDepartmentId]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose, open]);

  if (!open) {
    return null;
  }

  const updateValue = (
    field: keyof AddressModalSubmitValues,
    value: string,
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
      ...(field === "departmentId" ? { districtId: "" } : {}),
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      ...(field === "departmentId" ? { districtId: undefined } : {}),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextValues = {
      label: values.label.trim(),
      departmentId: values.departmentId,
      districtId: values.districtId,
      city: values.city.trim(),
      addressLine: values.addressLine.trim(),
      phone: values.phone.trim(),
    };

    const nextErrors = validateValues(nextValues);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit(nextValues);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111111]/45 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-modal-title"
        className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_24px_70px_rgba(17,17,17,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2
              id="address-modal-title"
              className="text-2xl font-extrabold text-[#111111]"
            >
              {title}
            </h2>

            <p className="mt-1 text-sm leading-6 text-[#4A4A4A]">
              Completa los datos para mantener tu libreta actualizada.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar formulario de dirección"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form className="px-5 py-5 sm:px-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="address-label"
                className="text-sm font-bold text-[#111111]"
              >
                Etiqueta
              </label>

              <input
                id="address-label"
                list="address-label-options"
                value={values.label}
                onChange={(event) => updateValue("label", event.target.value)}
                className={inputClassName}
                placeholder="Casa, Trabajo u otra"
                aria-invalid={Boolean(errors.label)}
                disabled={isSubmitting}
              />

              <datalist id="address-label-options">
                <option value="Casa" />
                <option value="Trabajo" />
                <option value="Otro" />
              </datalist>

              <ErrorText message={errors.label} />
            </div>

            <div>
              <label
                htmlFor="address-phone"
                className="text-sm font-bold text-[#111111]"
              >
                Teléfono
              </label>

              <input
                id="address-phone"
                value={values.phone}
                onChange={(event) => updateValue("phone", event.target.value)}
                className={inputClassName}
                placeholder="Teléfono de contacto"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={Boolean(errors.phone)}
                disabled={isSubmitting}
              />

              <ErrorText message={errors.phone} />
            </div>

            <div>
              <label
                htmlFor="address-department"
                className="text-sm font-bold text-[#111111]"
              >
                Departamento
              </label>

              <select
                id="address-department"
                value={values.departmentId}
                onChange={(event) =>
                  updateValue("departmentId", event.target.value)
                }
                className={inputClassName}
                aria-invalid={Boolean(errors.departmentId)}
                disabled={isSubmitting}
              >
                <option value="">Selecciona un departamento</option>

                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>

              <ErrorText message={errors.departmentId} />
            </div>

            <div>
              <label
                htmlFor="address-district"
                className="text-sm font-bold text-[#111111]"
              >
                Distrito
              </label>

              <select
                id="address-district"
                value={values.districtId}
                onChange={(event) =>
                  updateValue("districtId", event.target.value)
                }
                className={inputClassName}
                aria-invalid={Boolean(errors.districtId)}
                disabled={isSubmitting || !values.departmentId}
              >
                <option value="">Selecciona un distrito</option>

                {districtOptions.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>

              <ErrorText message={errors.districtId} />
            </div>

            <div>
              <label
                htmlFor="address-city"
                className="text-sm font-bold text-[#111111]"
              >
                Ciudad
              </label>

              <input
                id="address-city"
                value={values.city}
                onChange={(event) => updateValue("city", event.target.value)}
                className={inputClassName}
                placeholder="Ciudad"
                autoComplete="address-level2"
                disabled={isSubmitting}
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="address-line"
                className="text-sm font-bold text-[#111111]"
              >
                Dirección exacta
              </label>

              <textarea
                id="address-line"
                value={values.addressLine}
                onChange={(event) =>
                  updateValue("addressLine", event.target.value)
                }
                className="min-h-28 w-full resize-none rounded-lg border border-slate-200 bg-[#f7f7f8] px-4 py-3 text-sm text-[#333] outline-none transition placeholder:text-[#8d8d93] focus:border-[#2528dc] focus:bg-white focus:ring-4 focus:ring-[#2528dc]/10 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-500"
                placeholder="Calle, pasaje, número de casa o referencia"
                autoComplete="street-address"
                aria-invalid={Boolean(errors.addressLine)}
                disabled={isSubmitting}
              />

              <ErrorText message={errors.addressLine} />
            </div>
          </div>

          {catalogError ? (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700"
            >
              {catalogError}
            </p>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-[#D9E2EC] bg-white px-4 text-sm font-bold text-[#003791] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#003791] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#005BFF] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}

              {submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
