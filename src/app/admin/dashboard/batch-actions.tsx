"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { regenerateBatchToken, deleteBatch, type BatchWithStats } from "../actions";
import { EditBatchDialog } from "./edit-batch-dialog";

export function BatchActions({ batch }: { batch: BatchWithStats }) {
  const [isPending, startTransition] = useTransition();

  const handleRegenerate = () => {
    if (!confirm("Yakin ingin mengganti kode akses? Peserta yang belum masuk akan gagal menggunakan kode lama.")) return;
    startTransition(async () => {
      await regenerateBatchToken(batch.id);
    });
  };

  const handleDelete = () => {
    if (!confirm(`Yakin ingin MENGHAPUS batch "${batch.name}" secara permanen? Semua sesi tes dan jawaban di dalam batch ini akan ikut terhapus!`)) return;
    startTransition(async () => {
      await deleteBatch(batch.id);
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Tombol Regenerate Token */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRegenerate} 
        disabled={isPending}
        className="text-blue-600 border-blue-200 hover:bg-blue-50"
      >
        Ganti Kode
      </Button>

      {/* Tombol Edit Batch */}
      <EditBatchDialog batch={batch} />

      {/* Tombol Hapus */}
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleDelete} 
        disabled={isPending}
      >
        Hapus
      </Button>
    </div>
  );
}
