import { ImageResponse } from "next/og";

// Home-screen icon for iOS, drawn from the same mark as src/app/icon.svg
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "linear-gradient(135deg, #14A38B, #0A6152)",
      }}
    >
      <svg width="180" height="180" viewBox="0 0 32 32">
        <path
          d="M9 10.2h5.6M9 16h9.4M9 21.8h14"
          stroke="#FFFFFF"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="18.6" cy="10.2" r="1.5" fill="#5FD3B5" />
      </svg>
    </div>,
    size,
  );
}
