"use client";

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="w-11 h-11 border-4 border-dashed rounded-full animate-spin border-primary"></div>
        <p className="text-xl font-semibold">
          Processing new document, please wait...
        </p>
      </div>
    </div>
  );
}
