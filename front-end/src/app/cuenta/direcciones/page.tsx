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
} from "@/components/addresses/AddressModal";
import { useAddresses } from "@/hooks/addresses/useAddresses";
import type { CustomerAddress } from "@/types/addresses/address.types";

function AddressCardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 2 }, (_, index) => (
        <div
          key={index}
          className="min-h-[220px] animate-pulse rounded-xl border border-[#e0e3e8] bg-white p-5"
        >
          <div className="h-5 w-28 rounded bg-slate-200" />
          <div className="mt-6 h-4 w-full rounded bg-slate-200" />
          <div className="mt-3 h-4 w-4/5 rounded bg-slate-200" />
          <div className="mt-8 h-10 w-full rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function formatLocation(address: CustomerAddress) {
  return [
    address.city,
    address.district?.name,
    address.department?.name,
  ].filter(Boolean);
}

function AddressCard({
  address,
  onEdit,
}: {
  address: CustomerAddress;
  onEdit: (address: CustomerAddress) => void;
}) {
  const locationParts = formatLocation(address);

  return (
    <article className="flex min-h-[220px] min-w-0 flex-col rounded-xl border border-[#d9dde5] bg-white p-5 shadow-sm transition hover:border-[#b9c6e6] hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-bold text-black">
            {address.label}
          </h2>

          {address.isDefault ? (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-semibold text-[#1822d9]">
              <CheckCircle2
                className="h-4 w-4"
                aria-hidden="true"
              />
              Dirección principal
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onEdit(address)}
            aria-label={`Editar dirección ${address.label}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#d9dde5] text-[#1822d9] transition hover:bg-[#EEF3FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1822d9]"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label={`Eliminar dirección ${address.label}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#d9dde5] text-red-600 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex min-w-0 flex-1 gap-3 text-sm leading-6 text-[#4A4A4A]">
        <MapPin
          className="mt-0.5 h-5 w-5 shrink-0 text-[#1822d9]"
          aria-hidden="true"
        />

        <div className="min-w-0 space-y-2">
          <p className="break-words font-semibold text-[#111111]">
            {address.addressLine}
          </p>

          {locationParts.length > 0 ? (
            <p className="break-words">
              {locationParts.join(", ")}
            </p>
          ) : null}
        </div>
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
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);

  const {
    addresses,
    isLoading,
    error,
    loadAddresses,
  } = useAddresses();

  const hasAddresses = addresses.length > 0;

  const openCreateAddressModal = () => {
    setAddressModalMode("create");
    setSelectedAddress(null);
    setAddressModalKey((currentKey) => currentKey + 1);
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (address: CustomerAddress) => {
    setAddressModalMode("edit");
    setSelectedAddress(address);
    setAddressModalKey((currentKey) => currentKey + 1);
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    if (isSubmittingAddress) {
      return;
    }

    setIsAddressModalOpen(false);
    setSelectedAddress(null);
  };

  const handleAddressModalSubmit = async () => {
    setIsSubmittingAddress(true);
    setIsAddressModalOpen(false);
    setSelectedAddress(null);
    setIsSubmittingAddress(false);
  };

  return (
    <section className="min-h-[calc(100vh-10rem)] text-[#111111]">
      <header className="flex flex-col gap-4 border-b border-[#d9dde5] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Direcciones
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4A4A4A]">
            Administra las direcciones que usas para recibir tus pedidos.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateAddressModal}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-[#1822d9] px-5 text-sm font-semibold text-white transition hover:bg-[#1118b8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1822d9]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva dirección
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
          <div className="rounded-xl border border-dashed border-[#cfd6e4] bg-white px-5 py-12 text-center">
            <h2 className="text-xl font-bold text-black">
              Aún no tienes direcciones guardadas.
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#4A4A4A]">
              Cuando agregues una dirección, aparecerá organizada en esta sección.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
        onClose={closeAddressModal}
        onSubmit={handleAddressModalSubmit}
      />
    </section>
  );
}
