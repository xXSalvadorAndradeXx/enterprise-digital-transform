"use client";

import { CalendarDays, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import type { ZodIssue } from "zod";

import {
  invoiceSchema,
  editPurchaseSchema,
  newProductSchema,
  restockSchema,
} from "../../schemas/purchaseForm.schema";
import {
  AddedProductsTable,
  type AddedProduct,
} from "./AddedProductsTable";
import { FileUploadInput } from "./FileUploadInput";
import { IncomeDetailsPanel } from "./IncomeDetailsPanel";
import {
  createInitialNewProductDraft,
  NewProductForm,
  type NewProductDraft,
  type NewProductFormErrors,
} from "./NewProductForm";
import { PurchaseSuccessModal } from "./PurchaseSuccessModal";
import {
  INITIAL_RESTOCK_DRAFT,
  createInitialRestockDraft,
  RestockProductForm,
  type RestockDraft,
  type RestockFormErrors,
} from "./RestockProductForm";
import { Tabs, type TabItem } from "./Tabs";
import type { EditablePurchase } from "../../types/purchaseEdit.types";
import {
  getPurchaseChanges,
  type PurchaseEditSnapshot,
} from "../../utils/getPurchaseChanges";
import { DeletePurchaseConfirmModal } from "../DeletePurchaseConfirmModal";
import { DeletePurchaseSuccessModal } from "../DeletePurchaseSuccessModal";

type PurchaseTab = "new-product" | "restock-product";

type PurchaseFormProps = {
  mode?: "create" | "edit";
  initialData?: EditablePurchase;
  reference?: string;
};

const PURCHASE_TABS: readonly TabItem<PurchaseTab>[] = [
  { value: "new-product", label: "Nuevo producto" },
  { value: "restock-product", label: "Reabastecer producto" },
];

function getLocalDate(): string {
  const now = new Date();
  const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}

function getInvoiceIssue(issues: ZodIssue[]): string {
  return issues.find((issue) => issue.path[0] === "invoice")?.message ?? "";
}

function mapNewProductErrors(
  issues: ZodIssue[],
  draft: NewProductDraft,
): NewProductFormErrors {
  const errors: NewProductFormErrors = { variants: {} };
  for (const issue of issues) {
    const [section, index, field] = issue.path;
    if (section === "name" && !errors.name) errors.name = issue.message;
    if (section === "category" && !errors.category) errors.category = issue.message;
    if (section !== "variants") continue;
    if (typeof index !== "number") {
      if (!errors.variantsGeneral) errors.variantsGeneral = issue.message;
      continue;
    }
    const variant = draft.variants[index];
    if (!variant || typeof field !== "string") continue;
    const variantErrors = errors.variants?.[variant.id] ?? {};
    if (field === "size" || field === "quantity" || field === "unitCost") {
      variantErrors[field] ??= issue.message;
    }
    if (errors.variants) errors.variants[variant.id] = variantErrors;
  }
  return errors;
}

function mapRestockErrors(
  issues: ZodIssue[],
  draft: RestockDraft,
): RestockFormErrors {
  const errors: RestockFormErrors = { sizes: {} };
  for (const issue of issues) {
    const [section, index] = issue.path;
    if (section === "selectedProductId" && !errors.selectedProductId) {
      errors.selectedProductId = issue.message;
    }
    if (section !== "sizes") continue;
    if (typeof index !== "number") {
      if (!errors.sizesGeneral) errors.sizesGeneral = issue.message;
      continue;
    }
    const row = draft.sizes[index];
    if (row && errors.sizes && !errors.sizes[row.size]) {
      errors.sizes[row.size] = issue.message;
    }
  }
  return errors;
}

export function PurchaseForm({
  mode = "create",
  initialData,
  reference,
}: PurchaseFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const [originalEditData] = useState<PurchaseEditSnapshot | null>(() =>
    initialData
      ? {
          date: initialData.date,
          supplierId: initialData.supplierId,
          productId: initialData.product.id,
          productName: initialData.product.name,
          categoryId: initialData.product.category,
          variants: initialData.product.variants.map((variant) => ({ ...variant })),
        }
      : null,
  );
  const [activeTab, setActiveTab] = useState<PurchaseTab>("new-product");
  const [purchaseDate, setPurchaseDate] = useState(() => initialData?.date ?? getLocalDate());
  const [supplierId, setSupplierId] = useState(() => initialData?.supplierId ?? "");
  const [invoice, setInvoice] = useState<File | null>(null);
  const [invoiceError, setInvoiceError] = useState("");
  const [newProduct, setNewProduct] = useState<NewProductDraft>(() =>
    initialData
      ? {
          name: initialData.product.name,
          category: initialData.product.category,
          variants: initialData.product.variants.map((variant) => ({ ...variant })),
        }
      : createInitialNewProductDraft(),
  );
  const [restock, setRestock] = useState<RestockDraft>(INITIAL_RESTOCK_DRAFT);
  const [newProductInteracted, setNewProductInteracted] = useState(false);
  const [restockInteracted, setRestockInteracted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [purchaseNumber, setPurchaseNumber] = useState(reference ?? "");
  const [addedProducts, setAddedProducts] = useState<AddedProduct[]>(() => {
    if (!initialData) return [];
    const variants = initialData.product.variants.map((variant) => ({ ...variant }));
    const quantity = variants.reduce((sum, variant) => sum + Number(variant.quantity), 0);
    const total = variants.reduce(
      (sum, variant) => sum + Number(variant.quantity) * Number(variant.unitCost),
      0,
    );
    return [{
      id: initialData.product.id,
      name: initialData.product.name,
      sku: initialData.product.sku,
      invoiceFile: null,
      variants,
      quantity,
      unitCost: Number(variants[0]?.unitCost ?? 0),
      total,
    }];
  });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editSubmitAttempted, setEditSubmitAttempted] = useState(false);
  const [productPendingDeleteId, setProductPendingDeleteId] =
    useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false);
  const [deleteTrigger, setDeleteTrigger] =
    useState<HTMLButtonElement | null>(null);
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null);
  const sequenceRef = useRef(5);
  const productSequenceRef = useRef(1);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const handleInvoiceChange = (file: File | null) => {
    if (!file) {
      setInvoice(null);
      setInvoiceError("");
      return;
    }
    const result = invoiceSchema.safeParse(file);
    if (!result.success) {
      setInvoice(null);
      setInvoiceError(result.error.issues[0]?.message ?? "");
      return;
    }
    setInvoice(file);
    setInvoiceError("");
  };

  const handleAddPurchase = () => {
    if (isEdit) {
      setEditSubmitAttempted(true);
      const validation = editPurchaseSchema.safeParse({
        date: purchaseDate,
        supplierId,
        productId: initialData?.product.id ?? "",
        name: newProduct.name,
        category: newProduct.category,
        variants: newProduct.variants,
        existingInvoice: initialData?.existingInvoice ?? null,
        replacementInvoice: invoice,
      });
      if (!validation.success) {
        setNewProductInteracted(true);
        const invoiceIssue = validation.error.issues.find(
          (issue) => issue.path[0] === "replacementInvoice",
        );
        setInvoiceError(invoiceIssue?.message ?? invoiceError);
        return;
      }

      // Resumen local para TASK 691. No se envía ni persiste.
      void editChanges.changedFields;
      setModalOpen(true);
      return;
    }
    if (activeTab === "new-product") {
      setNewProductInteracted(true);
      const validation = newProductSchema.safeParse({ ...newProduct, invoice });
      if (!validation.success) {
        setInvoiceError(getInvoiceIssue(validation.error.issues));
        return;
      }

      const variants = newProduct.variants.map((variant) => ({ ...variant }));
      const quantity = variants.reduce((sum, variant) => {
        const value = Number(variant.quantity);
        return Number.isFinite(value) && value >= 0 ? sum + value : sum;
      }, 0);
      const total = variants.reduce((sum, variant) => {
        const quantityValue = Number(variant.quantity);
        const costValue = Number(variant.unitCost);
        return Number.isFinite(quantityValue) &&
          quantityValue >= 0 &&
          Number.isFinite(costValue) &&
          costValue >= 0
          ? sum + quantityValue * costValue
          : sum;
      }, 0);
      const validCosts = variants
        .map((variant) => Number(variant.unitCost))
        .filter((cost) => Number.isFinite(cost) && cost >= 0);
      const localSequence = productSequenceRef.current++;

      setAddedProducts((current) => [
        ...current,
        {
          id: `qa-local-product-${localSequence}`,
          reference: `CP-${String(sequenceRef.current).padStart(4, "0")}`,
          name: newProduct.name.trim(),
          sku: `QA-LOCAL-${String(localSequence).padStart(4, "0")}`,
          invoiceFile: invoice,
          variants,
          quantity,
          unitCost: validCosts[0] ?? 0,
          total,
        },
      ]);
      setInvoice(null);
      setInvoiceError("");
      setNewProduct(createInitialNewProductDraft());
      setNewProductInteracted(false);
    } else {
      setRestockInteracted(true);
      const validation = restockSchema.safeParse({ ...restock, invoice });
      if (!validation.success) {
        setInvoiceError(getInvoiceIssue(validation.error.issues));
        return;
      }
      setInvoice(null);
      setInvoiceError("");
      setRestock(createInitialRestockDraft());
      setRestockInteracted(false);
    }

    // Número temporal para demostración de TASK 686.
    // Reemplazar por el número devuelto por Backend.
    setPurchaseNumber(`CP-${String(sequenceRef.current).padStart(4, "0")}`);
    sequenceRef.current += 1;
    setModalOpen(true);
  };

  const closeIncomeDetails = useCallback(() => {
    setSelectedProductId(null);
    window.requestAnimationFrame(() => detailTriggerRef.current?.focus());
  }, []);

  const selectedProduct =
    addedProducts.find((product) => product.id === selectedProductId) ?? null;
  const productPendingDelete =
    addedProducts.find((product) => product.id === productPendingDeleteId) ?? null;

  const closeProductDeleteConfirmation = useCallback(() => {
    setDeleteConfirmOpen(false);
    setProductPendingDeleteId(null);
  }, []);

  const confirmProductDelete = useCallback(() => {
    if (!productPendingDeleteId) return;
    setAddedProducts((current) =>
      current.filter((product) => product.id !== productPendingDeleteId),
    );
    setDeleteConfirmOpen(false);
    setProductPendingDeleteId(null);
    setDeleteSuccessOpen(true);
  }, [productPendingDeleteId]);

  const closeProductDeleteSuccess = useCallback(() => {
    setDeleteSuccessOpen(false);
    setDeleteTrigger(null);
  }, []);

  const saveIncomeDetails = (variants: NewProductDraft["variants"]) => {
    if (!selectedProductId) return;
    setAddedProducts((current) =>
      current.map((product) => {
        if (product.id !== selectedProductId) return product;
        const quantity = variants.reduce((sum, variant) => {
          const value = Number(variant.quantity);
          return Number.isFinite(value) && value >= 0 ? sum + value : sum;
        }, 0);
        const total = variants.reduce((sum, variant) => {
          const quantityValue = Number(variant.quantity);
          const costValue = Number(variant.unitCost);
          return Number.isFinite(quantityValue) &&
            quantityValue >= 0 &&
            Number.isFinite(costValue) &&
            costValue >= 0
            ? sum + quantityValue * costValue
            : sum;
        }, 0);
        const representativeCost = variants
          .map((variant) => Number(variant.unitCost))
          .find((cost) => Number.isFinite(cost) && cost >= 0);
        return {
          ...product,
          variants: variants.map((variant) => ({ ...variant })),
          quantity,
          unitCost: representativeCost ?? 0,
          total,
        };
      }),
    );
    closeIncomeDetails();
  };

  const newProductValidation = newProductSchema.safeParse({
    ...newProduct,
    invoice,
  });
  const restockValidation = restockSchema.safeParse({ ...restock, invoice });
  const editValidation = editPurchaseSchema.safeParse({
    date: purchaseDate,
    supplierId,
    productId: initialData?.product.id ?? "",
    name: newProduct.name,
    category: newProduct.category,
    variants: newProduct.variants,
    existingInvoice: initialData?.existingInvoice ?? null,
    replacementInvoice: invoice,
  });
  const currentEditSnapshot: PurchaseEditSnapshot = {
    date: purchaseDate,
    supplierId,
    productId: initialData?.product.id ?? "",
    productName: newProduct.name,
    categoryId: newProduct.category,
    variants: newProduct.variants,
  };
  const editChanges = originalEditData
    ? getPurchaseChanges(originalEditData, currentEditSnapshot, invoice)
    : { hasChanges: false, changedFields: {} };
  const newProductErrors =
    (newProductInteracted || editSubmitAttempted) &&
    !(isEdit ? editValidation : newProductValidation).success
      ? mapNewProductErrors(
          (isEdit && !editValidation.success
            ? editValidation.error
            : !newProductValidation.success
              ? newProductValidation.error
              : { issues: [] }
          ).issues,
          newProduct,
        )
      : undefined;
  const restockErrors =
    restockInteracted && !restockValidation.success
      ? mapRestockErrors(restockValidation.error.issues, restock)
      : undefined;
  const activeValidation =
    activeTab === "new-product" ? newProductValidation : restockValidation;
  const activeInteracted =
    activeTab === "new-product" ? newProductInteracted : restockInteracted;
  const displayedInvoiceError =
    invoiceError ||
    (activeInteracted && !activeValidation.success
      ? getInvoiceIssue(activeValidation.error.issues)
      : "");

  return (
    <div className="mx-auto w-full max-w-[1035px] min-w-0 text-[#202124]">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-[6px] border border-[#D9DAE0] bg-white px-5 py-5 sm:px-7">
        <h1 className="font-[var(--font-title)] text-[32px] leading-10 font-bold">
          {isEdit ? `Editar compra #${reference ?? purchaseNumber}` : "Nueva Compra"}
        </h1>
        <button
          type="button"
          onClick={() => router.push("/compras")}
          className="inline-flex h-11 items-center gap-2 rounded-[5px] border border-[#1C21D1] bg-white px-5 font-semibold text-[#202124] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1]"
        >
          <ChevronLeft aria-hidden="true" size={20} />
          Volver
        </button>
      </header>

      <div className="mt-4 grid gap-6 rounded-[6px] border border-[#D9DAE0] bg-white px-5 py-5 sm:px-7 sm:py-6 md:grid-cols-2 md:gap-10">
          <div>
            <label htmlFor="purchase-date" className="mb-2 block text-sm font-medium">
              Fecha de compra
            </label>
            <div className="relative">
              <CalendarDays
                aria-hidden="true"
                size={18}
                strokeWidth={1.8}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A4A]"
              />
              <input
                id="purchase-date"
                type="date"
                value={purchaseDate}
                onChange={(event) => setPurchaseDate(event.target.value)}
                className="h-11 w-full rounded-[5px] border border-[#878A92] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#1C21D1] focus:ring-1 focus:ring-[#1C21D1] [&::-webkit-calendar-picker-indicator]:opacity-0"
              />
            </div>
          </div>
          <div>
            {isEdit && initialData ? (
              <>
                <p
                  id="purchase-supplier-product-label"
                  className="mb-2 block text-sm font-medium"
                >
                  Seleccionar proveedor / producto
                </p>
                <div className="w-full max-w-[360px]">
                  <select
                    id="purchase-supplier"
                    aria-labelledby="purchase-supplier-product-label"
                    value={supplierId}
                    onChange={(event) => setSupplierId(event.target.value)}
                    className="relative z-0 block h-11 w-full rounded-t-[5px] rounded-b-none border border-[#878A92] bg-white px-3 text-sm outline-none focus:z-10 focus:border-[#1C21D1] focus:ring-1 focus:ring-[#1C21D1]"
                  >
                    <option value="">Proveedor</option>
                    <option value="global">Distribuidora global</option>
                    <option value="local">Proveedor local</option>
                  </select>
                  <select
                    id="purchase-product"
                    aria-labelledby="purchase-supplier-product-label"
                    value={initialData.product.id}
                    onChange={() => undefined}
                    className="relative z-0 -mt-px block h-11 w-full rounded-t-none rounded-b-[5px] border border-[#878A92] bg-white px-3 text-sm outline-none focus:z-10 focus:border-[#1C21D1] focus:ring-1 focus:ring-[#1C21D1]"
                  >
                    <option value={initialData.product.id}>
                      {initialData.product.name}
                    </option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <label
                  htmlFor="purchase-supplier"
                  className="mb-2 block text-sm font-medium"
                >
                  Seleccionar proveedor
                </label>
                <select
                  id="purchase-supplier"
                  value={supplierId}
                  onChange={(event) => setSupplierId(event.target.value)}
                  className="h-11 w-full max-w-[360px] rounded-[5px] border border-[#878A92] bg-white px-3 text-sm outline-none focus:border-[#1C21D1] focus:ring-1 focus:ring-[#1C21D1]"
                >
                  {/* Datos exclusivamente visuales para TASK 686.
                      Retirar cuando Backend exponga el contrato real de proveedores. */}
                  <option value="">Proveedor</option>
                  <option value="global">Distribuidora global</option>
                  <option value="local">Proveedor local</option>
                </select>
              </>
            )}
          </div>
      </div>

      <div className="mt-4">
        {!isEdit && (
          <Tabs
            items={PURCHASE_TABS}
            value={activeTab}
            onValueChange={setActiveTab}
            ariaLabel="Tipo de compra"
            className="rounded-t-[6px]"
          />
        )}

        <div
          className={`${isEdit ? "" : "mt-2"} rounded-[6px] border border-[#B8CBEA] bg-white`}
        >
          <div
            role="tabpanel"
            aria-label={
              isEdit
                ? "Editar compra"
                : PURCHASE_TABS.find((tab) => tab.value === activeTab)?.label
            }
            className="px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7"
          >
            {activeTab === "new-product" ? (
              <NewProductForm
                value={newProduct}
                onChange={(value) => {
                  setNewProduct(value);
                  setNewProductInteracted(true);
                  if (isEdit) {
                    setAddedProducts((current) =>
                      current.map((product) => {
                        if (product.id !== initialData?.product.id) return product;
                        const quantity = value.variants.reduce(
                          (sum, variant) => sum + Number(variant.quantity || 0),
                          0,
                        );
                        const total = value.variants.reduce(
                          (sum, variant) =>
                            sum +
                            Number(variant.quantity || 0) *
                              Number(variant.unitCost || 0),
                          0,
                        );
                        return {
                          ...product,
                          name: value.name,
                          variants: value.variants.map((variant) => ({ ...variant })),
                          quantity,
                          unitCost: Number(value.variants[0]?.unitCost ?? 0),
                          total,
                        };
                      }),
                    );
                  }
                }}
                errors={newProductErrors}
              />
            ) : (
              <RestockProductForm
                value={restock}
                onChange={(value) => {
                  setRestock(value);
                  setRestockInteracted(true);
                }}
                errors={restockErrors}
              />
            )}
          </div>

          <div
            className={`px-5 py-5 sm:px-7 sm:py-6 ${
              isEdit
                ? "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
                : ""
            }`}
          >
            <FileUploadInput
              id={`purchase-invoice-${activeTab}`}
              label="Subir factura"
              file={invoice}
              onFileChange={handleInvoiceChange}
              error={
                isEdit && initialData?.existingInvoice
                  ? invoiceError
                  : displayedInvoiceError
              }
              existingInvoice={isEdit ? initialData?.existingInvoice : null}
            />

          <div
            className={`flex flex-col-reverse justify-end gap-3 sm:flex-row sm:gap-4 ${
              isEdit ? "" : "mt-6"
            }`}
          >
            <button
              type="button"
              onClick={() => router.push("/compras")}
              className="h-11 rounded-[5px] border border-[#1C21D1] bg-white px-7 font-semibold text-[#202124] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1] sm:min-w-32"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddPurchase}
              disabled={
                isEdit
                  ? !editValidation.success || !editChanges.hasChanges
                  : !activeValidation.success
              }
              className="h-11 rounded-[5px] bg-[#1C21D1] px-7 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1] sm:min-w-40"
            >
              Agregar compra
            </button>
          </div>
        </div>
      </div>
      </div>

      {!isEdit && (
        <AddedProductsTable
          products={addedProducts}
          onOpen={(productId, trigger) => {
            detailTriggerRef.current = trigger;
            setSelectedProductId(productId);
          }}
          onRemove={(productId, trigger) => {
            setDeleteTrigger(trigger);
            setProductPendingDeleteId(productId);
            setDeleteConfirmOpen(true);
          }}
        />
      )}

      {!isEdit && selectedProduct && (
        <IncomeDetailsPanel
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={closeIncomeDetails}
          onSave={saveIncomeDetails}
        />
      )}

      <PurchaseSuccessModal
        open={modalOpen}
        purchaseNumber={purchaseNumber}
        onAccept={() => {
          closeModal();
          if (isEdit) router.push("/compras");
        }}
        onClose={closeModal}
        title={isEdit ? "¡Modificado con éxito!" : undefined}
        description={isEdit ? "Se ha creado correctamente." : undefined}
      />
      {!isEdit && (
        <>
          <DeletePurchaseConfirmModal
            open={deleteConfirmOpen}
            reference={productPendingDelete?.reference ?? ""}
            returnFocusTo={deleteTrigger}
            onCancel={closeProductDeleteConfirmation}
            onConfirm={confirmProductDelete}
          />
          <DeletePurchaseSuccessModal
            open={deleteSuccessOpen}
            onClose={closeProductDeleteSuccess}
          />
        </>
      )}
    </div>
  );
}
