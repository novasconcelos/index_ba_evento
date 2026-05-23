import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  color,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { color?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        !color && "bg-gray-100 text-gray-700",
        className,
      )}
      style={
        color
          ? { backgroundColor: `${color}1a`, color }
          : undefined
      }
      {...props}
    >
      {color && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {props.children}
    </span>
  );
}
