import Image from "next/image";
import Link from "next/link";

const appUrl =
  "https://flowpoint.services";
const privacyPolicyUrl = "https://flowpoint.services/privacyPolicy";
const termsOfServiceUrl = "https://flowpoint.services/termsOfService";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <header className="relative z-10 border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
            <Image
              src="/flowpoint-logo.png"
              alt="Flowpoint"
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-gray-300 md:flex">
            <Link href="#features" className="hover:text-white">
              Features
            </Link>
            <Link href="#templates" className="hover:text-white">
              Templates
            </Link>
            <Link href="#admin" className="hover:text-white">
              Admin
            </Link>
            <Link href="#get-started" className="hover:text-white">
              Get started
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href={appUrl}
              className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-gray-200 transition hover:border-amber-400/50 hover:text-white md:inline-flex"
            >
              Sign in
            </a>
            <a
              href="#get-started"
              className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
            >
              Launch landing
            </a>
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-amber-500/20 blur-[140px]" />
          <div className="absolute right-0 top-32 h-[320px] w-[320px] rounded-full bg-amber-400/10 blur-[120px]" />
        </div>

        <section className="relative z-10 mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-16 pt-16 lg:flex-row lg:items-center lg:pb-24 lg:pt-24">
          <div className="flex-1 space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-200">
              SEO landing engine
            </span>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Search-first landing pages for every Flowpoint business.
            </h1>
            <p className="text-lg text-gray-300">
              Give each organization a fast, optimized, and brand-ready page
              powered by Flowpoint data. Subdomains, templates, and bookings are
              all configured in minutes.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#get-started"
                className="rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-300"
              >
                Create your landing page
              </a>
              <a
                href="#templates"
                className="rounded-full border border-white/10 px-5 py-3 text-sm text-gray-200 transition hover:border-amber-400/40 hover:text-white"
              >
                Browse templates
              </a>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-gray-400">
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-white">1-click</span>
                Publish new subdomain
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-white">SSR + SEO</span>
                Optimized metadata
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-white">Templates</span>
                Expand without rework
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#141414] via-[#101010] to-[#0b0b0b] p-8 shadow-2xl">
              <div className="flex items-center justify-between text-xs uppercase text-gray-500">
                <span>flowpoint.services</span>
                <span>Live preview</span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="h-3 w-24 rounded-full bg-amber-400/60" />
                <div className="space-y-3">
                  <div className="h-7 w-3/4 rounded-xl bg-white/10" />
                  <div className="h-4 w-2/3 rounded-lg bg-white/10" />
                  <div className="h-4 w-1/2 rounded-lg bg-white/10" />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="h-16 rounded-2xl bg-white/5" />
                  <div className="h-16 rounded-2xl bg-white/10" />
                  <div className="h-16 rounded-2xl bg-white/5" />
                </div>
              </div>
              <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                firstclass.flowpoint.services is now live with bookings,
                services, and social proof.”
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Instant data sync",
                body: "Services, team, and hours update from Flowpoint automatically.",
              },
              {
                title: "Subdomain routing",
                body: "Every organization gets a clean, SEO-friendly subdomain.",
              },
              {
                title: "Conversion-ready",
                body: "Built-in booking flows, CTAs, and structured data.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-[#121212] p-6"
              >
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm text-gray-400">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="templates"
          className="relative z-10 mx-auto grid max-w-6xl gap-10 px-6 pb-20 lg:grid-cols-[1.1fr_1fr]"
        >
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-200">
              Templates
            </p>
            <h2 className="text-3xl font-semibold">
              Build once. Launch many.
            </h2>
            <p className="text-gray-400">
              Start with the First Class template and grow into new styles.
              Keep brand consistency while adapting to each industry.
            </p>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
              Template registry is ready for future additions.
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#151515] p-6">
            <div className="flex items-center justify-between text-xs uppercase text-gray-500">
              <span>First Class</span>
              <span>Active</span>
            </div>
            <div className="mt-6 space-y-4">
              <div className="h-32 rounded-2xl bg-gradient-to-br from-amber-400/30 to-transparent" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 rounded-2xl bg-white/5" />
                <div className="h-20 rounded-2xl bg-white/10" />
              </div>
            </div>
          </div>
        </section>

        <section
          id="admin"
          className="relative z-10 mx-auto grid max-w-6xl gap-10 px-6 pb-20 lg:grid-cols-[1fr_1.1fr]"
        >
          <div className="rounded-3xl border border-white/10 bg-[#121212] p-6">
            <div className="text-xs uppercase text-gray-500">Admin view</div>
            <div className="mt-6 space-y-3">
              <div className="h-4 w-1/2 rounded-lg bg-white/10" />
              <div className="h-3 w-2/3 rounded-lg bg-white/5" />
              <div className="h-10 rounded-xl border border-white/10 bg-white/5" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 rounded-xl border border-white/10 bg-white/5" />
                <div className="h-10 rounded-xl border border-white/10 bg-white/5" />
              </div>
              <div className="h-24 rounded-2xl bg-white/5" />
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-200">
              Flowpoint admin
            </p>
            <h2 className="text-3xl font-semibold">
              Configure landing pages without leaving Flowpoint.
            </h2>
            <p className="text-gray-400">
              Slugs, templates, SEO metadata, and hero copy are all managed in
              the organization settings. No code needed.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-gray-300">
              <span className="rounded-full border border-white/10 px-3 py-1">
                Slug validation
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                Brand controls
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                Gallery + social links
              </span>
            </div>
          </div>
        </section>

        <section
          id="get-started"
          className="relative z-10 mx-auto max-w-6xl px-6 pb-24"
        >
          <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-r from-amber-400/15 via-amber-300/10 to-transparent p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold text-white">
                  Ready to publish your Flowpoint landing page?
                </h2>
                <p className="text-gray-300">
                  Turn on landing pages for any organization and go live on a
                  branded subdomain in minutes.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={appUrl}
                  className="rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-300"
                >
                  Open Flowpoint
                </a>
                <a
                  href="#features"
                  className="rounded-full border border-white/15 px-6 py-3 text-sm text-gray-200 transition hover:border-amber-400/40 hover:text-white"
                >
                  Review features
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Flowpoint. All rights reserved.</span>
          <div className="flex gap-6">
            <a href={appUrl} className="hover:text-white">
              Sign in
            </a>
            <a href={privacyPolicyUrl} className="hover:text-white">
              Privacy Policy
            </a>
            <a href={termsOfServiceUrl} className="hover:text-white">  
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
