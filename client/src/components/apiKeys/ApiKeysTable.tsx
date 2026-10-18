"use client";

import { toast } from "sonner";
import ConfirmDialog from "@/components/states/ConfirmDialog";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { getApiError } from "@/lib/api-error";
import { formatDate, formatDateTime } from "@/lib/format";
import { useRevokeApiKeyMutation } from "@/redux/api/apiKeyApi";
import type { ApiKey } from "@/types/api";

type Props = {
  keys: ApiKey[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

export default function ApiKeysTable({ keys, isLoading, isError, onRetry }: Props) {
  const { org } = useActiveOrg();
  const [revoke] = useRevokeApiKeyMutation();

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (isError || !keys) return <ErrorState message="Couldn't load API keys." onRetry={onRetry} />;
  if (keys.length === 0) {
    return (
      <EmptyState
        title="No API keys yet"
        description="Create a key so your app can report usage to LedgerFlow."
      />
    );
  }

  const onRevoke = async (key: ApiKey) => {
    if (!org) return;
    try {
      await revoke({ orgId: org.id, keyId: key.id }).unwrap();
      toast.success(`“${key.name}” revoked`);
    } catch (err) {
      toast.error(getApiError(err as Parameters<typeof getApiError>[0])?.message);
    }
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Key</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead className="hidden sm:table-cell">Last used</TableHead>
            <TableHead className="w-24">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((key) => (
            <TableRow key={key.id} className={key.revokedAt ? "text-muted-foreground" : undefined}>
              <TableCell>
                <div className="flex items-center gap-2 font-medium">
                  {key.name}
                  {key.revokedAt && <Badge variant="outline">Revoked</Badge>}
                </div>
              </TableCell>
              <TableCell>
                <code className="font-mono text-xs">{key.prefix}…</code>
              </TableCell>
              <TableCell className="hidden text-sm md:table-cell">
                {formatDate(key.createdAt)}
                <div className="text-xs text-muted-foreground">by {key.createdBy.name}</div>
              </TableCell>
              <TableCell className="hidden text-sm sm:table-cell">
                {key.lastUsedAt ? formatDateTime(key.lastUsedAt) : "Never"}
              </TableCell>
              <TableCell className="text-right">
                {key.revokedAt ? (
                  <span className="text-xs">{formatDate(key.revokedAt)}</span>
                ) : (
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="sm" className="text-destructive">
                        Revoke
                      </Button>
                    }
                    title={`Revoke “${key.name}”?`}
                    description="Apps using this key stop working immediately. This can't be undone; usage already recorded is kept."
                    confirmLabel="Revoke key"
                    onConfirm={() => onRevoke(key)}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
