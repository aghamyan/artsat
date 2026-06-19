import type { OrderStatus } from "@/lib/types";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Order Placed" },
  { status: "confirmed", label: "Confirmed" },
  { status: "preparing", label: "Preparing" },
  { status: "out_for_delivery", label: "Out for Delivery" },
  { status: "delivered", label: "Delivered" },
];

function getStepIndex(status: OrderStatus): number {
  const idx = STEPS.findIndex((s) => s.status === status);
  return idx >= 0 ? idx : 0;
}

interface Props {
  status: OrderStatus;
}

export default function OrderTimeline({ status }: Props) {
  const isCancelled = status === "cancelled" || status === "returned" || status === "refunded";
  const currentIndex = isCancelled ? -1 : getStepIndex(status);

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 py-4">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="text-sm font-medium text-red-600 capitalize">{status}</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-start gap-0">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step.status} className="flex-1 flex flex-col items-center relative">
            {i < STEPS.length - 1 && (
              <div
                className={`absolute top-3 left-1/2 right-0 h-0.5 ${done ? "bg-black" : "bg-gray-200"}`}
                style={{ width: "calc(100% - 12px)", left: "calc(50% + 6px)" }}
              />
            )}
            <div
              className={`w-6 h-6 rounded-full border-2 z-10 flex items-center justify-center text-xs ${
                done
                  ? "bg-black border-black text-white"
                  : active
                  ? "bg-white border-black text-black"
                  : "bg-white border-gray-300 text-gray-300"
              }`}
            >
              {done ? "✓" : i + 1}
            </div>
            <p
              className={`mt-2 text-xs text-center ${
                active ? "font-semibold text-black" : done ? "text-gray-600" : "text-gray-400"
              }`}
            >
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
