"use client";

export function BouncingDots({ label }: { label?: string }) {
  return (
    <div className="self-start flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1">
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
          />
        ))}
      </div>
      {label && <span>{label}</span>}
    </div>
  );
}
