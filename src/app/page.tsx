import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GuestForm } from "./guest-form";

export default async function Home() {
  const session = await auth();

  // Jika user (admin atau siswa normal) sudah login, arahkan ke dashboard
  if (session?.user && session.user.role === "ADMIN") {
    redirect("/admin/dashboard");
  } else if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <main className="max-w-3xl text-center space-y-4 w-full">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
          TOEFL Prediction Test
        </h1>
        <p className="text-md md:text-lg text-slate-600 max-w-2xl mx-auto">
          Silakan masukkan identitas Anda untuk langsung memulai ujian.
        </p>

        {/* Komponen Form Kilat */}
        <GuestForm />

        <div className="pt-8">
          <Link href="/login" className="text-sm text-slate-400 hover:text-blue-600 underline">
            Login sebagai Admin
          </Link>
        </div>
      </main>

      <footer className="absolute bottom-6 text-sm text-slate-400">
        &copy; {new Date().getFullYear()} CBT Platform. All rights reserved.
      </footer>
    </div>
  );
}