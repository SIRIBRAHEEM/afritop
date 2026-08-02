import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fraunces, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      className={`${jakarta.variable} ${fraunces.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply the saved/system theme before paint so there's no flash. */}
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
      </body>
    </html>
  );
}
