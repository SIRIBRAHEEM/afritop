import type { Metadata } from "next";
import { Inter, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SupportChat } from "@/components/SupportChat";

// Premium type stack: Inter for body/nav/buttons, Space Grotesk for
// headlines (geometric, confident, fintech-grade), Space Mono reserved
// for small technical accents (hashes, rates, receipts).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const space = Space_Mono({
  variable: "--font-space",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Afritop — Buy airtime, data & electricity across Africa",
    template: "%s · Afritop",
  },
  description:
    "Instant airtime, data bundles and prepaid electricity for Nigeria, Ghana, Kenya and South Africa. Pay in USDC from any EVM wallet — delivered in seconds.",
  keywords: [
    "airtime",
    "buy airtime",
    "data bundles",
    "electricity tokens",
    "Africa",
    "Nigeria",
    "Ghana",
    "Kenya",
    "South Africa",
    "USDC",
    "Arc",
  ],
  openGraph: {
    title: "Afritop — Top up Africa in seconds",
    description:
      "Buy airtime, data and prepaid electricity across Nigeria, Ghana, Kenya and South Africa. Pay in USDC from any EVM wallet, delivered in seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${grotesk.variable} ${space.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply the saved/system theme before paint so there's no flash. */}
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        {/* iOS ignores SVG touch icons — point at the static PNG mark. */}
        <link rel="apple-touch-icon" href="/icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("afritop-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
        <SupportChat />
      </body>
    </html>
  );
}
