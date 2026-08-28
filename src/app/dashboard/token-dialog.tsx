"use client";

import { useActionState, useEffect, useState } from "react";
import { validateAndStartTest, type ValidateResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TokenDialogProps {
  batchId: string;
  batchName: string;
}

export function TokenDialog({ batchId, batchName }: TokenDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<
    ValidateResult,
    FormData
  >(validateAndStartTest, { success: false });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="w-full" />}>
        Mulai Ujian
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Masukkan Token</DialogTitle>
          <DialogDescription>
            Masukkan kode token untuk memulai ujian pada batch &quot;
            {batchName}&quot;. Token hanya bisa digunakan satu kali.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="batchId" value={batchId} />

          {/* Error message */}
          {state.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tokenCode">Kode Token *</Label>
            <Input
              id="tokenCode"
              name="tokenCode"
              placeholder="Contoh: TOEFL-A1B2C3"
              required
              disabled={isPending}
              className="font-mono uppercase tracking-wider"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Dapatkan token dari panitia/admin penyelenggara tes.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Memvalidasi..." : "Validasi & Mulai"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
