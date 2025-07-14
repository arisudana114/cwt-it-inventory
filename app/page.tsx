import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center -mt-16 px-4">
      <div className="w-full max-w-2xl space-y-8 text-center -mt-24">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold">
          Welcome to CWT IT Inventory
        </h1>

        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/logo-cwt.png" // <-- Replace with the actual logo file
            alt="CWT Logo"
            width={180}
            height={180}
            className="rounded-full"
          />
        </div>

        {/* Action Cards */}
        <div className="space-y-4">
          <Link href="/documents">
            <div className="p-2 rounded-2xl border hover:shadow-lg transition cursor-pointer bg-background hover:bg-yellow-300 hover:text-black">
              <h2 className="text-xl font-semibold">See All Documents</h2>
              <p className="text-muted-foreground text-sm">
                View all incoming and outgoing customs documents.
              </p>
            </div>
          </Link>

          <Link href="/products">
            <div className="p-2 rounded-2xl border hover:shadow-lg transition cursor-pointer bg-background  hover:bg-yellow-300 hover:text-black">
              <h2 className="text-xl font-semibold">See Products Stock</h2>
              <p className="text-muted-foreground text-sm">
                Track stock levels by product code and unit.
              </p>
            </div>
          </Link>

          <Link href="/documents/new">
            <div className="p-2 rounded-2xl border hover:shadow-lg transition cursor-pointer bg-background  hover:bg-yellow-300 hover:text-black">
              <h2 className="text-xl font-semibold">Create New Document</h2>
              <p className="text-muted-foreground text-sm">
                Submit a new IN or OUT document for inventory update.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
