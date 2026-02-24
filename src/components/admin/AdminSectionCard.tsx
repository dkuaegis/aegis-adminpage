import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminSectionCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}

export function AdminSectionCard({
  title,
  description,
  actions,
  className,
  contentClassName,
  children,
}: AdminSectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader
        className={cn(
          actions &&
            "flex flex-row flex-wrap items-center justify-between gap-3"
        )}
      >
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
