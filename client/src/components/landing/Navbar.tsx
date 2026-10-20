"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import ButtonLink from "./ButtonLink";
import { ArrowIcon } from "./icons";
import { focusRing } from "./ui";

const LINKS = [
  { id: "how", label: "How it works" },
  { id: "features", label: "Features" },
  { id: "developers", label: "Developers" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
];

// Fixed navbar: a plain full-width bar over the hero, a floating glass pill once the page
// scrolls (a marker at the top of the hero leaves the viewport), and the link of the
// section in the middle of the screen highlighted
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const marker = document.querySelector('[data-lf="navsentinel"]');
    const sections = ["top", ...LINKS.map((l) => l.id)]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const markerObserver = new IntersectionObserver((entries) => {
      setScrolled(!entries[entries.length - 1].isIntersecting);
    });
    if (marker) markerObserver.observe(marker);

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) setActive(en.target.id === "top" ? "" : en.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((el) => sectionObserver.observe(el));

    return () => {
      markerObserver.disconnect();
      sectionObserver.disconnect();
    };
  }, []);

  const on = (id: string) => (active === id ? "true" : "false");
  const pill = scrolled || menuOpen;

  return (
    <header
      data-scrolled={pill}
      className="group/nav pointer-events-none fixed inset-x-0 top-0 z-30"
    >
      <div
        aria-hidden
        className="scroll-progress pointer-events-none absolute top-0 left-0 h-0.5 w-full bg-linear-to-r from-primary via-mint via-60% to-lime shadow-[0_0_10px_rgba(95,211,181,0.6)]"
      />
      <nav
        aria-label="Main"
        className={cn(
          "pointer-events-auto relative mx-auto box-border flex h-18 max-w-300 items-center justify-between gap-4 rounded-none border border-transparent bg-transparent px-6",
          "transition-[max-width,height,margin,padding,border-radius,background-color,border-color,box-shadow,backdrop-filter] duration-450 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
          "group-data-[scrolled=true]/nav:mt-3 group-data-[scrolled=true]/nav:h-14.5 group-data-[scrolled=true]/nav:max-w-245 group-data-[scrolled=true]/nav:rounded-[16px] group-data-[scrolled=true]/nav:pr-2 group-data-[scrolled=true]/nav:pl-3.5",
          "group-data-[scrolled=true]/nav:border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-line))] group-data-[scrolled=true]/nav:bg-white/80 group-data-[scrolled=true]/nav:shadow-[0_1px_2px_rgba(11,18,21,0.05),0_18px_40px_-26px_rgba(11,18,21,0.45)] group-data-[scrolled=true]/nav:backdrop-blur-[14px] group-data-[scrolled=true]/nav:backdrop-saturate-160",
          "max-[920px]:group-data-[scrolled=true]/nav:mx-3",
        )}
      >
        <a
          href="#top"
          className={cn(
            "inline-flex flex-none items-center gap-2.5 text-ink no-underline hover:text-ink",
            focusRing,
          )}
        >
          <LogoMark size={30} />
          <span className="text-[16.5px] leading-none font-semibold tracking-[-0.01em]">
            LedgerFlow
          </span>
        </a>
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-[12px] border border-transparent p-1 transition-[background-color,border-color] duration-350 group-data-[scrolled=true]/nav:border-line-soft group-data-[scrolled=true]/nav:bg-[rgba(242,245,244,0.9)] max-[920px]:hidden">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              data-on={on(l.id)}
              className={cn(
                "relative inline-flex min-h-8.5 items-center rounded-[9px] px-3 text-[14px] whitespace-nowrap text-body no-underline transition-[background-color,color,box-shadow] duration-200",
                "hover:bg-primary/6 hover:text-brand-deep focus-visible:bg-primary/6 focus-visible:text-brand-deep",
                "data-[on=true]:bg-[color-mix(in_srgb,var(--color-primary)_11%,#fff)] data-[on=true]:font-medium data-[on=true]:text-brand-deep data-[on=true]:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-primary)_26%,transparent)]",
                "data-[on=true]:after:absolute data-[on=true]:after:bottom-1 data-[on=true]:after:left-1/2 data-[on=true]:after:-ml-0.5 data-[on=true]:after:size-1 data-[on=true]:after:rounded-full data-[on=true]:after:bg-primary",
                focusRing,
              )}
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex flex-none items-center gap-1.5">
          <Link
            href="/login"
            className={cn(
              "inline-flex min-h-10 items-center rounded-[10px] px-3 text-[14px] font-medium text-ink no-underline transition-colors duration-200 hover:bg-[rgba(242,245,244,0.9)] hover:text-ink max-[920px]:hidden",
              focusRing,
            )}
          >
            Log in
          </Link>
          <ButtonLink
            href="/login"
            className="box-border min-h-10 gap-1.5 rounded-[10px] px-3.5 text-[14px] font-medium whitespace-nowrap max-[420px]:px-3 max-[420px]:text-[13px]"
          >
            {/* Phones get the short label so the brand, button and menu fit on one row */}
            <span className="max-[400px]:hidden">Try the live demo</span>
            <span className="min-[401px]:hidden">Live demo</span>
            <ArrowIcon size={14} />
          </ButtonLink>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label="Menu"
            className={cn(
              "group/menu hidden size-10 cursor-pointer flex-col items-center justify-center gap-1.25 rounded-[10px] border border-line bg-white max-[920px]:inline-flex",
              "*:block *:h-[1.8px] *:w-4 *:rounded-xs *:bg-ink *:transition-transform *:duration-250",
              "aria-expanded:*:first:transform-[translateY(3.4px)_rotate(45deg)] aria-expanded:*:last:transform-[translateY(-3.4px)_rotate(-45deg)]",
              focusRing,
            )}
          >
            <span />
            <span />
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div className="pointer-events-auto mx-3 mt-2 flex max-w-245 animate-drop flex-col rounded-[16px] border border-line bg-white/96 p-2 shadow-[0_24px_50px_-28px_rgba(11,18,21,0.5)] backdrop-blur-[14px]">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              data-on={on(l.id)}
              onClick={() => setMenuOpen(false)}
              className={mobileLink}
            >
              {l.label}
            </a>
          ))}
          <Link href="/login" className={mobileLink}>
            Log in
          </Link>
        </div>
      )}
    </header>
  );
}

const mobileLink = cn(
  "flex min-h-11 items-center rounded-[10px] px-3 text-[15px] text-ink-soft no-underline",
  "hover:bg-primary/6 hover:text-brand-deep",
  "data-[on=true]:bg-[color-mix(in_srgb,var(--color-primary)_11%,#fff)] data-[on=true]:font-medium data-[on=true]:text-brand-deep",
  focusRing,
);
