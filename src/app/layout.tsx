import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "麻雀成績管理",
  description: "Mahjong Score Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
          <nav className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="font-bold text-xl tracking-tight">
              🀄 成績管理
            </a>
            <div className="flex gap-4 text-sm font-medium">
              <a href="/games/new" className="hover:text-cyan-400 transition-colors">
                結果入力
              </a>
              <a href="/games/sheet" className="hover:text-cyan-400 transition-colors">
                シート
              </a>
              <a href="/players" className="hover:text-cyan-400 transition-colors">
                メンバー
              </a>
            </div>
          </nav>
        </header>

        <main className="max-w-md mx-auto p-4 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </body>
    </html>
  );
}
