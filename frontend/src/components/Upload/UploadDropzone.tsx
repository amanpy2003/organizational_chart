import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet } from "lucide-react";
import clsx from "clsx";

import { Button } from "@/components/common/Button";

interface Props {
  onFileSelected: (file: File) => void;
  busy?: boolean;
}

const ACCEPTED = [".xlsx", ".xls"];

export function UploadDropzone({ onFileSelected, busy }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAccepted = (file: File) => ACCEPTED.some((ext) => file.name.toLowerCase().endsWith(ext));

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!isAccepted(file)) return;
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={clsx(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-8 py-14 text-center transition-colors",
        dragActive ? "border-brand-400 bg-brand-50/60" : "border-ink-200 bg-white",
        busy && "pointer-events-none opacity-60"
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        {busy ? (
          <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
        ) : (
          <UploadCloud size={26} />
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-ink-800">
          {busy ? "Processing your file…" : "Drag & drop your Organization Excel file here"}
        </p>
        <p className="mt-1 text-xs text-ink-500">Supports .xlsx and .xls files</p>
      </div>
      <div className="flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px w-10 bg-ink-200" /> OR <span className="h-px w-10 bg-ink-200" />
      </div>
      <Button
        variant="secondary"
        icon={<FileSpreadsheet size={15} />}
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        Browse File
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
