// components/DeleteDocumentButton.tsx
"use client";

import { deleteDocument } from "@/app/documents/delete_document";
import { useTransition } from "react";

export function DeleteDocumentButton({ documentId }: { documentId: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        startTransition(() => {
          deleteDocument(documentId);
        });
      }}
      className="text-sm text-red-600 hover:underline ml-auto"
      disabled={isPending}
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
