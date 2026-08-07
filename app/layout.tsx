import type { Metadata } from "next";
import { Inter, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

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
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const space = Space_Mono({
  variable: "--font-space",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

// NOTE: swap this for your custom domain once it's live (e.g. https://afritop.xyz).
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://afritop.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Afritop | Buy airtime, data & electricity across Africa",
    template: "%s · Afritop",
  },
  description:
    "Instant airtime, data bundles and prepaid electricity for Nigeria, Ghana, Kenya and South Africa. Pay in USDC from any EVM wallet, delivered in seconds.",
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
    title: "Afritop | Top up Africa in seconds",
    description:
      "Buy airtime, data and prepaid electricity across Nigeria, Ghana, Kenya and South Africa. Pay in USDC from any EVM wallet, delivered in seconds.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Afritop | Top up Africa in seconds" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Afritop | Top up Africa in seconds",
    description:
      "Buy airtime, data and prepaid electricity across Nigeria, Ghana, Kenya and South Africa. Pay in USDC from any EVM wallet, delivered in seconds.",
    images: ["/og.png"],
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
        {/* Apply the saved theme before paint so there's no flash.
         * Dark-first (like afrifleet): dark is the default look — the
         * bright-yellow light mode is the opt-in via the toggle. */}
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        {/* iOS ignores SVG touch icons — point at the static PNG mark. */}
        <link rel="apple-touch-icon" href="/icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("afritop-theme");if(t!=="light"){document.documentElement.classList.add("dark")}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
