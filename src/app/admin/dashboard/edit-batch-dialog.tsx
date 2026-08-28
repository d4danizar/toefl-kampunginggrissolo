"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateBatch, type BatchWithStats } from "../actions";

const initialState = {
  success: false,
  error: "",
};

export function EditBatchDialog({ batch }: { batch: BatchWithStats }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(updateBatch, initialState);

  // Jika berhasil submit, tutup dialog
  if (state.success && open) {
    setOpen(false);
    state.success = false; // Reset state
  }

  // Format YYYY-MM-DDTHH:mm for local datetime-local input
  const formatForInput = (d: Date) => {
    const date = new Date(d);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm">
          Edit
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Batch Ujian</DialogTitle>
          <DialogDescription>
            Ubah pengaturan batch ujian CBT ini.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={batch.id} />
          
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nama Batch
            </label>
            <Input
              id="name"
              name="name"
              defaultValue={batch.name}
              placeholder="Cth: Tryout Akbar 1"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Deskripsi (Opsional)
            </label>
            <Input
              id="description"
              name="description"
              defaultValue={batch.description || ""}
              placeholder="Cth: Sesi pagi khusus member"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium">
                Mulai
              </label>
              <Input
                id="startDate"
                name="startDate"
                type="datetime-local"
                defaultValue={formatForInput(batch.startDate)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="endDate" className="text-sm font-medium">
                Selesai
              </label>
              <Input
                id="endDate"
                name="endDate"
                type="datetime-local"
                defaultValue={formatForInput(batch.endDate)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="durationMinutes" className="text-sm font-medium">
              Durasi Ujian (Menit)
            </label>
            <Input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min="1"
              defaultValue={batch.durationMinutes || 120}
              required
            />
            <p className="text-xs text-muted-foreground">Ubah jika batch ini membutuhkan waktu lebih singkat/lama.</p>
          </div>

          {state.error && (
            <p className="text-sm font-medium text-red-500">{state.error}</p>
          )}

          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
