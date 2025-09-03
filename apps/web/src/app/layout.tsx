export const metadata = { title: "Busy MCP — Resume Q&A" };

import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={[
          font.className,
          // Deep space gradient + subtle noise for texture
          "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 antialiased",
          "selection:bg-indigo-500/30 selection:text-white",
        ].join(" ")}
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-10">{children}</div>
      </body>
    </html>
  );
}
