// Shown once the webhook confirms the payment
export default function Toast() {
  return (
    <div className="absolute right-[1.4em] bottom-[1.4em] z-4 flex animate-toast items-center gap-[0.75em] rounded-[0.8em] border border-line bg-white py-[0.85em] pr-[1.1em] pl-[0.9em] shadow-[0_1em_2.4em_-1em_rgba(11,18,21,0.38)]">
      <span className="inline-flex size-[1.6em] flex-none items-center justify-center rounded-full bg-primary">
        <svg
          width="0.9em"
          height="0.9em"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>
      <span className="flex flex-col gap-[0.35em]">
        <span className="text-[0.76em] leading-none font-semibold">Payment confirmed</span>
        <span className="text-[0.66em] leading-none text-subtle">
          Webhook processed · Pro is active
        </span>
      </span>
    </div>
  );
}
