"use client";

import { useEffect, useRef, useState } from "react";

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
const STATUS: Record<Resp, [string, string, string]> = {
  ok: ["202 Accepted", "#5FD3B5", "rgba(95,211,181,0.14)"],
  dup: ["202 Accepted · duplicate", "#5FD3B5", "rgba(95,211,181,0.14)"],
  limit: ["429 Too Many Requests", "#F2C66D", "rgba(242,198,109,0.14)"],
  key: ["401 Unauthorized", "#F49AA9", "rgba(244,154,169,0.14)"],
};
const TAB_X: Record<Lang, number> = { curl: 0, node: 76, py: 152 };

export default function Developers() {
  const [lang, setLang] = useState<Lang>("curl");
  const [resp, setResp] = useState<Resp>("ok");
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const copyReq = () => {
    navigator.clipboard?.writeText(REQUEST[lang]).catch(() => {});
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1600);
  };

  const pressed = (on: boolean): "true" | "false" => (on ? "true" : "false");
  const lang_curl = lang === "curl";
  const lang_node = lang === "node";
  const lang_py = lang === "py";
  const t_curl = pressed(lang_curl);
  const t_node = pressed(lang_node);
  const t_py = pressed(lang_py);
  const tc_curl = lang_curl ? "#FFFFFF" : "#8FA19C";
  const tc_node = lang_node ? "#FFFFFF" : "#8FA19C";
  const tc_py = lang_py ? "#FFFFFF" : "#8FA19C";
  const pick_curl = () => setLang("curl");
  const pick_node = () => setLang("node");
  const pick_py = () => setLang("py");
  const resp_ok = resp === "ok";
  const resp_dup = resp === "dup";
  const resp_limit = resp === "limit";
  const resp_key = resp === "key";
  const p_ok = pressed(resp_ok);
  const p_dup = pressed(resp_dup);
  const p_limit = pressed(resp_limit);
  const p_key = pressed(resp_key);
  const pick_ok = () => setResp("ok");
  const pick_dup = () => setResp("dup");
  const pick_limit = () => setResp("limit");
  const pick_key = () => setResp("key");
  const tabX = TAB_X[lang];
  const [stText, stColor, stBg] = STATUS[resp];
  const copyLabel = copied ? "Copied" : "Copy";
  const copyIcon = copied ? "M20 6L9 17l-5-5" : "M9 9h10v10H9zM5 15V5h10";

  return (
    <>
      <section
        id="developers"
        style={{
          background: "#F7F9F8",
          borderTop: "1px solid #E8EDEB",
          borderBottom: "1px solid #E8EDEB",
        }}
      >
        <div
          className="dev-grid"
          style={{ maxWidth: "1200px", margin: "0 auto", padding: "96px 24px" }}
        >
          <div
            className="rv"
            style={{ minWidth: "0", display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <p
              style={{
                margin: "0",
                fontSize: "14px",
                fontWeight: "600",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--lf-accent)",
              }}
            >
              Developers
            </p>
            <h2
              style={{
                margin: "0",
                fontSize: "clamp(28px, 3vw, 40px)",
                lineHeight: "1.12",
                letterSpacing: "-0.025em",
                fontWeight: "650",
              }}
            >
              One request per event. Safe to retry.
            </h2>
            <p style={{ margin: "0", fontSize: "17px", lineHeight: "1.6", color: "#46535A" }}>
              Send the same{" "}
              <code
                style={{
                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                  fontSize: "15px",
                  background: "#FFFFFF",
                  border: "1px solid #E3E8E6",
                  borderRadius: "6px",
                  padding: "1px 6px",
                }}
              >
                idempotencyKey
              </code>{" "}
              twice and you get the original event back. Nothing is counted twice.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: "600",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#5B676E",
                }}
              >
                Responses · pick one to preview
              </span>
              <button
                type="button"
                className="dev-row"
                onClick={pick_ok}
                aria-pressed={p_ok}
                data-on={p_ok}
              >
                <span
                  className="dev-code"
                  style={{
                    color: "#0A6152",
                    background: "color-mix(in srgb, var(--lf-accent) 10%, #FFFFFF)",
                  }}
                >
                  202
                </span>
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    minWidth: "0",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      lineHeight: "1.2",
                      color: "#0B1215",
                    }}
                  >
                    Accepted
                  </span>
                  <span style={{ fontSize: "13.5px", lineHeight: "1.45", color: "#46535A" }}>
                    Recorded, with the period’s units and the plan’s included units
                  </span>
                </span>
                <svg
                  className="dev-chev"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
              <button
                type="button"
                className="dev-row"
                onClick={pick_dup}
                aria-pressed={p_dup}
                data-on={p_dup}
              >
                <span
                  className="dev-code"
                  style={{
                    color: "#0A6152",
                    background: "color-mix(in srgb, var(--lf-accent) 10%, #FFFFFF)",
                  }}
                >
                  202
                </span>
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    minWidth: "0",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      lineHeight: "1.2",
                      color: "#0B1215",
                    }}
                  >
                    Duplicate
                  </span>
                  <span style={{ fontSize: "13.5px", lineHeight: "1.45", color: "#46535A" }}>
                    Same idempotencyKey: the original event comes back, nothing is counted twice
                  </span>
                </span>
                <svg
                  className="dev-chev"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
              <button
                type="button"
                className="dev-row"
                onClick={pick_limit}
                aria-pressed={p_limit}
                data-on={p_limit}
              >
                <span className="dev-code" style={{ color: "#8A3F06", background: "#FEF3C7" }}>
                  429
                </span>
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    minWidth: "0",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      lineHeight: "1.2",
                      color: "#0B1215",
                    }}
                  >
                    Limit reached
                  </span>
                  <span style={{ fontSize: "13.5px", lineHeight: "1.45", color: "#46535A" }}>
                    The Free plan’s monthly limit, or more than 100 requests a second per key
                  </span>
                </span>
                <svg
                  className="dev-chev"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
              <button
                type="button"
                className="dev-row"
                onClick={pick_key}
                aria-pressed={p_key}
                data-on={p_key}
              >
                <span className="dev-code" style={{ color: "#A3243A", background: "#FDECEF" }}>
                  401
                </span>
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    minWidth: "0",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      lineHeight: "1.2",
                      color: "#0B1215",
                    }}
                  >
                    Invalid key
                  </span>
                  <span style={{ fontSize: "13.5px", lineHeight: "1.45", color: "#46535A" }}>
                    Unknown or revoked keys are rejected on the very next request
                  </span>
                </span>
                <svg
                  className="dev-chev"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
              <span className="dev-fact">100 requests / s per key</span>
              <span className="dev-fact">Keys stored as hashes</span>
              <span className="dev-fact">Reported to Stripe’s meter by a job</span>
            </div>
          </div>
          <div className="rv dev-win-wrap" style={{ minWidth: "0" }}>
            <div className="glow" style={{ borderRadius: "16px", padding: "1px" }}>
              <span className="glow-ring" aria-hidden="true">
                <span />
              </span>
              <div
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  background: "#0B1215",
                  border: "1px solid #1C2A2F",
                  boxShadow: "0 30px 70px -30px rgba(11,18,21,0.55)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    padding: "10px 12px 10px 16px",
                    borderBottom: "1px solid #1C2A2F",
                    background: "#0F181B",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: "0" }}
                  >
                    <span style={{ display: "inline-flex", gap: "6px" }} aria-hidden="true">
                      <i className="dev-dot" />
                      <i className="dev-dot" />
                      <i className="dev-dot" />
                    </span>
                    <div className="dev-tabs" role="group" aria-label="Language">
                      <span
                        className="dev-tab-thumb"
                        aria-hidden="true"
                        style={{ transform: `translateX(${tabX}px)` }}
                      />
                      <button
                        type="button"
                        onClick={pick_curl}
                        aria-pressed={t_curl}
                        style={{ color: tc_curl }}
                      >
                        cURL
                      </button>
                      <button
                        type="button"
                        onClick={pick_node}
                        aria-pressed={t_node}
                        style={{ color: tc_node }}
                      >
                        Node.js
                      </button>
                      <button
                        type="button"
                        onClick={pick_py}
                        aria-pressed={t_py}
                        style={{ color: tc_py }}
                      >
                        Python
                      </button>
                    </div>
                  </div>
                  <button type="button" className="dev-copy" onClick={copyReq}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d={copyIcon} />
                    </svg>
                    {copyLabel}
                  </button>
                </div>
                <div style={{ padding: "20px 22px", minHeight: "300px", boxSizing: "border-box" }}>
                  {lang_curl && (
                    <>
                      <pre
                        className="dev-swap"
                        style={{
                          margin: "0",
                          boxSizing: "border-box",
                          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12.5px",
                          lineHeight: "1.75",
                          color: "#D7E2DF",
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        <span style={{ color: "#5FD3B5" }}>{"curl"}</span>
                        {" https://ledgerflow-api-service.vercel.app/api/v1/usage "}
                        <span style={{ color: "#8FA19C" }}>{"\\"}</span>
                        {"\n  "}
                        <span style={{ color: "#8FA19C" }}>{"-H"}</span>{" "}
                        <span style={{ color: "#F2C66D" }}>{'"x-api-key: $LEDGERFLOW_KEY"'}</span>{" "}
                        <span style={{ color: "#8FA19C" }}>{"\\"}</span>
                        {"\n  "}
                        <span style={{ color: "#8FA19C" }}>{"-H"}</span>{" "}
                        <span style={{ color: "#F2C66D" }}>
                          {'"Content-Type: application/json"'}
                        </span>{" "}
                        <span style={{ color: "#8FA19C" }}>{"\\"}</span>
                        {"\n  "}
                        <span style={{ color: "#8FA19C" }}>{"-d"}</span>{" "}
                        <span style={{ color: "#F2C66D" }}>{"'{"}</span>
                        {"\n    "}
                        <span style={{ color: "#9DB8F5" }}>{'"metric"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{'"documents_processed"'}</span>
                        {",\n    "}
                        <span style={{ color: "#9DB8F5" }}>{'"quantity"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{"25"}</span>
                        {",\n    "}
                        <span style={{ color: "#9DB8F5" }}>{'"idempotencyKey"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{'"job-8831-batch-2"'}</span>
                        {"\n  "}
                        <span style={{ color: "#F2C66D" }}>{"}'"}</span>
                      </pre>
                    </>
                  )}
                  {lang_node && (
                    <>
                      <pre
                        className="dev-swap"
                        style={{
                          margin: "0",
                          boxSizing: "border-box",
                          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12.5px",
                          lineHeight: "1.75",
                          color: "#D7E2DF",
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        <span style={{ color: "#5FD3B5" }}>{"const"}</span>
                        {" res = "}
                        <span style={{ color: "#5FD3B5" }}>{"await"}</span>
                        {" fetch(\n  "}
                        <span style={{ color: "#F2C66D" }}>
                          {'"https://ledgerflow-api-service.vercel.app/api/v1/usage"'}
                        </span>
                        {",\n  {\n    method: "}
                        <span style={{ color: "#F2C66D" }}>{'"POST"'}</span>
                        {",\n    headers: {\n      "}
                        <span style={{ color: "#F2C66D" }}>{'"x-api-key"'}</span>
                        {": process.env.LEDGERFLOW_KEY,\n      "}
                        <span style={{ color: "#F2C66D" }}>{'"Content-Type"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{'"application/json"'}</span>
                        {",\n    },\n    body: JSON.stringify({\n      metric: "}
                        <span style={{ color: "#F2C66D" }}>{'"documents_processed"'}</span>
                        {",\n      quantity: "}
                        <span style={{ color: "#F2C66D" }}>{"25"}</span>
                        {",\n      idempotencyKey: "}
                        <span style={{ color: "#F2C66D" }}>{'"job-8831-batch-2"'}</span>
                        {",\n    }),\n  },\n);"}
                      </pre>
                    </>
                  )}
                  {lang_py && (
                    <>
                      <pre
                        className="dev-swap"
                        style={{
                          margin: "0",
                          boxSizing: "border-box",
                          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12.5px",
                          lineHeight: "1.75",
                          color: "#D7E2DF",
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        <span style={{ color: "#5FD3B5" }}>{"import"}</span>
                        {" os, requests\n\nres = requests.post(\n    "}
                        <span style={{ color: "#F2C66D" }}>
                          {'"https://ledgerflow-api-service.vercel.app/api/v1/usage"'}
                        </span>
                        {",\n    headers={"}
                        <span style={{ color: "#F2C66D" }}>{'"x-api-key"'}</span>
                        {": os.environ["}
                        <span style={{ color: "#F2C66D" }}>{'"LEDGERFLOW_KEY"'}</span>
                        {"]},\n    json={\n        "}
                        <span style={{ color: "#F2C66D" }}>{'"metric"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{'"documents_processed"'}</span>
                        {",\n        "}
                        <span style={{ color: "#F2C66D" }}>{'"quantity"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{"25"}</span>
                        {",\n        "}
                        <span style={{ color: "#F2C66D" }}>{'"idempotencyKey"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{'"job-8831-batch-2"'}</span>
                        {",\n    },\n)"}
                      </pre>
                    </>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    padding: "10px 16px",
                    borderTop: "1px solid #1C2A2F",
                    borderBottom: "1px solid #1C2A2F",
                    background: "#0F181B",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                      fontSize: "11.5px",
                      letterSpacing: "0.06em",
                      color: "#8FA19C",
                    }}
                  >
                    RESPONSE
                  </span>
                  <span className="dev-status" style={{ color: stColor, background: stBg }}>
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "999px",
                        background: "currentColor",
                      }}
                    />
                    {stText}
                  </span>
                </div>
                <div
                  style={{
                    padding: "18px 22px 20px",
                    minHeight: "230px",
                    boxSizing: "border-box",
                    background: "#0A1013",
                  }}
                >
                  {resp_ok && (
                    <>
                      <pre
                        className="dev-swap"
                        style={{
                          margin: "0",
                          boxSizing: "border-box",
                          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12.5px",
                          lineHeight: "1.75",
                          color: "#D7E2DF",
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {"{\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"success"'}</span>
                        {": "}
                        <span style={{ color: "#C3B4F4" }}>{"true"}</span>
                        {",\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"statusCode"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{"202"}</span>
                        {",\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"message"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{'"Usage recorded"'}</span>
                        {",\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"data"'}</span>
                        {": {\n    "}
                        <span style={{ color: "#9DB8F5" }}>{'"eventId"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{'"184467"'}</span>
                        {",\n    "}
                        <span style={{ color: "#9DB8F5" }}>{'"duplicate"'}</span>
                        {": "}
                        <span style={{ color: "#C3B4F4" }}>{"false"}</span>
                        {",\n    "}
                        <span style={{ color: "#9DB8F5" }}>{'"periodUnits"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{"742"}</span>
                        {",\n    "}
                        <span style={{ color: "#9DB8F5" }}>{'"includedUnits"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{"1000"}</span>
                        {"\n  }\n}"}
                      </pre>
                    </>
                  )}
                  {resp_dup && (
                    <>
                      <pre
                        className="dev-swap"
                        style={{
                          margin: "0",
                          boxSizing: "border-box",
                          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12.5px",
                          lineHeight: "1.75",
                          color: "#D7E2DF",
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {"{\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"success"'}</span>
                        {": "}
                        <span style={{ color: "#C3B4F4" }}>{"true"}</span>
                        {",\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"statusCode"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{"202"}</span>
                        {",\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"message"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{'"Already recorded"'}</span>
                        {",\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"data"'}</span>
                        {": {\n    "}
                        <span style={{ color: "#9DB8F5" }}>{'"eventId"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{'"184467"'}</span>
                        {",\n    "}
                        <span style={{ color: "#9DB8F5" }}>{'"duplicate"'}</span>
                        {": "}
                        <span style={{ color: "#C3B4F4" }}>{"true"}</span>
                        {",\n    "}
                        <span style={{ color: "#9DB8F5" }}>{'"periodUnits"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{"742"}</span>
                        {",\n    "}
                        <span style={{ color: "#9DB8F5" }}>{'"includedUnits"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{"1000"}</span>
                        {"\n  }\n}"}
                      </pre>
                    </>
                  )}
                  {resp_limit && (
                    <>
                      <pre
                        className="dev-swap"
                        style={{
                          margin: "0",
                          boxSizing: "border-box",
                          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12.5px",
                          lineHeight: "1.75",
                          color: "#D7E2DF",
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {"{\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"success"'}</span>
                        {": "}
                        <span style={{ color: "#C3B4F4" }}>{"false"}</span>
                        {",\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"statusCode"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{"429"}</span>
                        {",\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"message"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>
                          {'"Monthly usage limit of 1,000 units reached. Upgrade to continue."'}
                        </span>
                        {",\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"errorCode"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{'"PLAN_LIMIT_USAGE"'}</span>
                        {",\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"errorDetails"'}</span>
                        {": []\n}"}
                      </pre>
                    </>
                  )}
                  {resp_key && (
                    <>
                      <pre
                        className="dev-swap"
                        style={{
                          margin: "0",
                          boxSizing: "border-box",
                          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                          fontSize: "12.5px",
                          lineHeight: "1.75",
                          color: "#D7E2DF",
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {"{\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"success"'}</span>
                        {": "}
                        <span style={{ color: "#C3B4F4" }}>{"false"}</span>
                        {",\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"statusCode"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{"401"}</span>
                        {",\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"message"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{'"Invalid or revoked API key"'}</span>
                        {",\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"errorCode"'}</span>
                        {": "}
                        <span style={{ color: "#F2C66D" }}>{'"INVALID_API_KEY"'}</span>
                        {",\n  "}
                        <span style={{ color: "#9DB8F5" }}>{'"errorDetails"'}</span>
                        {": []\n}"}
                      </pre>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
