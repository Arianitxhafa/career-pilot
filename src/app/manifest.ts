import type { MetadataRoute } from "next";

/** Web app manifest: makes CareerPilot installable on phones and desktops (served at /manifest.webmanifest). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "CareerPilot — job search tracker",
    short_name: "CareerPilot",
    description: "Track every job application on one board, score your CV against each job and never miss a follow-up.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#050913",
    theme_color: "#2f5bff",
    categories: ["productivity", "business"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Board", url: "/dashboard", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Job match", url: "/dashboard/match", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Calendar", url: "/dashboard/calendar", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
