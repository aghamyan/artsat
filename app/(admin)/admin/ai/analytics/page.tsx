import { AnalyticsAssistant } from "@/components/admin/AnalyticsAssistant";

export default function AdminAIAnalyticsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">Admin / AI</p>
        <h1 className="font-display text-3xl tracking-wide">Analytics Assistant</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Ask questions about your business in plain English. Data is read-only and pre-aggregated.
        </p>
      </div>
      <AnalyticsAssistant />
    </div>
  );
}
