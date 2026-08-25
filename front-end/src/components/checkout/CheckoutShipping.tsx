"use client";

import { useState } from "react";
import { Truck, MapPin } from "lucide-react";

type DeliveryType = "HOME_DELIVERY" | "STORE_PICKUP";

const MOCK_DEPARTMENTS = [
  { id: "dep-1", name: "San Salvador" },
  { id: "dep-2", name: "La Libertad" },
  { id: "dep-3", name: "Santa Ana" },
];

const MOCK_DISTRICTS: Record<string, { id: string; name: string }[]> = {
  "dep-1": [
    { id: "dis-1", name: "Apopa" },
    { id: "dis-2", name: "Mejicanos" },
  ],
  "dep-2": [
    { id: "dis-3", name: "Antiguo Cuscatlán" },
    { id: "dis-4", name: "Santa Tecla" },
  ],
  "dep-3": [
    { id: "dis-5", name: "Santa Ana Centro" },
  ],
};

const MOCK_BRANCHES = [
  { id: "branch-1", name: "Woden Metrocentro" },
  { id: "branch-2", name: "Woden Multiplaza" },
];

export default function CheckoutShipping() {
  const [deliveryType, setDeliveryType] =
    useState<DeliveryType>("HOME_DELIVERY");

  const [departmentId, setDepartmentId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [city, setCity] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [saveInfo, setSaveInfo] = useState(false);
  const [branchId, setBranchId] = useState("");

  const districts = departmentId
    ? MOCK_DISTRICTS[departmentId] ?? []
    : [];

  const handleDeliveryChange = (type: DeliveryType) => {
    setDeliveryType(type);

    if (type === "HOME_DELIVERY") {
      // Limpiar datos exclusivos de retiro en tienda
      setBranchId("");
    } else {
      // Limpiar datos exclusivos de domicilio
      setDepartmentId("");
      setDistrictId("");
      setCity("");
      setAddressLine("");
      setSaveInfo(false);
    }
  };

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value);

    // Al cambiar departamento se limpia el distrito anterior
    setDistrictId("");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <ToggleOption
          icon={<Truck className="h-4 w-4" />}
          label="Domicilio"
          active={deliveryType === "HOME_DELIVERY"}
          onClick={() => handleDeliveryChange("HOME_DELIVERY")}
        />

        <ToggleOption
          icon={<MapPin className="h-4 w-4" />}
          label="Retiro en tienda"
          active={deliveryType === "STORE_PICKUP"}
          onClick={() => handleDeliveryChange("STORE_PICKUP")}
        />
      </div>

      {deliveryType === "HOME_DELIVERY" ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Departamento"
              value={departmentId}
              options={MOCK_DEPARTMENTS}
              onChange={handleDepartmentChange}
            />

            <SelectField
              label="Distrito"
              value={districtId}
              options={districts}
              disabled={!departmentId}
              onChange={setDistrictId}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Dirección"
              value={addressLine}
              onChange={setAddressLine}
            />

            <TextInput
              label="Ciudad"
              value={city}
              onChange={setCity}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={saveInfo}
              onChange={(event) => setSaveInfo(event.target.checked)}
              className="h-4 w-4 rounded border-gray-900 text-[#1B21D1] focus:ring-[#1B21D1]/30"
            />

            Guardar mi información y consultar más rápidamente la próxima vez
          </label>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm text-gray-600">
            Seleccione sucursal{" "}
            <span className="text-red-500">*</span>
          </label>

          <select
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
            className="w-full rounded-md border border-gray-900 bg-white px-4 py-3 text-sm text-gray-700 focus:border-[#1B21D1] focus:outline-none focus:ring-2 focus:ring-[#1B21D1]/15"
          >
            <option value="">Selecciona Sucursal</option>

            {MOCK_BRANCHES.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function ToggleOption({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition ${
        active
          ? "border-[#1B21D1] text-[#1B21D1] ring-1 ring-[#1B21D1]"
          : "border-gray-900 text-gray-500 hover:border-gray-900"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SelectField({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; name: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-md border border-gray-900 bg-white px-4 py-3 text-sm text-gray-900 focus:border-[#1B21D1] focus:outline-none focus:ring-2 focus:ring-[#1B21D1]/15 disabled:bg-gray-50 disabled:text-gray-900"
    >
      <option value="">{label}</option>

      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      placeholder={label}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-md border border-gray-900 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-900 focus:border-[#1B21D1] focus:outline-none focus:ring-2 focus:ring-[#1B21D1]/15"
    />
  );
}