"use client";

import { useActionState, startTransition } from "react";
import { createDocument, getInSourcesForProduct } from "./actions";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Define the InSource type explicitly based on the return type of getInSourcesForProduct
type InSource = {
  id: number;
  documentId: number;
  productId: number;
  qty: any; // Using 'any' to handle Decimal type
  unit: string;
  packageQty?: any | null; // Using 'any' to handle Decimal type
  packageUnit?: string | null;
  balance: number;
  document: {
    documentNumber: string;
    // Add other fields that might be used
    id: number;
    date: Date;
    direction: string;
  };
  inOutLinks: any[];
};

export default function NewDocumentPage() {
  const router = useRouter();
  const [state, formAction] = useActionState(createDocument, {
    message: "",
    errors: {},
  });

  // Handle redirect if server action returns success with redirectTo
  useEffect(() => {
    if (state?.success && state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);
  const [direction, setDirection] = useState<"IN" | "OUT">("IN");
  const [productItems, setProductItems] = useState<any[]>([
    {
      productName: "",
      productCode: "",
      qty: "",
      unit: "",
      packageQty: "",
      packageUnit: "",
    },
  ]);
  const [availableSources, setAvailableSources] = useState<InSource[]>([]);
  const [sourceQuantities, setSourceQuantities] = useState<
    Record<string, Record<string, { qtyUsed: string; packageQtyUsed: string }>>
  >({});

  const handleAddProduct = () => {
    setProductItems([
      ...productItems,
      {
        productName: "",
        productCode: "",
        qty: "",
        unit: "",
        packageQty: "",
        packageUnit: "",
      },
    ]);
  };

  const handleRemoveProduct = (index: number) => {
    setProductItems(productItems.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, field: string, value: any) => {
    const newItems = [...productItems];
    newItems[index][field] = value;
    setProductItems(newItems);

    if (direction === "OUT" && field === "productCode") {
      getInSourcesForProduct(value).then(setAvailableSources);
    }
  };

  const handleSourceQuantityChange = (
    productIndex: number,
    sourceId: number,
    field: "qtyUsed" | "packageQtyUsed",
    value: string
  ) => {
    setSourceQuantities((prev) => {
      const productKey = `${productIndex}`;
      const currentSource = prev[productKey]?.[sourceId] || {
        qtyUsed: "",
        packageQtyUsed: "",
      };

      return {
        ...prev,
        [productKey]: {
          ...(prev[productKey] || {}),
          [sourceId]: {
            ...currentSource,
            [field]: value,
          },
        },
      };
    });
  };

  // Basic client-side validation
  const validateForm = () => {
    const errors: Record<string, string[]> = {};

    // Validate document fields
    const documentNumber = document.getElementById(
      "documentNumber"
    ) as HTMLInputElement;
    const date = document.getElementById("date") as HTMLInputElement;

    if (!documentNumber?.value)
      errors.documentNumber = ["Document number is required"];
    if (!date?.value) errors.date = ["Date is required"];

    // Validate product items
    productItems.forEach((item, index) => {
      if (!item.productName) {
        errors[`productItems.${index}.productName`] = [
          "Product name is required",
        ];
      }
      if (!item.productCode) {
        errors[`productItems.${index}.productCode`] = [
          "Product code is required",
        ];
      }
      if (!item.qty) {
        errors[`productItems.${index}.qty`] = ["Quantity is required"];
      }
      if (!item.unit) {
        errors[`productItems.${index}.unit`] = ["Unit is required"];
      }

      // For OUT documents, validate sources
      if (direction === "OUT") {
        // Check if sources are selected and quantities are valid
        const productSources = sourceQuantities[index] || {};
        const totalQtyUsed = Object.values(productSources).reduce(
          (sum, source) => sum + (Number(source.qtyUsed) || 0),
          0
        );

        const totalPackageQtyUsed = Object.values(productSources).reduce(
          (sum, source) => sum + (Number(source.packageQtyUsed) || 0),
          0
        );

        if (totalQtyUsed === 0) {
          errors[`productItems.${index}.sources`] = [
            "At least one source must be selected",
          ];
        }

        if (totalQtyUsed !== Number(item.qty)) {
          errors[`productItems.${index}.sources`] = [
            `Total quantity from sources (${totalQtyUsed}) does not match the product quantity (${item.qty})`,
          ];
        }

        // Only validate package quantity if it's provided
        if (
          item.packageQty &&
          Number(item.packageQty) > 0 &&
          totalPackageQtyUsed !== Number(item.packageQty)
        ) {
          errors[`productItems.${index}.packageSources`] = [
            `Total package quantity from sources (${totalPackageQtyUsed}) does not match the product package quantity (${item.packageQty})`,
          ];
        }
      }
    });

    return errors;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Perform client-side validation
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      // Create a custom object for validation errors
      const validationResult = {
        message: "Validation failed",
        errors,
      };
      // @ts-ignore - We're intentionally passing a non-FormData object
      startTransition(() => {
        formAction(validationResult);
      });
      return;
    }

    // If validation passes, submit the form
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Add source quantities to form data for OUT documents
    if (direction === "OUT") {
      Object.entries(sourceQuantities).forEach(([productIndex, sources]) => {
        Object.entries(sources).forEach(
          ([sourceId, { qtyUsed, packageQtyUsed }]) => {
            formData.append(
              `productItems.${productIndex}.sources.${sourceId}.qtyUsed`,
              qtyUsed
            );

            // Only add packageQtyUsed if it has a value
            if (packageQtyUsed) {
              formData.append(
                `productItems.${productIndex}.sources.${sourceId}.packageQtyUsed`,
                packageQtyUsed
              );
            }
          }
        );
      });
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Document</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Document Fields */}
          <div>
            <label
              htmlFor="documentNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Document Number
            </label>
            <input
              type="text"
              name="documentNumber"
              id="documentNumber"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="registrationNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Registration Number
            </label>
            <input
              type="text"
              name="registrationNumber"
              id="registrationNumber"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700"
            >
              Date
            </label>
            <input
              type="date"
              name="date"
              id="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="direction"
              className="block text-sm font-medium text-gray-700"
            >
              Direction
            </label>
            <select
              name="direction"
              id="direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value as "IN" | "OUT")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="ddocumentCategory"
              className="block text-sm font-medium text-gray-700"
            >
              Document Category
            </label>
            <select
              name="ddocumentCategory"
              id="ddocumentCategory"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="BC_1_6">BC 1.6</option>
              <option value="BC_2_7">BC 2.7</option>
              <option value="BC_3_3">BC 3.3</option>
              <option value="BC_4_0">BC 4.0</option>
              <option value="P3BET">P3BET</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-gray-700"
            >
              Company Name
            </label>
            <input
              type="text"
              name="companyName"
              id="companyName"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700"
            >
              Price
            </label>
            <input
              type="number"
              name="price"
              id="price"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Product Items */}
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Products</h2>
          {productItems.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4 p-4 border rounded-md"
            >
              <div className="col-span-2">
                <label
                  htmlFor={`productItems.${index}.productName`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Product Name
                </label>
                <input
                  type="text"
                  name={`productItems.${index}.productName`}
                  id={`productItems.${index}.productName`}
                  value={item.productName || ""}
                  onChange={(e) =>
                    handleProductChange(index, "productName", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor={`productItems.${index}.productCode`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Product Code
                </label>
                <input
                  type="text"
                  name={`productItems.${index}.productCode`}
                  id={`productItems.${index}.productCode`}
                  value={item.productCode || ""}
                  onChange={(e) =>
                    handleProductChange(index, "productCode", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor={`productItems.${index}.qty`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Quantity
                </label>
                <input
                  type="number"
                  name={`productItems.${index}.qty`}
                  id={`productItems.${index}.qty`}
                  value={item.qty || ""}
                  onChange={(e) =>
                    handleProductChange(index, "qty", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor={`productItems.${index}.unit`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Unit
                </label>
                <input
                  type="text"
                  name={`productItems.${index}.unit`}
                  id={`productItems.${index}.unit`}
                  value={item.unit || ""}
                  onChange={(e) =>
                    handleProductChange(index, "unit", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor={`productItems.${index}.packageQty`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Package Qty
                </label>
                <input
                  type="number"
                  name={`productItems.${index}.packageQty`}
                  id={`productItems.${index}.packageQty`}
                  value={item.packageQty || ""}
                  onChange={(e) =>
                    handleProductChange(index, "packageQty", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor={`productItems.${index}.packageUnit`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Package Unit
                </label>
                <input
                  type="text"
                  name={`productItems.${index}.packageUnit`}
                  id={`productItems.${index}.packageUnit`}
                  value={item.packageUnit || ""}
                  onChange={(e) =>
                    handleProductChange(index, "packageUnit", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="col-span-6">
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(index)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>

              {direction === "OUT" && (
                <div className="col-span-6 mt-2">
                  <h4 className="font-semibold">Select IN Sources:</h4>
                  {availableSources.length > 0 ? (
                    availableSources.map((source) => (
                      <div
                        key={source.id}
                        className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 p-2 border rounded-md"
                      >
                        <div>
                          <span className="block font-medium">
                            {source.document.documentNumber} (Date:{" "}
                            {new Date(
                              source.document.date
                            ).toLocaleDateString()}
                            )
                          </span>
                          <span className="text-sm">
                            Balance: {source.balance} {source.unit}
                            {source.packageQty && source.packageUnit
                              ? ` / ${source.packageQty} ${source.packageUnit}`
                              : ""}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Quantity to use ({source.unit})
                          </label>
                          <input
                            type="number"
                            name={`productItems.${index}.sources.${source.id}.qtyUsed`}
                            placeholder={`Qty in ${source.unit}`}
                            value={
                              sourceQuantities[index]?.[source.id]?.qtyUsed ||
                              ""
                            }
                            onChange={(e) =>
                              handleSourceQuantityChange(
                                index,
                                source.id,
                                "qtyUsed",
                                e.target.value
                              )
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        {source.packageQty && source.packageUnit && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Package Qty to use ({source.packageUnit})
                            </label>
                            <input
                              type="number"
                              name={`productItems.${index}.sources.${source.id}.packageQtyUsed`}
                              placeholder={`Pkg Qty in ${source.packageUnit}`}
                              value={
                                sourceQuantities[index]?.[source.id]
                                  ?.packageQtyUsed || ""
                              }
                              onChange={(e) =>
                                handleSourceQuantityChange(
                                  index,
                                  source.id,
                                  "packageQtyUsed",
                                  e.target.value
                                )
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>No available sources for this product.</p>
                  )}
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddProduct}
            className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Product
          </button>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Create Document
          </button>
        </div>

        {state?.message && <p className="mt-4 text-red-500">{state.message}</p>}

        {/* Display field-specific errors */}
        {state?.errors &&
          Object.entries(state.errors).map(([field, errorMessages]) => (
            <p key={field} className="mt-2 text-red-500">
              {field}:{" "}
              {Array.isArray(errorMessages)
                ? errorMessages.join(", ")
                : String(errorMessages)}
            </p>
          ))}
      </form>
    </div>
  );
}
