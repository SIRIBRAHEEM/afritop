import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <div className="flex-1 bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">Terms of service</h1>
        <p className="mt-2 text-sm text-ink-400">Last updated: August 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-600">
          <section>
            <h2 className="text-lg font-extrabold text-ink-900">1. The service</h2>
            <p className="mt-2">
              Afritop lets you buy airtime, data bundles and prepaid electricity tokens for
              supported African countries, paying in USDC via Circle. Delivery is handled by
              our vending partners.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-extrabold text-ink-900">2. Eligibility</h2>
            <p className="mt-2">
              You must be at least 18 years old and legally able to enter into binding contracts
              to use the service. You are responsible for the accuracy of the phone numbers and
              meter numbers you enter.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-extrabold text-ink-900">3. Payments</h2>
            <p className="mt-2">
              All payments settle in USDC. Exchange rates shown at checkout are indicative and
              may change. Once a top-up is delivered it is final and non-refundable, except
              where required by law.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-extrabold text-ink-900">4. Availability</h2>
            <p className="mt-2">
              Services depend on our vending partners and network operators. Delivery is
              normally instant but may occasionally be delayed. We are not liable for outages
              outside our control.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-extrabold text-ink-900">5. Contact</h2>
            <p className="mt-2">Questions? Email support@afritop.example.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
