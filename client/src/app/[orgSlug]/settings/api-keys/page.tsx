"use client";

import PageHeader from "@/components/app/PageHeader";
import ApiKeysTable from "@/components/apiKeys/ApiKeysTable";
import CreateApiKeyDialog from "@/components/apiKeys/CreateApiKeyDialog";
import UsageApiExample from "@/components/apiKeys/UsageApiExample";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useListApiKeysQuery } from "@/redux/api/apiKeyApi";

const MAX_ACTIVE_KEYS = 10; // FR-KEY-02, same as the API

// FR-KEY-01…05: owners and admins (apikeys:manage)
export default function ApiKeysPage() {
  const { org, can } = useActiveOrg();
  const allowed = can("apikeys:manage");
  const { data, isLoading, isError, refetch } = useListApiKeysQuery(org?.id ?? "", {
    skip: !org || !allowed,
  });

  if (!org) return null;
  if (!allowed) {
    return (
      <p className="text-sm text-muted-foreground">Only owners and admins can manage API keys.</p>
    );
  }

  const active = data?.filter((k) => !k.revokedAt).length ?? 0;
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="API keys"
        description={
          data
            ? `${active} of ${MAX_ACTIVE_KEYS} active keys · revoked keys are kept for the usage history`
            : "Keys your apps use to report usage"
        }
        actions={<CreateApiKeyDialog limitReached={active >= MAX_ACTIVE_KEYS} />}
      />
      <ApiKeysTable keys={data} isLoading={isLoading} isError={isError} onRetry={refetch} />
      <UsageApiExample />
    </div>
  );
}
