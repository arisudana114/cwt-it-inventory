import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Documents",
};

export default function NewDocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
