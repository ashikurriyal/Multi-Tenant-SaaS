"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { REQUEST_VIEW, RESPONSE_VIEW } from "./developerSnippets";
import GlowFrame from "./GlowFrame";
import { reveal } from "./ui";

// The Developers section: response codes on the left pick the response shown in the code
// window; the window has cURL / Node.js / Python tabs and copies a runnable request

type Lang = "curl" | "node" | "py";
type Resp = "ok" | "dup" | "limit" | "key";

const API = "https://ledgerflow-api-service.vercel.app/api/v1/usage";
const BODY = '{"metric":"documents_processed","quantity":25,"idempotencyKey":"job-8831-batch-2"}';
const REQUEST: Record<Lang, string> = {
  curl: `curl ${API} \\\n  -H "x-api-key: $LEDGERFLOW_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${BODY}'`,
  node: `const res = await fetch("${API}", {\n  method: "POST",\n  headers: { "x-api-key": process.env.LEDGERFLOW_KEY, "Content-Type": "application/json" },\n  body: JSON.stringify({ metric: "documents_processed", quantity: 25, idempotencyKey: "job-8831-batch-2" }),\n});`,
  py: `import os, requests\n\nres = requests.post(\n    "${API}",\n    headers={"x-api-key": os.environ["LEDGERFLOW_KEY"]},\n    json={"metric": "documents_processed", "quantity": 25, "idempotencyKey": "job-8831-batch-2"},\n)`,
};

const LANGS: { key: Lang; label: string }[] = [
  { key: "curl", label: "cURL" },
  { key: "node", label: "Node.js" },
  { key: "py", label: "Python" },
];

const RESPONSES: {
  key: Resp;
  code: string;
  codeClass: string;
  title: string;
  text: string;
  status: { label: string; className: string };
}[] = [
  {
    key: "ok",
    code: "202",
    codeClass: "bg-primary/10 text-brand-deep",
    title: "Accepted",
    text: "Recorded, with the period’s units and the plan’s included units",
    status: { label: "202 Accepted", className: "bg-mint/14 text-mint" },
  },
  {
    key: "dup",
    code: "202",
    codeClass: "bg-primary/10 text-brand-deep",
    title: "Duplicate",
    text: "Same idempotencyKey: the original event comes back, nothing is counted twice",
    status: { label: "202 Accepted · duplicate", className: "bg-mint/14 text-mint" },
  },
  {
    key: "limit",
    code: "429",
    codeClass: "bg-[#FEF3C7] text-[#8A3F06]",
    title: "Limit reached",
    text: "The Free plan’s monthly limit, or more than 100 requests a second per key",
    status: { label: "429 Too Many Requests", className: "bg-gold/14 text-gold" },
  },
  {
    key: "key",
    code: "401",
    codeClass: "bg-[#FDECEF] text-[#A3243A]",
    title: "Invalid key",
    text: "Unknown or revoked keys are rejected on the very next request",
    status: { label: "401 Unauthorized", className: "bg-[#F49AA9]/14 text-[#F49AA9]" },
  },
];

const FACTS = [
  "100 requests / s per key",
  "Keys stored as hashes",
  "Reported to Stripe’s meter by a job",
];

const code =
  "font-mono text-[12.5px] leading-[1.75] text-code whitespace-pre-wrap wrap-anywhere motion-safe:animate-swap";

export default function Developers() {
  const [lang, setLang] = useState<Lang>("curl");
  const [resp, setResp] = useState<Resp>("ok");
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const copyRequest = () => {
    navigator.clipboard?.writeText(REQUEST[lang]).catch(() => {});
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1600);
  };
  const status = RESPONSES.find((r) => r.key === resp)!.status;

  return (
    <section id="developers" className="border-y border-divider bg-surface">
      <div className="mx-auto grid max-w-300 grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-14 px-6 py-24 max-[960px]:grid-cols-1 max-[960px]:gap-10">
        <div className={cn(reveal, "flex min-w-0 flex-col gap-4")}>
          <p className="text-[14px] font-semibold tracking-[0.08em] text-primary uppercase">
            Developers
          </p>
          <h2 className="text-[clamp(28px,3vw,40px)] leading-[1.12] font-[650] tracking-tight">
            One request per event. Safe to retry.
          </h2>
          <p className="text-[17px] leading-[1.6] text-body">
            Send the same{" "}
            <code className="rounded-[6px] border border-line bg-white px-1.5 py-px font-mono text-[15px]">
              idempotencyKey
            </code>{" "}
            twice and you get the original event back. Nothing is counted twice.
          </p>
          <div className="mt-1.5 flex flex-col gap-2">
            <span className="text-[12.5px] font-semibold tracking-[0.06em] text-subtle uppercase">
              Responses · pick one to preview
            </span>
            {RESPONSES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setResp(r.key)}
                aria-pressed={resp === r.key}
                data-on={resp === r.key}
                className={cn(
                  "group grid w-full cursor-pointer grid-cols-[52px_minmax(0,1fr)_16px] items-center gap-3.5 rounded-[14px] border border-line bg-white px-3.5 py-3 text-[#9aa8a4]",
                  "transition-[border-color,box-shadow,translate,color] duration-250 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
                  "hover:border-[color-mix(in_srgb,var(--color-primary)_40%,var(--color-line))] hover:shadow-[0_10px_24px_-18px_color-mix(in_srgb,var(--color-primary)_80%,transparent)] motion-safe:hover:translate-x-0.75",
                  "data-[on=true]:border-primary data-[on=true]:text-primary data-[on=true]:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_14%,transparent),0_12px_26px_-18px_color-mix(in_srgb,var(--color-primary)_90%,transparent)]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-7.5 items-center justify-center rounded-[8px] font-mono text-[13.5px] font-semibold",
                    r.codeClass,
                  )}
                >
                  {r.code}
                </span>
                <span className="flex min-w-0 flex-col gap-1 text-left">
                  <span className="text-[15px] leading-[1.2] font-semibold text-ink">
                    {r.title}
                  </span>
                  <span className="text-[13.5px] leading-[1.45] text-body">{r.text}</span>
                </span>
                <svg
                  className="transition-transform duration-250 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-safe:group-hover:translate-x-0.75 motion-safe:group-data-[on=true]:translate-x-0.75"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            ))}
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {FACTS.map((f) => (
              <span
                key={f}
                className="inline-flex h-7.5 items-center gap-1.75 rounded-full border border-line bg-white px-3 text-[13px] text-ink-soft"
              >
                <span aria-hidden className="size-1.5 rounded-full bg-primary" />
                {f}
              </span>
            ))}
          </div>
        </div>

        <div className={cn(reveal, "min-w-0")}>
          <GlowFrame>
            <div className="overflow-hidden rounded-[16px] border border-night-line bg-ink shadow-[0_30px_70px_-30px_rgba(11,18,21,0.55)]">
              <div className="flex items-center justify-between gap-3 border-b border-night-line bg-[#0F181B] py-2.5 pr-3 pl-4">
                <div className="flex min-w-0 items-center gap-3.5">
                  <span aria-hidden className="inline-flex gap-1.5 max-[420px]:hidden">
                    {[0, 1, 2].map((i) => (
                      <i key={i} className="size-2.5 rounded-full bg-[#253338]" />
                    ))}
                  </span>
                  <div
                    role="group"
                    aria-label="Language"
                    className="relative inline-grid grid-cols-[repeat(3,76px)] rounded-[9px] bg-[#152125] p-0.75"
                  >
                    <span
                      aria-hidden
                      style={{
                        transform: `translateX(${LANGS.findIndex((l) => l.key === lang) * 76}px)`,
                      }}
                      className="absolute top-0.75 left-0.75 h-7 w-19 rounded-[7px] bg-[#24343a] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-transform duration-350 ease-[cubic-bezier(0.3,1.25,0.4,1)]"
                    />
                    {LANGS.map((l) => (
                      <button
                        key={l.key}
                        type="button"
                        onClick={() => setLang(l.key)}
                        aria-pressed={lang === l.key}
                        className={cn(
                          "relative z-10 h-7 cursor-pointer rounded-[7px] font-mono text-[12px] transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mint",
                          lang === l.key ? "text-white" : "text-sage",
                        )}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyRequest}
                  aria-label={copied ? "Copied" : "Copy request"}
                  className="inline-flex h-7.5 flex-none cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#24343a] px-2.75 text-[12.5px] text-fog transition-colors duration-200 hover:border-[#2f4248] hover:bg-[#152125] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mint"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d={copied ? "M20 6L9 17l-5-5" : "M9 9h10v10H9zM5 15V5h10"} />
                  </svg>
                  <span className="max-[420px]:hidden">{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="min-h-75 px-5.5 py-5">
                <pre key={lang} className={code}>
                  {REQUEST_VIEW[lang]}
                </pre>
              </div>
              <div className="flex items-center justify-between gap-3 border-y border-night-line bg-[#0F181B] px-4 py-2.5">
                <span className="font-mono text-[11.5px] tracking-[0.06em] text-sage">
                  RESPONSE
                </span>
                <span
                  className={cn(
                    "inline-flex h-6 items-center gap-1.75 rounded-full px-2.5 font-mono text-[11.5px] font-semibold transition-colors duration-250",
                    status.className,
                  )}
                >
                  <span aria-hidden className="size-1.5 rounded-full bg-current" />
                  {status.label}
                </span>
              </div>
              <div className="min-h-57.5 bg-[#0A1013] px-5.5 pt-4.5 pb-5">
                <pre key={resp} className={code}>
                  {RESPONSE_VIEW[resp]}
                </pre>
              </div>
            </div>
          </GlowFrame>
        </div>
      </div>
    </section>
  );
}
