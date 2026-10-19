"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { ArrowIcon } from "./icons";

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

  return (
    <header className={`nb ${scrolled || menuOpen ? "is-scrolled" : ""}`}>
      <div className="nb-progress" aria-hidden="true" />
      <nav className="nb-bar" aria-label="Main">
        <a href="#top" className="nb-brand">
          <LogoMark size={30} />
          <span className="nb-name">LedgerFlow</span>
        </a>
        <div className="nb-links">
          {LINKS.map((l) => (
            <a key={l.id} className="nb-link" href={`#${l.id}`} data-on={on(l.id)}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="nb-actions">
          <Link className="nb-login" href="/login">
            Log in
          </Link>
          <Link className="btn-primary nb-cta" href="/login">
            Try the live demo
            <ArrowIcon size={14} />
          </Link>
          <button
            type="button"
            className="nb-menu"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label="Menu"
          >
            <span />
            <span />
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div className="nb-drop">
          {LINKS.map((l) => (
            <a
              key={l.id}
              className="nb-mlink"
              href={`#${l.id}`}
              data-on={on(l.id)}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <Link className="nb-mlink" href="/login">
            Log in
          </Link>
        </div>
      )}
    </header>
  );
}
