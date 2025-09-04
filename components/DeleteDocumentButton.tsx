// components/DeleteDocumentButton.tsx
"use client";

import { deleteDocument } from "@/app/documents/delete_document";
import { useTransition, useEffect, useState } from "react";

export function DeleteDocumentButton({ documentId }: { documentId: number }) {
  const [isPending, startTransition] = useTransition();
  const [canDelete, setCanDelete] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      setChecking(true);
      try {
        const res = await fetch("/api/session");
        const data = await res.json();
        setCanDelete(!!data.loggedIn);
      } catch {
        setCanDelete(false);
      } finally {
        setChecking(false);
      }
    }
    checkSession();
  }, []);

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
      className="text-sm bg-red-800 px-2 py-1 rounded-md  ml-auto cursor-pointer text-white disabled:bg-gray-500 disabled:cursor-default"
      disabled={isPending || !canDelete || checking}
      title={!canDelete && !checking ? "Login as admin to delete" : undefined}
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
