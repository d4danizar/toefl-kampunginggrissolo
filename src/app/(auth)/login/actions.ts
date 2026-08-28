"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export type LoginState = {
  error?: string;
};

export async function loginUser(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email atau password salah." };
        default:
          return { error: "Terjadi kesalahan. Silakan coba lagi." };
      }
    }
    // Re-throw non-auth errors (termasuk NEXT_REDIRECT)
    throw error;
  }

  redirect("/dashboard");
}
