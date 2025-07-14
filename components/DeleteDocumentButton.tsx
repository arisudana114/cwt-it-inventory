// components/DeleteDocumentButton.tsx
"use client";

import { deleteDocument } from "@/app/documents/delete_document";
import { useTransition } from "react";

export function DeleteDocumentButton({ documentId }: { documentId: number }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this document?"
    );
    if (!confirmed) return;

    startTransition(() => {
      deleteDocument(documentId);
    });
  };

  return (
    <button
      onClick={handleDelete}
      className="text-sm bg-red-800 px-2 py-1 rounded-md  ml-auto cursor-pointer"
      disabled={isPending}
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
