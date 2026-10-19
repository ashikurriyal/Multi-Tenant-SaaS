import "react";

// Inline CSS custom properties, e.g. style={{ "--i": 2 }} (used by the landing page)
declare module "react" {
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined;
  }
}
