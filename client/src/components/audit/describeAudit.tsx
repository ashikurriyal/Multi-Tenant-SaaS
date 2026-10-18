import {
  ArrowRightLeft,
  Building2,
  CreditCard,
  Gauge,
  KeyRound,
  type LucideIcon,
  RefreshCw,
  ScrollText,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AuditEntry } from "@/types/api";

const ROLE: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  BILLING: "Billing",
  MEMBER: "Member",
};
const PLAN: Record<string, string> = { FREE: "Free", PRO: "Pro", BUSINESS: "Business" };
const STATUS: Record<string, string> = {
  INCOMPLETE: "Incomplete",
  TRIALING: "Trial",
  ACTIVE: "Active",
  PAST_DUE: "Past due",
  UNPAID: "Unpaid",
  CANCELED: "Canceled",
};
const FIELD: Record<string, string> = {
  stripeSubscriptionId: "subscription",
  planId: "plan",
  status: "status",
  cancelAtPeriodEnd: "cancellation",
  currentPeriodEnd: "renewal date",
  trialEndsAt: "trial end",
};

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const role = (v: unknown) => ROLE[str(v)] ?? str(v);
const plan = (v: unknown) => PLAN[str(v)] ?? str(v);
const status = (v: unknown) => STATUS[str(v)] ?? str(v);
const num = new Intl.NumberFormat("en-US");

const B = ({ children }: { children: ReactNode }) => (
  <span className="font-medium text-foreground">{children}</span>
);

export type AuditDescription = { icon: LucideIcon; sentence: ReactNode };

/**
 * One sentence per audit action (FR-AUD-01), from the entry's before/after JSON.
 * `actor` is null when Stripe or a scheduled job made the change.
 */
export function describeAudit(entry: AuditEntry, meId?: string): AuditDescription {
  const { action, before, after, actor, subject } = entry;
  const b = before ?? {};
  const a = after ?? {};
  const who = actor ? <B>{actor.id === meId ? "You" : actor.name}</B> : null;
  // The member an entry is about, as sentence subject, object or possessive
  const isMe = subject?.id === meId;
  const memberStart = <B>{isMe ? "You" : (subject?.name ?? "A member")}</B>;
  const member = <B>{isMe ? "you" : (subject?.name ?? "a member")}</B>;
  const members = <B>{isMe ? "your" : `${subject?.name ?? "a member"}'s`}</B>;

  switch (action) {
    case "member.invited":
      return {
        icon: UserPlus,
        sentence: (
          <>
            {who} invited <B>{str(a.email)}</B> as {role(a.role)}
          </>
        ),
      };
    case "invitation.revoked":
      return {
        icon: UserMinus,
        sentence: (
          <>
            {who} revoked the invitation for <B>{str(b.email)}</B>
          </>
        ),
      };
    case "member.joined":
      return {
        icon: UserPlus,
        sentence: (
          <>
            {memberStart} joined as {role(a.role)}
          </>
        ),
      };
    case "member.role_changed":
      return {
        icon: Users,
        sentence: (
          <>
            {who} changed {members} role from {role(b.role)} to <B>{role(a.role)}</B>
          </>
        ),
      };
    case "member.removed":
      return {
        icon: UserMinus,
        sentence: (
          <>
            {who} removed {member} ({role(b.role)})
          </>
        ),
      };
    case "member.left":
      return {
        icon: UserMinus,
        sentence: (
          <>
            {memberStart} left the organization ({role(b.role)})
          </>
        ),
      };
    case "apikey.created":
      return {
        icon: KeyRound,
        sentence: (
          <>
            {who} created API key <B>{str(a.name)}</B>{" "}
            <code className="text-xs">{str(a.prefix)}…</code>
          </>
        ),
      };
    case "apikey.revoked":
      return {
        icon: KeyRound,
        sentence: (
          <>
            {who} revoked API key <B>{str(b.name)}</B>{" "}
            <code className="text-xs">{str(b.prefix)}…</code>
          </>
        ),
      };
    case "organization.renamed":
      return {
        icon: Building2,
        sentence: (
          <>
            {who} renamed the organization to <B>{str(a.name)}</B>
          </>
        ),
      };
    case "checkout.started":
      return {
        icon: CreditCard,
        sentence: (
          <>
            {who} started checkout for the <B>{plan(a.planCode)}</B> plan
          </>
        ),
      };
    case "plan.change_requested":
      return {
        icon: ArrowRightLeft,
        sentence: (
          <>
            {who} requested a plan change from {plan(b.planCode)} to <B>{plan(a.planCode)}</B>
          </>
        ),
      };
    case "plan.changed":
      return {
        icon: ArrowRightLeft,
        sentence: (
          <>
            Plan changed from {plan(b.planCode)} to <B>{plan(a.planCode)}</B>
            {!actor && " (confirmed by Stripe)"}
          </>
        ),
      };
    case "subscription.status_changed": {
      const statusChanged = b.status !== undefined && b.status !== a.status;
      const cancelChanged = b.cancelAtPeriodEnd !== a.cancelAtPeriodEnd && b.status !== undefined;
      const parts: ReactNode[] = [];
      if (statusChanged || b.status === undefined) {
        parts.push(
          <span key="s">
            Subscription {b.status !== undefined ? `${status(b.status)} → ` : "started: "}
            <B>{status(a.status)}</B>
          </span>,
        );
      }
      if (cancelChanged) {
        parts.push(
          <span key="c">
            {parts.length ? "; " : "Subscription "}
            {a.cancelAtPeriodEnd ? "set to cancel at the end of the period" : "cancellation undone"}
          </span>,
        );
      }
      return { icon: CreditCard, sentence: parts.length ? parts : <>Subscription updated</> };
    }
    case "reconciliation.corrected": {
      const fields = Object.keys(a).map((k) => FIELD[k] ?? k);
      return {
        icon: RefreshCw,
        sentence: (
          <>
            Nightly check corrected the <B>{fields.join(", ")}</B> to match Stripe
          </>
        ),
      };
    }
    case "usage.counter_corrected":
      return {
        icon: Gauge,
        sentence: (
          <>
            Usage counter corrected from {num.format(Number(b.units))} to{" "}
            <B>{num.format(Number(a.units))}</B> units
          </>
        ),
      };
    default:
      return {
        icon: ScrollText,
        sentence: (
          <>
            {who && <>{who} · </>}
            <code className="text-xs">{action}</code>
          </>
        ),
      };
  }
}

// Who made the change, for the line under the sentence
export const actorLabel = (entry: AuditEntry) => {
  if (entry.actor) return entry.actor.email;
  if (entry.action.startsWith("reconciliation.") || entry.action.startsWith("usage.")) {
    return "LedgerFlow (scheduled job)";
  }
  return "Stripe";
};
