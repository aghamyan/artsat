import { format } from "date-fns";
import type { ReturnExchangeWithItems } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-700",
  shipped_back: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
};

interface Props {
  returns: ReturnExchangeWithItems[];
}

export default function ReturnsList({ returns }: Props) {
  if (returns.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium mb-2">No returns or exchanges</p>
        <p className="text-sm">Your return requests will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {returns.map((r) => (
        <div
          key={r.id}
          className="block border border-gray-200 rounded-xl p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium capitalize">
                {r.request_type} — {r.order_item?.product_name ?? "Item"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Order #{r.order?.order_number}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(r.requested_at), "MMM d, yyyy")}
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
              {r.status.replace("_", " ")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
