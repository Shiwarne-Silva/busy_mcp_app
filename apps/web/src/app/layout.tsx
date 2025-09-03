export const metadata = { title: "Busy MCP — Resume Q&A" };

import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 antialiased">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">{children}</div>
      </body>
    </html>
  );
}
