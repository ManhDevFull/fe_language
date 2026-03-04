import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Langues Vocabulary Lab",
    short_name: "Langues",
    description: "Hoc tu vung EN/RU va nghe phat am tren giao dien mobile-first.",
    start_url: "/",
    display: "standalone",
    background_color: "#07100b",
    theme_color: "#0a140f",
    lang: "vi",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
