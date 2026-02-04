import Link from "next/link";

const appUrl =
  process.env.NEXT_PUBLIC_FLOWPOINT_APP_URL ||
  "https://flowpoint.services";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <div className="rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-amber-200">
          Landing not found
        </div>
        <h1 className="mt-6 text-4xl font-semibold md:text-5xl">
          This Flowpoint landing page is not available.
        </h1>
        <p className="mt-4 text-base text-gray-300 md:text-lg">
          The subdomain you requested does not exist or hasn&apos;t been
          published yet. You can create or enable a landing page from the
          Flowpoint admin.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={appUrl}
            className="rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-300"
          >
            Open Flowpoint
          </a>
          <Link
            href="/"
            className="rounded-full border border-white/15 px-6 py-3 text-sm text-gray-200 transition hover:border-amber-400/40 hover:text-white"
          >
            Back to main site
          </Link>
        </div>
      </div>
    </main>
  );
}
