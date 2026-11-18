"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MessageTemplate } from "@/lib/types";

interface MessageTemplatesWarningProps {
  requiredIds: readonly string[];
  templates: Pick<MessageTemplate, "id">[] | null | undefined;
  isLoading: boolean;
}

export function MessageTemplatesWarning({
  requiredIds,
  templates,
  isLoading,
}: MessageTemplatesWarningProps) {
  if (isLoading) return null;

  const savedIds = new Set((templates ?? []).map(template => template.id));
  const missingIds = requiredIds.filter(id => !savedIds.has(id));

  if (missingIds.length === 0) return null;

  return (
    <Alert className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Modelos necessários ainda não salvos</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-2">
        <span>
          IDs pendentes:{" "}
          {missingIds.map((id, index) => (
            <span key={id}>
              {index > 0 && ", "}
              <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-900/60">
                {id}
              </code>
            </span>
          ))}
          .
        </span>
        <Button asChild variant="link" className="h-auto p-0 text-amber-900 dark:text-amber-100">
          <Link href="/configuracoes?tab=mensagens">
            Abra Configurações &gt; Mensagens para completar a configuração.
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
