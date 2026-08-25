"use client";

import { MapPin, Store, Truck } from "lucide-react";

type DeliveryType =
  | "HOME_DELIVERY"
  | "STORE_PICKUP";

interface CheckoutShippingProps {
  deliveryType: DeliveryType;
  onDeliveryTypeChange: (
    value: DeliveryType,
  ) => void;
}

const MOCK_DEPARTMENTS = [
  {
    id: "dep-1",
    name: "San Salvador",
  },
  {
    id: "dep-2",
    name: "La Libertad",
  },
  {
    id: "dep-3",
    name: "Santa Ana",
  },
];

const MOCK_DISTRICTS = [
  {
    id: "district-1",
    name: "San Salvador",
  },
  {
    id: "district-2",
    name: "Mejicanos",
  },
  {
    id: "district-3",
    name: "Santa Tecla",
  },
];

const MOCK_BRANCHES = [
  {
    id: "branch-1",
    name: "Woden Metrocentro",
  },
  {
    id: "branch-2",
    name: "Woden Multiplaza",
  },
];

export default function CheckoutShipping({
  deliveryType,
  onDeliveryTypeChange,
}: CheckoutShippingProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* OPCIONES DE ENTREGA */}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() =>
            onDeliveryTypeChange("HOME_DELIVERY")
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
            onDeliveryTypeChange("STORE_PICKUP")
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
                defaultValue=""
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1B21D1] focus:ring-2 focus:ring-[#1B21D1]/15"
              >
                <option value="">
                  Selecciona un departamento
                </option>

                {MOCK_DEPARTMENTS.map(
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
                defaultValue=""
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1B21D1] focus:ring-2 focus:ring-[#1B21D1]/15"
              >
                <option value="">
                  Selecciona un distrito
                </option>

                {MOCK_DISTRICTS.map(
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
                placeholder="Ciudad"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#1B21D1] focus:ring-2 focus:ring-[#1B21D1]/15"
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1B21D1] focus:ring-[#1B21D1]/30"
            />

            <span>
              Guardar mi información y consultar
              más rápidamente la próxima vez
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
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <select
              id="branchId"
              name="branchId"
              defaultValue=""
              className="w-full appearance-none rounded-md border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 outline-none focus:border-[#1B21D1] focus:ring-2 focus:ring-[#1B21D1]/15"
            >
              <option value="">
                Selecciona una sucursal
              </option>

              {MOCK_BRANCHES.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                >
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}