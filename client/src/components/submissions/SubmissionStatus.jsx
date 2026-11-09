
import {
  CheckCircle2,
  XCircle,
  Clock3,
  LoaderCircle,
  AlertTriangle,
  Ban,
} from "lucide-react";

const statusConfig = {
  Accepted: {
    icon: CheckCircle2,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  },
  "Wrong Answer": {
    icon: XCircle,
    className: "border-red-500/20 bg-red-500/10 text-red-400",
  },
  Pending: {
    icon: Clock3,
    className: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  },
  Running: {
    icon: LoaderCircle,
    className: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  },
  "Compilation Error": {
    icon: AlertTriangle,
    className: "border-orange-500/20 bg-orange-500/10 text-orange-400",
  },
  "Runtime Error": {
    icon: AlertTriangle,
    className: "border-orange-500/20 bg-orange-500/10 text-orange-400",
  },
  "Time Limit Exceeded": {
    icon: Clock3,
    className: "border-red-500/20 bg-red-500/10 text-red-400",
  },
  "Memory Limit Exceeded": {
    icon: AlertTriangle,
    className: "border-red-500/20 bg-red-500/10 text-red-400",
  },
  "Internal Error": {
    icon: Ban,
    className: "border-gray-500/20 bg-gray-500/10 text-gray-400",
  },
};

function SubmissionStatus({ status }) {
  const config = statusConfig[status] || {
    icon: Clock3,
    className: "border-gray-500/20 bg-gray-500/10 text-gray-400",
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.className}`}
    >
      <Icon
        size={13}
        className={status === "Running" ? "animate-spin" : ""}
      />
      {status || "Unknown"}
    </span>
  );
}

export default SubmissionStatus;
