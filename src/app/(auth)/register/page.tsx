"use client";

import { Suspense } from "react";
import { useActionState } from "react";
import { registerUser, type RegisterState } from "./actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function RegisterForm() {
  const [state, formAction, isPending] = useActionState<
    RegisterState,
    FormData
  >(registerUser, {});

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Daftar Akun</CardTitle>
        <CardDescription>
          Buat akun baru untuk mengikuti tes TOEFL Prediction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* Error message */}
          {state.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {state.error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Masukkan nama lengkap"
              required
              disabled={isPending}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="contoh@email.com"
              required
              disabled={isPending}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">No. Telepon</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              disabled={isPending}
            />
          </div>

          {/* Institution */}
          <div className="space-y-2">
            <Label htmlFor="institution">Institusi</Label>
            <Input
              id="institution"
              name="institution"
              placeholder="Nama universitas/sekolah"
              disabled={isPending}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimal 8 karakter"
              required
              minLength={8}
              disabled={isPending}
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Ulangi password"
              required
              disabled={isPending}
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Mendaftar..." : "Daftar"}
          </Button>

          {/* Link to login */}
          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
