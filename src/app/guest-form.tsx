"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { registerGuestUser, createGuestSession } from "./guest-actions";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function GuestForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!name || !phone) {
      setError("Nama dan Nomor WhatsApp wajib diisi.");
      setIsLoading(false);
      return;
    }

    // 1. Register / Get Guest Credentials
    const regRes = await registerGuestUser(name, phone);
    if (!regRes.success || !regRes.email || !regRes.password) {
      setError(regRes.error || "Gagal mendaftar");
      setIsLoading(false);
      return;
    }

    // 2. Login menggunakan NextAuth (silently)
    const signInRes = await signIn("credentials", {
      email: regRes.email,
      password: regRes.password,
      redirect: false,
    });

    if (signInRes?.error) {
      setError("Gagal masuk ke sistem ujian.");
      setIsLoading(false);
      return;
    }

    // 3. Buat Sesi Ujian (ke batch aktif teratas)
    const sessionRes = await createGuestSession(regRes.email);
    if (!sessionRes.success || !sessionRes.sessionId) {
      setError(sessionRes.error || "Gagal membuat sesi.");
      setIsLoading(false);
      return;
    }

    // 4. Redirect ke halaman ujian sebenarnya!
    router.push(`/test/${sessionRes.sessionId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border space-y-4 max-w-sm mx-auto mt-8 text-left">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Cth: Budi_Santoso"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">No. WhatsApp</label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Cth: 08123456789"
        />
      </div>

      <Button type="submit" className="w-full text-lg h-12 mt-4" disabled={isLoading}>
        {isLoading ? "Menyiapkan Ujian..." : "Mulai Ujian Sekarang"}
      </Button>
    </form>
  );
}
