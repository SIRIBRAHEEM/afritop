import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy" };

const SECTIONS = [
  {
    title: "What we collect",
    body: "We collect the phone numbers and meter numbers you enter, the services you buy, and payment confirmations from Circle. We never see or store your wallet keys or card details.",
  },
  {
    title: "How we use it",
    body: "Your details are used only to fulfil your order: sending airtime to the number you provided, generating electricity tokens, and reconciling payments.",
  },
  {
    title: "Sharing",
    body: "We share the minimum required with our vending partners (e.g. Africa's Talking) and payment processor (Circle) to complete your transaction. We do not sell your data.",
  },
  {
    title: "Storage & security",
    body: "Transaction history is stored on our servers for your records. Access is restricted and connections are encrypted.",
  },
  {
    title: "Contact",
    body: "Privacy questions? Email ibramzzzy@gmail.com and we'll get back to you.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex-1 bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Legal</p>
        <h1 className="mt-2 font-display text-h2 font-semibold text-ink-900">Privacy policy</h1>
        <p className="mt-2 text-sm text-ink-500">Last updated: August 2026</p>

        <div className="mt-8 space-y-4">
          {SECTIONS.map((s) => (
            <section key={s.title} className="border-2 border-ink-950 bg-surface p-6 sm:p-7">
              <h2 className="font-display text-lg font-bold text-ink-900">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
