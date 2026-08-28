"use client";

import { Suspense } from "react";
import { useActionState } from "react";
import { loginUser, type LoginState } from "./actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

function LoginForm() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginUser,
    {}
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Masuk</CardTitle>
        <CardDescription>
          Masuk ke akun Anda untuk mengikuti tes TOEFL Prediction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* Success message after registration */}
          {justRegistered && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-600 border border-green-200">
              Pendaftaran berhasil! Silakan masuk dengan akun baru Anda.
            </div>
          )}

          {/* Error message */}
          {state.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {state.error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="contoh@email.com"
              required
              disabled={isPending}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Masukkan password"
              required
              disabled={isPending}
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Memproses..." : "Masuk"}
          </Button>

          {/* Link to register */}
          <p className="text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Daftar di sini
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
