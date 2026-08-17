import { useState } from "react";
import { FileDown } from "lucide-react";

import { Button } from "@/components/common/Button";
import { downloadTemplate } from "@/services/api";
import { toast } from "@/store/toastStore";

export function TemplateDownloadButton({ variant = "secondary" as const }: { variant?: "secondary" | "primary" }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      await downloadTemplate();
    } catch {
      toast.error("Couldn't download template", "Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant={variant} icon={<FileDown size={15} />} loading={busy} onClick={handleClick}>
      Download Excel Template
    </Button>
  );
}
