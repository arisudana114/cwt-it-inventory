import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Products",
};

export default function NewDocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
