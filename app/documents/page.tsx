import { redirect } from "next/navigation";
import { DocumentFilters } from "@/components/DocumentFilters";
import { DownloadExcelButton } from "@/components/DownloadExcelButton";
import { Suspense } from "react";
import { DocumentList } from "./list";
import { DocumentListSkeleton } from "./skeletons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";


type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Documents({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const tabParam = Array.isArray(params?.tab)
    ? params.tab[0]
    : params?.tab;
  const tabValue = tabParam === "out" ? "out" : "in";

  const currentPage = params?.page
    ? parseInt(String(params.page), 10)
    : 1;
  if (isNaN(currentPage) || currentPage < 1) {
    redirect("/documents?page=1");
  }

  const buildQueryString = (page: number, tabOverride?: string) => {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === "string") {
        urlParams.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => urlParams.append(key, v));
      }
    });
    urlParams.set("page", String(page));
    urlParams.set("tab", tabOverride || tabValue);
    return `?${urlParams.toString()}`;
  };

  const plainSearchParams = Object.fromEntries(
    Object.entries(params).filter(
      ([_, value]) => typeof value === "string" || Array.isArray(value)
    )
  );

  const suspenseKey = JSON.stringify(plainSearchParams);

  return (
    <Tabs value={tabValue} className="space-y-6">
      <TabsList>
        <TabsTrigger value="in" asChild>
          <a href={buildQueryString(1, "in")}>IN Documents</a>
        </TabsTrigger>
        <TabsTrigger value="out" asChild>
          <a href={buildQueryString(1, "out")}>OUT Documents</a>
        </TabsTrigger>
      </TabsList>
      <div className="flex justify-between items-center mb-4">
        <DocumentFilters defaultValues={plainSearchParams} />
        <DownloadExcelButton
          filters={{ ...plainSearchParams, tab: tabValue }}
        />
      </div>

      <TabsContent value="in">
        <Suspense key={suspenseKey} fallback={<DocumentListSkeleton />}>
          <DocumentList searchParams={Promise.resolve(params)} />
        </Suspense>
      </TabsContent>

      <TabsContent value="out">
        <Suspense key={suspenseKey} fallback={<DocumentListSkeleton />}>
          <DocumentList searchParams={Promise.resolve(params)} />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
