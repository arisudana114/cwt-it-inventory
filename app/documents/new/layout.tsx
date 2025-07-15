import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create New Document",
};

export default function NewDocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
