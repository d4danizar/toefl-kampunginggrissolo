import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBatches } from "../actions";
import { BatchTable } from "./batch-table";
import { CreateBatchDialog } from "./create-batch-dialog";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  // Verifikasi session (double-check selain proxy)
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const batches = await getBatches();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Admin Control Panel
            </h1>
            <p className="text-sm text-muted-foreground">
              TOEFL CBT Prediction — Kelola batch dan token tes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {session.user.name}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="outline" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total Batch</p>
            <p className="text-3xl font-bold">{batches.length}</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Batch Aktif</p>
            <p className="text-3xl font-bold text-green-600">
              {batches.filter((b) => b.isActive).length}
            </p>
          </div>

        </div>

        {/* Batch Table Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Daftar Batch</h2>
            <CreateBatchDialog />
          </div>

          <BatchTable batches={batches} />
        </div>
      </main>
    </div>
  );
}
