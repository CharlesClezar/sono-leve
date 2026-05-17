import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-[length:200%_100%]",
        "bg-[linear-gradient(90deg,hsl(var(--muted))_35%,hsl(var(--muted-foreground)/0.12)_50%,hsl(var(--muted))_65%)]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
