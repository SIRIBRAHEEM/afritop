import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of service" };

const SECTIONS = [
  {
    title: "1. The service",
    body: "Afritop lets you buy airtime, data bundles and prepaid electricity tokens for supported African countries, paying in USDC via Circle. Delivery is handled by our vending partners.",
  },
  {
    title: "2. Eligibility",
    body: "You must be at least 18 years old and legally able to enter into binding contracts to use the service. You are responsible for the accuracy of the phone numbers and meter numbers you enter.",
  },
  {
    title: "3. Payments",
    body: "All payments settle in USDC. Exchange rates shown at checkout are indicative and may change. Once a top-up is delivered it is final and non-refundable, except where required by law.",
  },
  {
    title: "4. Availability",
    body: "Services depend on our vending partners and network operators. Delivery is normally instant but may occasionally be delayed. We are not liable for outages outside our control.",
  },
  {
    title: "5. Contact",
    body: "Questions? Email the team at ibramzzzy@gmail.com — we usually reply within a few hours.",
  },
];

export default function TermsPage() {
  return (
    <div className="flex-1 bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Legal</p>
        <h1 className="mt-2 font-display text-h2 font-bold text-ink-900">Terms of service</h1>
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
