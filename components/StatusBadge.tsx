import type { TransactionStatus } from "@/types";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export function StatusBadge({ status }: { status: TransactionStatus }) {
  if (status === "completed")
    return (
      <span className="badge-status-completed">
        <CheckCircle2 className="w-3 h-3" /> completed
      </span>
    );
  if (status === "pending")
    return (
      <span className="badge-status-pending">
        <Clock className="w-3 h-3" /> pending
      </span>
    );
  return (
    <span className="badge-status-failed">
      <XCircle className="w-3 h-3" /> failed
    </span>
  );
}
