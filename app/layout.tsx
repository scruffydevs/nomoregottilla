import type { Metadata } from "next";
import { Inter, Noto_Sans_Kannada } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const kannada = Noto_Sans_Kannada({
  variable: "--font-kannada",
  subsets: ["kannada"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "NomoreGottilla – Learn Kannada through stories",
  description: "Learn Kannada by listening to Ajji's stories. Turn every gottilla into gottu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${kannada.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
