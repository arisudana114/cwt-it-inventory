"use client";

import { useActionState, startTransition } from "react";
import { createDocument, getInSourcesForProduct, InSource } from "./actions";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon, Trash2 } from "lucide-react";



type FormState = {
  message: string;
  errors: Partial<Record<string, string[]>>;
  success?: boolean;
  redirectTo?: string;
};

export default function NewDocumentPage() {
  const router = useRouter();
  const [state, formAction] = useActionState<FormState, FormData | FormState>(createDocument, {
    message: "",
    errors: {},
  } as FormState);

  // Handle redirect if server action returns success with redirectTo
  useEffect(() => {
    if (state?.success && state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);
  const [direction, setDirection] = useState<"IN" | "OUT">("IN");
  const [category, setCategory] = useState("");
  const [productItems, setProductItems] = useState<{
    productName: string;
    productCode: string;
    qty: string;
    unit: string;
    packageQty: string;
    packageUnit: string;
  }[]>([{
    productName: "",
    productCode: "",
    qty: "",
    unit: "",
    packageQty: "",
    packageUnit: "",
  }]);
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

  const handleProductChange = (index: number, field: string, value: string) => {
    const newItems = [...productItems];
    newItems[index][field as keyof typeof newItems[0]] = value;
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
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Document</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 grid gap-2">
            <Label htmlFor="documentNumber">Document Number</Label>
            <Input id="documentNumber" name="documentNumber" required />
          </div>

          <div className="md:col-span-2 grid gap-2">
            <Label htmlFor="registrationNumber">Registration Number</Label>
            <Input id="registrationNumber" name="registrationNumber" />
          </div>

          <div className="md:col-span-2 grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" required />
          </div>

          {/* Direction (half width) */}
          <div>
            <Label htmlFor="direction" className="mb-2">
              Direction
            </Label>
            <Select
              value={direction}
              onValueChange={(val) => setDirection(val as "IN" | "OUT")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">IN</SelectItem>
                <SelectItem value="OUT">OUT</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="direction" value={direction} />
          </div>

          {/* Category (half width) */}
          <div>
            <Label htmlFor="ddocumentCategory" className="mb-2">
              Document Category
            </Label>
            <Select
              onValueChange={(value) => setCategory(value)}
              value={category}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BC_1_6">BC 1.6</SelectItem>
                <SelectItem value="BC_2_7">BC 2.7</SelectItem>
                <SelectItem value="BC_3_3">BC 3.3</SelectItem>
                <SelectItem value="BC_4_0">BC 4.0</SelectItem>
                <SelectItem value="P3BET">P3BET</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="ddocumentCategory" value={category} />
          </div>

          <div className="md:col-span-2 grid gap-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" name="companyName" />
          </div>

          <div className="md:col-span-2 grid gap-2">
            <Label htmlFor="price">Price</Label>
            <Input id="price" name="price" type="number" />
          </div>
        </div>

        {/* Product Items */}
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Products</h2>
          {productItems.map((item, index) => (
            <div key={index} className="mb-4 p-4 border rounded-md space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor={`productItems.${index}.productName`}
                    className="text-sm font-medium"
                  >
                    Product Name
                  </Label>
                  <Input
                    type="text"
                    name={`productItems.${index}.productName`}
                    id={`productItems.${index}.productName`}
                    value={item.productName || ""}
                    onChange={(e) =>
                      handleProductChange(index, "productName", e.target.value)
                    }
                    required
                  />
                </div>
                <div>
                  <Label
                    htmlFor={`productItems.${index}.productCode`}
                    className="text-sm font-medium"
                  >
                    Product Code
                  </Label>
                  <Input
                    type="text"
                    name={`productItems.${index}.productCode`}
                    id={`productItems.${index}.productCode`}
                    value={item.productCode || ""}
                    onChange={(e) =>
                      handleProductChange(index, "productCode", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label
                    htmlFor={`productItems.${index}.qty`}
                    className="block text-sm font-medium"
                  >
                    Quantity
                  </Label>
                  <Input
                    type="number"
                    name={`productItems.${index}.qty`}
                    id={`productItems.${index}.qty`}
                    value={item.qty || ""}
                    onChange={(e) =>
                      handleProductChange(index, "qty", e.target.value)
                    }
                    required
                  />
                </div>
                <div>
                  <Label
                    htmlFor={`productItems.${index}.unit`}
                    className="block text-sm font-medium"
                  >
                    Unit
                  </Label>
                  <Input
                    type="text"
                    name={`productItems.${index}.unit`}
                    id={`productItems.${index}.unit`}
                    value={item.unit || ""}
                    onChange={(e) =>
                      handleProductChange(index, "unit", e.target.value)
                    }
                    required
                  />
                </div>
                <div>
                  <Label
                    htmlFor={`productItems.${index}.packageQty`}
                    className="block text-sm font-medium"
                  >
                    Package Qty
                  </Label>
                  <Input
                    type="number"
                    name={`productItems.${index}.packageQty`}
                    id={`productItems.${index}.packageQty`}
                    value={item.packageQty || ""}
                    onChange={(e) =>
                      handleProductChange(index, "packageQty", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label
                    htmlFor={`productItems.${index}.packageUnit`}
                    className="block text-sm font-medium"
                  >
                    Package Unit
                  </Label>
                  <Input
                    type="text"
                    name={`productItems.${index}.packageUnit`}
                    id={`productItems.${index}.packageUnit`}
                    value={item.packageUnit || ""}
                    onChange={(e) =>
                      handleProductChange(index, "packageUnit", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="flex justify-start gap-4">
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="cursor-pointer"
                >
                  <PlusCircleIcon />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(index)}
                  className="text-red-500 hover:text-red-700 cursor-pointer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {direction === "OUT" && (
                <div className="col-span-6 mt-2">
                  <h4 className="font-semibold">Select IN Sources:</h4>
                  {availableSources.length > 0 ? (
                    availableSources.map((source) => {
                      console.log(source.packageBalance);
                      return (
                        <div
                          key={source.id}
                          className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 p-2 border rounded-md"
                        >
                          <div>
                            <div>
                              <span className="text-sm">
                                {source.document.documentNumber} /{" "}
                                {source.document.registrationNumber} (Date:{" "}
                                {source.document.date
                                  .toISOString()
                                  .slice(0, 10)}
                                )
                              </span>
                            </div>

                            <span className="text-sm">
                              Balance: {source.balance} {source.unit}
                              {source.packageBalance !== undefined &&
                              source.packageUnit
                                ? ` / ${source.packageBalance} ${source.packageUnit}`
                                : ""}
                            </span>
                          </div>
                          <div>
                            <Label className="block text-sm font-medium">
                              Quantity to use ({source.unit})
                            </Label>
                            <Input
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
                            />
                          </div>
                          {source.packageQty && source.packageUnit && (
                            <div>
                              <Label className="block text-sm font-medium">
                                Package Qty to use ({source.packageUnit})
                              </Label>
                              <Input
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
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p>No available sources for this product.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={handleAddProduct}
        >
          <button type="button" className="cursor-pointer">
            <PlusCircleIcon />
          </button>
          <span className="text-xs">Add Product</span>
        </div>

        <div className="mt-6">
          <Button type="submit" className="cursor-pointer">
            Create Document
          </Button>
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
