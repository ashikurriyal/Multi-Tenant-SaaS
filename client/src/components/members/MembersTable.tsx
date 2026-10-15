"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
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
import { useListMembersQuery } from "@/redux/api/orgApi";
import { MemberRemoveCell, MemberRoleCell } from "./MemberActions";

const LIMIT = 10;
const joined = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export default function MembersTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { me, org } = useActiveOrg();
  // Page lives in the URL (SRS section 17.2), so it survives reloads and can be shared
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const { data, isLoading, isError, isFetching, refetch } = useListMembersQuery(
    { orgId: org?.id ?? "", page, limit: LIMIT },
    { skip: !org },
  );

  const goTo = (next: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(next));
    router.replace(`${pathname}?${params}`, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (isError || !data) {
    return <ErrorState message="Couldn't load members." onRetry={refetch} />;
  }
  if (data.data.length === 0) {
    return <EmptyState title="No members on this page" />;
  }

  const { meta } = data;
  return (
    <div className="space-y-3">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Joined</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-24">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={isFetching ? "opacity-60" : undefined}>
            {data.data.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="font-medium">
                    {member.user.name}
                    {member.user.id === me?.id && (
                      <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{member.user.email}</div>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {joined.format(new Date(member.createdAt))}
                </TableCell>
                <TableCell>
                  <MemberRoleCell member={member} />
                </TableCell>
                <TableCell className="text-right">
                  <MemberRemoveCell member={member} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} members
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goTo(page - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => goTo(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
