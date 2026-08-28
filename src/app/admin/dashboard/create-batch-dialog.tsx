"use client";

import { useActionState, useEffect, useState } from "react";
import { createBatch, type ActionResult } from "../actions";
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

export function CreateBatchDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    createBatch,
    { success: false }
  );

  // Tutup dialog saat berhasil
  useEffect(() => {
    if (state.success) {
      setOpen(false);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>+ Buat Batch Baru</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Batch Baru</DialogTitle>
          <DialogDescription>
            Buat gelombang tes baru. Token dapat di-generate setelah batch
            dibuat.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nama Batch *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Contoh: Gelombang 1 - Agustus 2026"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Input
              id="description"
              name="description"
              placeholder="Deskripsi opsional"
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai *</Label>
              <Input
                id="startDate"
                name="startDate"
                type="datetime-local"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Selesai *</Label>
              <Input
                id="endDate"
                name="endDate"
                type="datetime-local"
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationMinutes">Durasi Ujian (Menit) *</Label>
            <Input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min="1"
              defaultValue="120"
              required
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">Waktu akan otomatis menghitung mundur sesuai durasi ini.</p>
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
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
