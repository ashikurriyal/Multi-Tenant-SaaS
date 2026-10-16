"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
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
import { formatDate, formatMoney } from "@/lib/format";
import { useListInvoicesQuery } from "@/redux/api/billingApi";

const LIMIT = 10;

// FR-BILL-08
export default function InvoicesTable({ orgId }: { orgId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, isFetching, refetch } = useListInvoicesQuery({
    orgId,
    page,
    limit: LIMIT,
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (isError || !data) return <ErrorState message="Couldn't load invoices." onRetry={refetch} />;
  if (data.data.length === 0) {
    return (
      <EmptyState title="No invoices yet" description="Invoices appear after your first payment." />
    );
  }

  const { meta } = data;
  return (
    <div className="space-y-3">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">
                <span className="sr-only">Invoice</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={isFetching ? "opacity-60" : undefined}>
            {data.data.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="text-sm">
                  {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
                </TableCell>
                <TableCell className="font-medium">
                  {formatMoney(
                    invoice.status === "PAID" ? invoice.amountPaidCents : invoice.amountDueCents,
                    invoice.currency,
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      invoice.status === "PAID"
                        ? "secondary"
                        : invoice.status === "OPEN"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {invoice.status.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {invoice.hostedInvoiceUrl && (
                    <Button asChild variant="ghost" size="sm">
                      <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer">
                        View <ExternalLink />
                      </a>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
