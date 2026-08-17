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
import { usePurchaseSuppliers } from "../../hooks/usePurchaseSuppliers";
import { usePurchaseCategories } from "../../hooks/usePurchaseCategories";
import {
  createNewProductPurchase,
  createRestockPurchase,
  updatePurchase,
  uploadPurchaseInvoice,
} from "../../services/purchases.service";

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
    if (section === "brand" && !errors.brand) errors.brand = issue.message;
    if (section === "category" && !errors.category) errors.category = issue.message;
    if (section !== "variants") continue;
    if (typeof index !== "number") {
      if (!errors.variantsGeneral) errors.variantsGeneral = issue.message;
      continue;
    }
    const variant = draft.variants[index];
    if (!variant || typeof field !== "string") continue;
    const variantErrors = errors.variants?.[variant.id] ?? {};
    if (field === "size" || field === "quantity" || field === "unitCost" || field === "color") {
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
    if (row && errors.sizes && !errors.sizes[row.id]) {
      errors.sizes[row.id] = issue.message;
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
  const {
    suppliers,
    loading: suppliersLoading,
    error: suppliersError,
  } = usePurchaseSuppliers();
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = usePurchaseCategories();
  const [originalEditData] = useState<PurchaseEditSnapshot | null>(() =>
    initialData
      ? {
          date: initialData.date,
          supplierId: initialData.supplierId,
          productId: initialData.product.id,
          productName: initialData.product.name,
          brand: initialData.product.brand ?? "",
          categoryId: initialData.product.category,
          gender: initialData.product.gender ?? null,
          variants: initialData.product.variants.map((variant) => ({ ...variant })),
        }
      : null,
  );
  const [activeTab, setActiveTab] = useState<PurchaseTab>("new-product");
  const [purchaseDate, setPurchaseDate] = useState(() => initialData?.date ?? getLocalDate());
  const [supplierId, setSupplierId] = useState(() => initialData?.supplierId ?? "");
  const [supplierValidationVisible, setSupplierValidationVisible] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [invoice, setInvoice] = useState<File | null>(null);
  const [invoiceError, setInvoiceError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProductDraft>(() =>
    initialData
      ? {
          name: initialData.product.name,
          brand: initialData.product.brand ?? "",
          category: initialData.product.category,
          gender: initialData.product.gender ?? "EMPTY",
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
  const sequenceRef = useRef(7);
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

  const handleAddPurchase = async () => {
    setSupplierValidationVisible(true);
    if (!supplierId) return;

    if (isEdit) {
      setEditSubmitAttempted(true);
      const validation = editPurchaseSchema.safeParse({
        date: purchaseDate,
        supplierId,
        productId: initialData?.product.id ?? "",
        name: newProduct.name,
        brand: newProduct.brand,
        category: newProduct.category,
        gender: newProduct.gender,
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

      const variantChanges = editChanges.changedFields.variants;
      if (
        variantChanges &&
        (variantChanges.added.length > 0 || variantChanges.removed.length > 0)
      ) {
        setRegisterError("Error de servidor.");
        return;
      }

      if (initialData) {
        setIsSubmitting(true);
        setRegisterError("");
        try {
          const persistedVariantIds = new Set(
            originalEditData?.variants.map((variant) => variant.id) ?? [],
          );
          const invoiceUrl = invoice
            ? (await uploadPurchaseInvoice(invoice)).invoiceUrl
            : initialData.existingInvoice?.url ?? "";
          const updated = await updatePurchase(initialData.id, {
            supplierId,
            purchaseDate,
            productName: newProduct.name.trim(),
            categoryId: Number(newProduct.category),
            brand: newProduct.brand.trim(),
            gender:
              newProduct.gender === "" || newProduct.gender === "EMPTY"
                ? null
                : newProduct.gender,
            invoiceUrl,
            variants: newProduct.variants.map((variant) => ({
              ...(persistedVariantIds.has(variant.id)
                ? { id: variant.id }
                : {}),
              size: variant.size.trim(),
              color: variant.color.toUpperCase(),
              quantity: Number(variant.quantity),
              unitCost: Number(variant.unitCost),
            })),
          });
          setPurchaseNumber(updated.reference);
        } catch (caught) {
          setRegisterError(
            caught instanceof Error
              ? caught.message
              : "No se pudo modificar la compra.",
          );
          return;
        } finally {
          setIsSubmitting(false);
        }
      }
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
          category: newProduct.category,
          brand: newProduct.brand.trim(),
          gender:
            newProduct.gender === "" || newProduct.gender === "EMPTY"
              ? null
              : newProduct.gender,
        },
      ]);
      setInvoice(null);
      setInvoiceError("");
      setNewProduct(createInitialNewProductDraft());
      setNewProductInteracted(false);
      setRegisterError("");
      return;
    } else {
      setRestockInteracted(true);
      const validation = restockSchema.safeParse({ ...restock, invoice });
      if (!validation.success) {
        setInvoiceError(getInvoiceIssue(validation.error.issues));
        return;
      }
      const localSequence = productSequenceRef.current++;
      const quantity = restock.sizes.reduce(
        (sum, row) => sum + Number(row.quantity || 0),
        0,
      );
      setAddedProducts((current) => [
        ...current,
        {
          id: `qa-local-restock-${localSequence}`,
          reference: `CP-${String(sequenceRef.current).padStart(4, "0")}`,
          name: restock.search.trim(),
          sku: restock.sizes.find((row) => !row.isNew)?.id ?? "NUEVA-VARIANTE",
          invoiceFile: invoice,
          variants: restock.sizes.map((row) => {
            return {
              id: `restock-${localSequence}-${row.size}`,
              size: row.size,
              color: row.color,
              quantity: row.quantity,
              unitCost: row.unitCost,
            };
          }),
          quantity,
          unitCost: Number(restock.sizes[0]?.unitCost ?? 0),
          total: restock.sizes.reduce((sum, row) => {
            return sum + Number(row.quantity || 0) * Number(row.unitCost || 0);
          }, 0),
          inventoryProductId: restock.selectedProductId,
          restockRows: restock.sizes.map((row) => ({ ...row })),
        },
      ]);
      setInvoice(null);
      setInvoiceError("");
      setRestock(createInitialRestockDraft());
      setRestockInteracted(false);
      setRegisterError("");
      return;
    }

    // Número temporal para demostración de TASK 686.
    // Reemplazar por el número devuelto por Backend.
  };

  const handleRegisterPurchase = async () => {
    setSupplierValidationVisible(true);

    if (!supplierId) {
      setRegisterError("Selecciona un proveedor antes de registrar la compra.");
      return;
    }

    if (addedProducts.length === 0) {
      setRegisterError("Añade al menos un producto antes de registrar la compra.");
      return;
    }

    setIsSubmitting(true);
    setRegisterError("");
    try {
      let lastReference = "";
      for (const product of addedProducts) {
        if (!product.invoiceFile) throw new Error("La factura es obligatoria.");
        const invoice = await uploadPurchaseInvoice(product.invoiceFile);
        const response = product.inventoryProductId
          ? await createRestockPurchase({
              supplierId,
              inventoryId: product.inventoryProductId,
              purchaseDate,
              invoiceUrl: invoice.invoiceUrl,
              existingVariants: (product.restockRows ?? []).filter((row) => !row.isNew && Number(row.quantity) > 0).map((row) => ({ inventoryDetailId: row.id, quantity: Number(row.quantity), unitCost: Number(row.unitCost) })),
              newVariants: (product.restockRows ?? []).filter((row) => row.isNew && Number(row.quantity) > 0).map((row) => ({ size: row.size.trim(), color: row.color.toUpperCase(), quantity: Number(row.quantity), unitCost: Number(row.unitCost) })),
            })
          : await createNewProductPurchase({
              supplierId,
              purchaseDate,
              productName: product.name,
              categoryId: Number(product.category),
              brand: product.brand ?? "",
              gender: product.gender ?? null,
              invoiceUrl: invoice.invoiceUrl,
              variants: product.variants.map((variant) => ({ size: variant.size.trim(), color: variant.color.toUpperCase(), quantity: Number(variant.quantity), unitCost: Number(variant.unitCost) })),
            });
        lastReference = response.reference;
      }
      setPurchaseNumber(lastReference);
      setAddedProducts([]);
      setModalOpen(true);
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : "No se pudo registrar la compra.");
    } finally {
      setIsSubmitting(false);
    }
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
    brand: newProduct.brand,
    category: newProduct.category,
    gender: newProduct.gender,
    variants: newProduct.variants,
    existingInvoice: initialData?.existingInvoice ?? null,
    replacementInvoice: invoice,
  });
  const currentEditSnapshot: PurchaseEditSnapshot = {
    date: purchaseDate,
    supplierId,
    productId: initialData?.product.id ?? "",
    productName: newProduct.name,
    brand: newProduct.brand,
    categoryId: newProduct.category,
    gender:
      newProduct.gender === "" || newProduct.gender === "EMPTY"
        ? null
        : newProduct.gender,
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
                     aria-describedby={
                       suppliersError
                         ? "purchase-supplier-error"
                         : undefined
                     }
                     value={supplierId}
                     onChange={(event) => {
                       setSupplierId(event.target.value);
                       setSupplierValidationVisible(true);
                       setRegisterError("");
                     }}
                     disabled={suppliersLoading || Boolean(suppliersError)}
                     className="relative z-0 block h-11 w-full rounded-t-[5px] rounded-b-none border border-[#878A92] bg-white px-3 text-sm outline-none focus:z-10 focus:border-[#1C21D1] focus:ring-1 focus:ring-[#1C21D1]"
                   >
                     <option value="">
                       {suppliersLoading
                         ? "Cargando proveedores..."
                         : suppliers.length === 0
                           ? "No hay proveedores disponibles"
                           : "Selecciona un proveedor"}
                     </option>
                     {supplierId &&
                       !suppliers.some(
                         (supplier) => supplier.id === supplierId,
                       ) && (
                         <option value={supplierId}>
                           Proveedor actual
                         </option>
                       )}
                     {suppliers.map((supplier) => (
                       <option key={supplier.id} value={supplier.id}>
                         {supplier.provider}
                       </option>
                     ))}
                   </select>
                   {suppliersError && (
                     <p
                       id="purchase-supplier-error"
                       role="alert"
                       className="mt-2 text-xs text-red-600"
                     >
                       No se pudieron cargar los proveedores.
                     </p>
                   )}
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
                   aria-invalid={
                     supplierValidationVisible && !supplierId ? true : undefined
                   }
                   aria-describedby={
                     suppliersError || (supplierValidationVisible && !supplierId)
                       ? "purchase-supplier-error"
                       : undefined
                   }
                   value={supplierId}
                   onChange={(event) => {
                     setSupplierId(event.target.value);
                     setSupplierValidationVisible(true);
                     setRegisterError("");
                   }}
                   disabled={suppliersLoading || Boolean(suppliersError)}
                   className={`h-11 w-full max-w-[360px] rounded-[5px] border bg-white px-3 text-sm outline-none focus:ring-1 ${
                     supplierValidationVisible && !supplierId
                       ? "border-red-600 focus:border-red-600 focus:ring-red-600"
                       : "border-[#878A92] focus:border-[#1C21D1] focus:ring-[#1C21D1]"
                   }`}
                 >
                   <option value="">
                     {suppliersLoading
                       ? "Cargando proveedores..."
                       : suppliers.length === 0
                         ? "No hay proveedores disponibles"
                         : "Selecciona un proveedor"}
                   </option>
                   {suppliers.map((supplier) => (
                     <option key={supplier.id} value={supplier.id}>
                       {supplier.provider}
                     </option>
                   ))}
                 </select>
                 <div className="min-h-6 pt-1">
                 {(suppliersError || (supplierValidationVisible && !supplierId)) && (
                   <p
                     id="purchase-supplier-error"
                     role="alert"
                     className="text-xs text-red-600"
                   >
                     {suppliersError
                       ? "No se pudieron cargar los proveedores."
                       : "Selecciona un proveedor."}
                   </p>
                 )}
                 </div>
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
                categories={categories}
                categoriesLoading={categoriesLoading}
                categoriesError={categoriesError}
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

          {isEdit && registerError && (
            <div
              role="alert"
              aria-live="assertive"
              className="mx-5 mt-5 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-7"
            >
              {registerError}
            </div>
          )}

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
                  ? isSubmitting || !editValidation.success || !editChanges.hasChanges
                  : !supplierId || !activeValidation.success
              }
              className="h-11 rounded-[5px] bg-[#1C21D1] px-7 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1] sm:min-w-40"
            >
              {isSubmitting
                ? isEdit
                  ? "Guardando..."
                  : "Añadiendo..."
                : isEdit
                  ? "Guardar cambios"
                  : "Añadir producto"}
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
          onRegister={handleRegisterPurchase}
          registerDisabled={addedProducts.length === 0 || isSubmitting}
          registerError={registerError}
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
          router.push("/compras");
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
