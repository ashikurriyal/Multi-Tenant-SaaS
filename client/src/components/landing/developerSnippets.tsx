// Syntax-highlighted samples for the Developers section's code window (display only;
// the Copy button copies the plain versions in Developers.tsx)

export const REQUEST_VIEW = {
  curl: (
    <>
      <span className="text-mint">{"curl"}</span>
      {" https://ledgerflow-api-service.vercel.app/api/v1/usage "}
      <span className="text-sage">{"\\"}</span>
      {"\n  "}
      <span className="text-sage">{"-H"}</span>{" "}
      <span className="text-gold">{'"x-api-key: $LEDGERFLOW_KEY"'}</span>{" "}
      <span className="text-sage">{"\\"}</span>
      {"\n  "}
      <span className="text-sage">{"-H"}</span>{" "}
      <span className="text-gold">{'"Content-Type: application/json"'}</span>{" "}
      <span className="text-sage">{"\\"}</span>
      {"\n  "}
      <span className="text-sage">{"-d"}</span> <span className="text-gold">{"'{"}</span>
      {"\n    "}
      <span className="text-sky">{'"metric"'}</span>
      {": "}
      <span className="text-gold">{'"documents_processed"'}</span>
      {",\n    "}
      <span className="text-sky">{'"quantity"'}</span>
      {": "}
      <span className="text-gold">{"25"}</span>
      {",\n    "}
      <span className="text-sky">{'"idempotencyKey"'}</span>
      {": "}
      <span className="text-gold">{'"job-8831-batch-2"'}</span>
      {"\n  "}
      <span className="text-gold">{"}'"}</span>
    </>
  ),
  node: (
    <>
      <span className="text-mint">{"const"}</span>
      {" res = "}
      <span className="text-mint">{"await"}</span>
      {" fetch(\n  "}
      <span className="text-gold">
        {'"https://ledgerflow-api-service.vercel.app/api/v1/usage"'}
      </span>
      {",\n  {\n    method: "}
      <span className="text-gold">{'"POST"'}</span>
      {",\n    headers: {\n      "}
      <span className="text-gold">{'"x-api-key"'}</span>
      {": process.env.LEDGERFLOW_KEY,\n      "}
      <span className="text-gold">{'"Content-Type"'}</span>
      {": "}
      <span className="text-gold">{'"application/json"'}</span>
      {",\n    },\n    body: JSON.stringify({\n      metric: "}
      <span className="text-gold">{'"documents_processed"'}</span>
      {",\n      quantity: "}
      <span className="text-gold">{"25"}</span>
      {",\n      idempotencyKey: "}
      <span className="text-gold">{'"job-8831-batch-2"'}</span>
      {",\n    }),\n  },\n);"}
    </>
  ),
  py: (
    <>
      <span className="text-mint">{"import"}</span>
      {" os, requests\n\nres = requests.post(\n    "}
      <span className="text-gold">
        {'"https://ledgerflow-api-service.vercel.app/api/v1/usage"'}
      </span>
      {",\n    headers={"}
      <span className="text-gold">{'"x-api-key"'}</span>
      {": os.environ["}
      <span className="text-gold">{'"LEDGERFLOW_KEY"'}</span>
      {"]},\n    json={\n        "}
      <span className="text-gold">{'"metric"'}</span>
      {": "}
      <span className="text-gold">{'"documents_processed"'}</span>
      {",\n        "}
      <span className="text-gold">{'"quantity"'}</span>
      {": "}
      <span className="text-gold">{"25"}</span>
      {",\n        "}
      <span className="text-gold">{'"idempotencyKey"'}</span>
      {": "}
      <span className="text-gold">{'"job-8831-batch-2"'}</span>
      {",\n    },\n)"}
    </>
  ),
};

export const RESPONSE_VIEW = {
  ok: (
    <>
      {"{\n  "}
      <span className="text-sky">{'"success"'}</span>
      {": "}
      <span className="text-[#C3B4F4]">{"true"}</span>
      {",\n  "}
      <span className="text-sky">{'"statusCode"'}</span>
      {": "}
      <span className="text-gold">{"202"}</span>
      {",\n  "}
      <span className="text-sky">{'"message"'}</span>
      {": "}
      <span className="text-gold">{'"Usage recorded"'}</span>
      {",\n  "}
      <span className="text-sky">{'"data"'}</span>
      {": {\n    "}
      <span className="text-sky">{'"eventId"'}</span>
      {": "}
      <span className="text-gold">{'"184467"'}</span>
      {",\n    "}
      <span className="text-sky">{'"duplicate"'}</span>
      {": "}
      <span className="text-[#C3B4F4]">{"false"}</span>
      {",\n    "}
      <span className="text-sky">{'"periodUnits"'}</span>
      {": "}
      <span className="text-gold">{"742"}</span>
      {",\n    "}
      <span className="text-sky">{'"includedUnits"'}</span>
      {": "}
      <span className="text-gold">{"1000"}</span>
      {"\n  }\n}"}
    </>
  ),
  dup: (
    <>
      {"{\n  "}
      <span className="text-sky">{'"success"'}</span>
      {": "}
      <span className="text-[#C3B4F4]">{"true"}</span>
      {",\n  "}
      <span className="text-sky">{'"statusCode"'}</span>
      {": "}
      <span className="text-gold">{"202"}</span>
      {",\n  "}
      <span className="text-sky">{'"message"'}</span>
      {": "}
      <span className="text-gold">{'"Already recorded"'}</span>
      {",\n  "}
      <span className="text-sky">{'"data"'}</span>
      {": {\n    "}
      <span className="text-sky">{'"eventId"'}</span>
      {": "}
      <span className="text-gold">{'"184467"'}</span>
      {",\n    "}
      <span className="text-sky">{'"duplicate"'}</span>
      {": "}
      <span className="text-[#C3B4F4]">{"true"}</span>
      {",\n    "}
      <span className="text-sky">{'"periodUnits"'}</span>
      {": "}
      <span className="text-gold">{"742"}</span>
      {",\n    "}
      <span className="text-sky">{'"includedUnits"'}</span>
      {": "}
      <span className="text-gold">{"1000"}</span>
      {"\n  }\n}"}
    </>
  ),
  limit: (
    <>
      {"{\n  "}
      <span className="text-sky">{'"success"'}</span>
      {": "}
      <span className="text-[#C3B4F4]">{"false"}</span>
      {",\n  "}
      <span className="text-sky">{'"statusCode"'}</span>
      {": "}
      <span className="text-gold">{"429"}</span>
      {",\n  "}
      <span className="text-sky">{'"message"'}</span>
      {": "}
      <span className="text-gold">
        {'"Monthly usage limit of 1,000 units reached. Upgrade to continue."'}
      </span>
      {",\n  "}
      <span className="text-sky">{'"errorCode"'}</span>
      {": "}
      <span className="text-gold">{'"PLAN_LIMIT_USAGE"'}</span>
      {",\n  "}
      <span className="text-sky">{'"errorDetails"'}</span>
      {": []\n}"}
    </>
  ),
  key: (
    <>
      {"{\n  "}
      <span className="text-sky">{'"success"'}</span>
      {": "}
      <span className="text-[#C3B4F4]">{"false"}</span>
      {",\n  "}
      <span className="text-sky">{'"statusCode"'}</span>
      {": "}
      <span className="text-gold">{"401"}</span>
      {",\n  "}
      <span className="text-sky">{'"message"'}</span>
      {": "}
      <span className="text-gold">{'"Invalid or revoked API key"'}</span>
      {",\n  "}
      <span className="text-sky">{'"errorCode"'}</span>
      {": "}
      <span className="text-gold">{'"INVALID_API_KEY"'}</span>
      {",\n  "}
      <span className="text-sky">{'"errorDetails"'}</span>
      {": []\n}"}
    </>
  ),
};
