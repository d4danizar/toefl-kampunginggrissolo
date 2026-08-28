import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveBatches, getTestHistory } from "./actions";
import { TokenDialog } from "./token-dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function UserDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const batches = await getActiveBatches();
  const history = await getTestHistory();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              TOEFL CBT Prediction
            </h1>
            <p className="text-sm text-muted-foreground">
              Selamat datang, {session.user.name}
            </p>
          </div>
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
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Jadwal Ujian Tersedia</h2>
          <p className="text-sm text-muted-foreground">
            Pilih batch ujian lalu masukkan token untuk memulai tes.
          </p>
        </div>

        {/* Empty state */}
        {batches.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Belum Ada Jadwal Ujian
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Belum ada jadwal ujian yang tersedia saat ini. Silakan hubungi
                admin untuk informasi lebih lanjut.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Batch grid */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch) => (
              <Card
                key={batch.id}
                className="flex flex-col justify-between transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <CardTitle className="text-base">{batch.name}</CardTitle>
                  {batch.description && (
                    <CardDescription>{batch.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tanggal */}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                        />
                      </svg>
                      <span>{formatDate(batch.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>
                      <span>
                        {formatTime(batch.startDate)} —{" "}
                        {formatTime(batch.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Token dialog trigger */}
                  <TokenDialog batchId={batch.id} batchName={batch.name} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ======================================================== */}
        {/* Riwayat Ujian */}
        {/* ======================================================== */}
        <div className="mt-12 mb-6">
          <h2 className="text-lg font-semibold">Riwayat Ujian</h2>
          <p className="text-sm text-muted-foreground">
            Daftar ujian yang telah Anda selesaikan beserta skor akhirnya.
          </p>
        </div>

        {history.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Belum ada riwayat ujian yang diselesaikan.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {history.map((item) => (
              <Card key={item.id} className="flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base leading-tight">
                    {item.batchName}
                  </CardTitle>
                  <CardDescription>
                    {item.endTime ? formatDate(item.endTime) : "Selesai"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-1">
                      Skor Akhir
                    </p>
                    <p className="text-4xl font-bold text-gray-900">
                      {item.score ?? "-"}
                    </p>
                  </div>
                  <Link href={`/result/${item.id}`} className="w-full block">
                    <Button variant="outline" className="w-full">
                      Lihat Sertifikat
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
