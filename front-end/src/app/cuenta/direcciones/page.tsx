"use client";

import {
  CheckCircle2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import AddressModal, {
  type AddressModalMode,
  type AddressModalSubmitValues,
} from "@/components/addresses/AddressModal";
import { useAddresses } from "@/hooks/addresses/useAddresses";
import type {
  CreateAddressRequest,
  CustomerAddress,
  UpdateAddressRequest,
} from "@/types/addresses/address.types";

function AddressCardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }, (_, index) => (
        <div
          key={index}
          className="flex min-h-[116px] animate-pulse gap-4 rounded-md bg-[#F1F0FF] px-4 py-3 sm:px-5"
        >
          <div className="h-9 w-9 shrink-0 rounded-full bg-[#DDE5FF]" />

          <div className="min-w-0 flex-1">
            <div className="h-4 w-24 rounded bg-[#D7D6F5]" />
            <div className="mt-3 h-3 w-36 rounded bg-[#D7D6F5]" />
            <div className="mt-2 h-3 w-48 max-w-full rounded bg-[#D7D6F5]" />
            <div className="mt-2 h-3 w-64 max-w-full rounded bg-[#D7D6F5]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getAddressLocationLines(address: CustomerAddress) {
  const city = address.city?.trim();
  const districtLine = [
    address.district?.name,
    address.department?.name,
  ].filter(Boolean);

  return {
    city,
    districtLine:
      districtLine.length > 0 ? districtLine.join(" / ") : null,
  };
}

function toAddressPayload(
  values: AddressModalSubmitValues,
): CreateAddressRequest {
  const payload: CreateAddressRequest = {
    label: values.label,
    departmentId: values.departmentId,
    districtId: values.districtId,
    addressLine: values.addressLine,
  };

  if (values.city) {
    payload.city = values.city;
  }

  return payload;
}

function AddressCard({
  address,
  onEdit,
}: {
  address: CustomerAddress;
  onEdit: (address: CustomerAddress) => void;
}) {
  const { city, districtLine } = getAddressLocationLines(address);

  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-md bg-[#F1F0FF] px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5">
      <div className="flex min-w-0 gap-3 sm:gap-4">
        <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#1822d9]">
          <MapPin
            className="h-5 w-5"
            strokeWidth={1.7}
            aria-hidden="true"
          />

          {address.isDefault ? (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1822d9] text-white">
              <CheckCircle2
                className="h-3 w-3"
                aria-hidden="true"
              />
            </span>
          ) : null}
        </span>

        <div className="min-w-0 text-sm leading-5 text-[#4A4A4A]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="break-words text-[15px] font-bold text-black">
              {address.label}
            </h2>

            {address.isDefault ? (
              <span className="text-xs font-semibold text-[#1822d9]">
                Dirección principal
              </span>
            ) : null}
          </div>

          {city ? (
            <p className="mt-1 break-words font-medium text-[#333333]">
              {city}
            </p>
          ) : null}

          {districtLine ? (
            <p className="break-words">{districtLine}</p>
          ) : null}

          <p className="mt-1 break-words text-[#333333]">
            {address.addressLine}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
        <button
          type="button"
          onClick={() => onEdit(address)}
          aria-label={`Editar dirección ${address.label}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded text-[#1822d9] transition hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1822d9]"
        >
          <Pencil
            className="h-4 w-4"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          aria-label={`Eliminar dirección ${address.label}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded text-red-600 transition hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          <Trash2
            className="h-4 w-4"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </button>
      </div>
    </article>
  );
}

export default function AddressesPage() {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressModalMode, setAddressModalMode] =
    useState<AddressModalMode>("create");
  const [selectedAddress, setSelectedAddress] =
    useState<CustomerAddress | null>(null);
  const [addressModalKey, setAddressModalKey] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const [hasSubmitFailure, setHasSubmitFailure] = useState(false);

  const {
    addresses,
    isLoading,
    error,
    operation,
    operationAddressId,
    isMutating,
    loadAddresses,
    createAddress,
    updateAddress,
  } = useAddresses();

  const hasAddresses = addresses.length > 0;
  const isAddressSaveOperation =
    operation === "create" ||
    (operation === "update" &&
      (!selectedAddress || operationAddressId === selectedAddress.id));
  const isSubmittingAddress = isMutating && isAddressSaveOperation;
  const addressSubmitError =
    isAddressModalOpen && hasSubmitFailure
      ? error?.message ?? submitError
      : submitError;

  const openCreateAddressModal = () => {
    setAddressModalMode("create");
    setSelectedAddress(null);
    setSubmitError("");
    setHasSubmitFailure(false);
    setAddressModalKey((currentKey) => currentKey + 1);
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (address: CustomerAddress) => {
    setAddressModalMode("edit");
    setSelectedAddress(address);
    setSubmitError("");
    setHasSubmitFailure(false);
    setAddressModalKey((currentKey) => currentKey + 1);
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    if (isSubmittingAddress) {
      return;
    }

    setIsAddressModalOpen(false);
    setSelectedAddress(null);
    setSubmitError("");
    setHasSubmitFailure(false);
  };

  const handleAddressModalSubmit = async (
    values: AddressModalSubmitValues,
  ) => {
    setSubmitError("");
    setHasSubmitFailure(false);

    const payload = toAddressPayload(values);
    const savedAddress =
      addressModalMode === "edit"
        ? await (async () => {
            if (!selectedAddress) {
              return null;
            }

            const updatePayload: UpdateAddressRequest = payload;

            return updateAddress(selectedAddress.id, updatePayload);
          })()
        : await createAddress(payload);

    if (!savedAddress) {
      setHasSubmitFailure(true);
      setSubmitError(
        selectedAddress
          ? "No pudimos guardar los cambios de la direccion."
          : "No pudimos guardar la direccion.",
      );

      return;
    }

    setIsAddressModalOpen(false);
    setSelectedAddress(null);
    setSubmitError("");
    setHasSubmitFailure(false);
  };

  return (
    <section className="min-h-[calc(100vh-10rem)] text-[#111111]">
      <header className="flex flex-col gap-4 border-b border-[#d9dde5] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
          Direcciones
        </h1>

        <button
          type="button"
          onClick={openCreateAddressModal}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-[#1822d9] px-4 text-sm font-semibold text-white transition hover:bg-[#1118b8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1822d9]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva Dirección
        </button>
      </header>

      <div className="mt-8">
        {error ? (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700"
          >
            <p>{error.message}</p>

            <button
              type="button"
              onClick={() => void loadAddresses()}
              className="mt-3 text-[#1822d9] underline-offset-4 hover:underline"
            >
              Intentar nuevamente
            </button>
          </div>
        ) : null}

        {isLoading && !hasAddresses ? (
          <AddressCardSkeleton />
        ) : !hasAddresses && !error ? (
          <div className="rounded-md bg-[#F1F0FF] px-5 py-10 text-center">
            <h2 className="text-lg font-bold text-black">
              Aún no tienes direcciones guardadas.
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#4A4A4A]">
              Cuando agregues una dirección, aparecerá organizada en esta sección.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={openEditAddressModal}
              />
            ))}
          </div>
        )}
      </div>

      <AddressModal
        key={addressModalKey}
        open={isAddressModalOpen}
        mode={addressModalMode}
        initialAddress={selectedAddress}
        isSubmitting={isSubmittingAddress}
        submitError={addressSubmitError}
        onClose={closeAddressModal}
        onSubmit={handleAddressModalSubmit}
      />
    </section>
  );
}
