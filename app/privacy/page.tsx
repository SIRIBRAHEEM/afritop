import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <div className="flex-1 bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">Privacy policy</h1>
        <p className="mt-2 text-sm text-ink-400">Last updated: August 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-600">
          <section>
            <h2 className="text-lg font-extrabold text-ink-900">What we collect</h2>
            <p className="mt-2">
              We collect the phone numbers and meter numbers you enter, the services you buy,
              and payment confirmations from Circle. We never see or store your wallet keys or
              card details.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-extrabold text-ink-900">How we use it</h2>
            <p className="mt-2">
              Your details are used only to fulfil your order: sending airtime to the number you
              provided, generating electricity tokens, and reconciling payments.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-extrabold text-ink-900">Sharing</h2>
            <p className="mt-2">
              We share the minimum required with our vending partners (e.g. Africa&apos;s Talking)
              and payment processor (Circle) to complete your transaction. We do not sell your data.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-extrabold text-ink-900">Storage &amp; security</h2>
            <p className="mt-2">
              Transaction history is stored on our servers for your records. Access is restricted
              and connections are encrypted.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-extrabold text-ink-900">Contact</h2>
            <p className="mt-2">Privacy questions? Email privacy@afritop.example.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
