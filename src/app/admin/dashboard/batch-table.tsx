"use client";

import { useTransition } from "react";
import { toggleBatchStatus, type BatchWithStats } from "../actions";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BatchActions } from "./batch-actions";

interface BatchTableProps {
  batches: BatchWithStats[];
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function BatchStatusSwitch({
  batchId,
  isActive,
}: {
  batchId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      await toggleBatchStatus(batchId, checked);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isActive}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
      <span
        className={`text-xs font-medium ${
          isActive ? "text-green-600" : "text-gray-400"
        }`}
      >
        {isPending ? "..." : isActive ? "Aktif" : "Nonaktif"}
      </span>
    </div>
  );
}

export function BatchTable({ batches }: BatchTableProps) {
  if (batches.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Belum ada batch. Klik &quot;Buat Batch Baru&quot; untuk memulai.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Batch</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Kode Akses</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => (
            <TableRow key={batch.id}>
              {/* Nama Batch */}
              <TableCell>
                <div>
                  <p className="font-medium">{batch.name}</p>
                  {batch.description && (
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {batch.description}
                    </p>
                  )}
                </div>
              </TableCell>

              {/* Tanggal */}
              <TableCell>
                <div className="text-sm">
                  <p>{formatDate(batch.startDate)}</p>
                  <p className="text-muted-foreground">
                    s/d {formatDate(batch.endDate)}
                  </p>
                </div>
              </TableCell>

              {/* Status */}
              <TableCell>
                <BatchStatusSwitch
                  batchId={batch.id}
                  isActive={batch.isActive}
                />
              </TableCell>

              {/* Kode Akses (Shared Token) */}
              <TableCell>
                {batch.sharedToken ? (
                  <span className="font-mono font-bold text-lg text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                    {batch.sharedToken}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Belum ada
                  </span>
                )}
              </TableCell>

              {/* Aksi */}
              <TableCell className="text-right">
                <BatchActions batch={batch} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
