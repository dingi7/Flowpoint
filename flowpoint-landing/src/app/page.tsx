import Image from "next/image";
import Link from "next/link";

const appUrl =
  "https://flowpoint.services";
const privacyPolicyUrl = "https://flowpoint.services/privacyPolicy";
const termsOfServiceUrl = "https://flowpoint.services/termsOfService";

type LandingLocale = "bg" | "en";

const pageCopy = {
  bg: {
    nav: {
      features: "Функции",
      templates: "Шаблони",
      admin: "Админ",
      getStarted: "Стартирай",
      signIn: "Вход",
      launchLanding: "Стартирай лендинг",
    },
    language: {
      bg: "BG",
      en: "EN",
    },
    hero: {
      badge: "SEO лендинг платформа",
      title: "SEO лендинг страници за всеки бизнес във Flowpoint.",
      description:
        "Дайте на всяка организация бърза, оптимизирана и готова за бранд страница, захранвана с данни от Flowpoint. Поддомейни, шаблони и резервации се настройват за минути.",
      primaryCta: "Създай своя лендинг",
      secondaryCta: "Разгледай шаблоните",
      metrics: {
        firstLabel: "1-click",
        firstText: "Публикуване на нов поддомейн",
        secondLabel: "SSR + SEO",
        secondText: "Оптимизирани метаданни",
        thirdLabel: "Шаблони",
        thirdText: "Разширявай без преработка",
      },
    },
    preview: {
      livePreview: "Преглед на живо",
      liveMessage:
        "firstclass.flowpoint.services вече е на живо с резервации, услуги и социално доказателство.",
    },
    features: [
      {
        title: "Незабавна синхронизация",
        body: "Услугите, екипът и работното време се обновяват автоматично от Flowpoint.",
      },
      {
        title: "Рутиране по поддомейни",
        body: "Всяка организация получава чист и SEO-оптимизиран поддомейн.",
      },
      {
        title: "Готово за конверсии",
        body: "Вградени резервации, CTA елементи и структурирани данни.",
      },
    ],
    templates: {
      eyebrow: "Шаблони",
      title: "Изгради веднъж. Пусни много.",
      description:
        "Започни с шаблона First Class и разширявай към нови стилове. Запази бранд последователност, докато се адаптираш към различни индустрии.",
      note: "Регистърът с шаблони е готов за бъдещи допълнения.",
      active: "Активен",
    },
    admin: {
      eyebrow: "Flowpoint админ",
      title: "Конфигурирай лендинг страници без да напускаш Flowpoint.",
      description:
        "Слъгове, шаблони, SEO метаданни и hero съдържание се управляват изцяло от настройките на организацията. Без писане на код.",
      chips: ["Валидиране на слъг", "Бранд контроли", "Галерия и социални линкове"],
      viewLabel: "Админ изглед",
    },
    getStarted: {
      title: "Готови ли сте да публикувате Flowpoint лендинг страница?",
      description:
        "Включете лендинг страниците за всяка организация и пуснете брандиран поддомейн на живо за минути.",
      openFlowpoint: "Отвори Flowpoint",
      reviewFeatures: "Прегледай функциите",
    },
    footer: {
      rights: "Всички права запазени.",
      privacyPolicy: "Политика за поверителност",
      termsOfService: "Общи условия",
    },
  },
  en: {
    nav: {
      features: "Features",
      templates: "Templates",
      admin: "Admin",
      getStarted: "Get started",
      signIn: "Sign in",
      launchLanding: "Launch landing",
    },
    language: {
      bg: "BG",
      en: "EN",
    },
    hero: {
      badge: "SEO landing engine",
      title: "Search-first landing pages for every Flowpoint business.",
      description:
        "Give each organization a fast, optimized, and brand-ready page powered by Flowpoint data. Subdomains, templates, and bookings are all configured in minutes.",
      primaryCta: "Create your landing page",
      secondaryCta: "Browse templates",
      metrics: {
        firstLabel: "1-click",
        firstText: "Publish new subdomain",
        secondLabel: "SSR + SEO",
        secondText: "Optimized metadata",
        thirdLabel: "Templates",
        thirdText: "Expand without rework",
      },
    },
    preview: {
      livePreview: "Live preview",
      liveMessage:
        "firstclass.flowpoint.services is now live with bookings, services, and social proof.",
    },
    features: [
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
    ],
    templates: {
      eyebrow: "Templates",
      title: "Build once. Launch many.",
      description:
        "Start with the First Class template and grow into new styles. Keep brand consistency while adapting to each industry.",
      note: "Template registry is ready for future additions.",
      active: "Active",
    },
    admin: {
      eyebrow: "Flowpoint admin",
      title: "Configure landing pages without leaving Flowpoint.",
      description:
        "Slugs, templates, SEO metadata, and hero copy are all managed in the organization settings. No code needed.",
      chips: ["Slug validation", "Brand controls", "Gallery + social links"],
      viewLabel: "Admin view",
    },
    getStarted: {
      title: "Ready to publish your Flowpoint landing page?",
      description:
        "Turn on landing pages for any organization and go live on a branded subdomain in minutes.",
      openFlowpoint: "Open Flowpoint",
      reviewFeatures: "Review features",
    },
    footer: {
      rights: "All rights reserved.",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
    },
  },
} as const;

function resolveLocale(payload: { langParam?: string | string[] }): LandingLocale {
  const normalizedLang = Array.isArray(payload.langParam)
    ? payload.langParam[0]
    : payload.langParam;

  return normalizedLang === "en" ? "en" : "bg";
}

function getRootHref(payload: { locale: LandingLocale }) {
  return payload.locale === "en" ? "/?lang=en" : "/";
}

function getSectionHref(payload: { locale: LandingLocale; sectionId: string }) {
  const rootHref = getRootHref({ locale: payload.locale });
  return `${rootHref}#${payload.sectionId}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string | string[] }> | { lang?: string | string[] };
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const locale = resolveLocale({ langParam: resolvedSearchParams?.lang });
  const copy = pageCopy[locale];

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <header className="relative z-10 border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href={getRootHref({ locale })}
            className="flex items-center gap-3 text-lg font-semibold"
          >
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
            <Link href={getSectionHref({ locale, sectionId: "features" })} className="hover:text-white">
              {copy.nav.features}
            </Link>
            <Link href={getSectionHref({ locale, sectionId: "templates" })} className="hover:text-white">
              {copy.nav.templates}
            </Link>
            <Link href={getSectionHref({ locale, sectionId: "admin" })} className="hover:text-white">
              {copy.nav.admin}
            </Link>
            <Link href={getSectionHref({ locale, sectionId: "get-started" })} className="hover:text-white">
              {copy.nav.getStarted}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex rounded-full border border-white/10 p-1">
              <Link
                href="/"
                aria-label="Switch language to Bulgarian"
                className={`rounded-full px-2.5 py-1 text-xs transition ${
                  locale === "bg" ? "bg-white text-black" : "text-gray-300 hover:text-white"
                }`}
              >
                {copy.language.bg}
              </Link>
              <Link
                href="/?lang=en"
                aria-label="Switch language to English"
                className={`rounded-full px-2.5 py-1 text-xs transition ${
                  locale === "en" ? "bg-white text-black" : "text-gray-300 hover:text-white"
                }`}
              >
                {copy.language.en}
              </Link>
            </div>
            <a
              href={appUrl}
              className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-gray-200 transition hover:border-amber-400/50 hover:text-white md:inline-flex"
            >
              {copy.nav.signIn}
            </a>
            <a
              href={getSectionHref({ locale, sectionId: "get-started" })}
              className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
            >
              {copy.nav.launchLanding}
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
              {copy.hero.badge}
            </span>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">{copy.hero.title}</h1>
            <p className="text-lg text-gray-300">{copy.hero.description}</p>
            <div className="flex flex-wrap gap-3">
              <a
                href={getSectionHref({ locale, sectionId: "get-started" })}
                className="rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-300"
              >
                {copy.hero.primaryCta}
              </a>
              <a
                href={getSectionHref({ locale, sectionId: "templates" })}
                className="rounded-full border border-white/10 px-5 py-3 text-sm text-gray-200 transition hover:border-amber-400/40 hover:text-white"
              >
                {copy.hero.secondaryCta}
              </a>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-gray-400">
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-white">{copy.hero.metrics.firstLabel}</span>
                {copy.hero.metrics.firstText}
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-white">{copy.hero.metrics.secondLabel}</span>
                {copy.hero.metrics.secondText}
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-white">{copy.hero.metrics.thirdLabel}</span>
                {copy.hero.metrics.thirdText}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#141414] via-[#101010] to-[#0b0b0b] p-8 shadow-2xl">
              <div className="flex items-center justify-between text-xs uppercase text-gray-500">
                <span>flowpoint.services</span>
                <span>{copy.preview.livePreview}</span>
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
                {copy.preview.liveMessage}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
          <div className="grid gap-8 md:grid-cols-3">
            {copy.features.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-[#121212] p-6">
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
            <p className="text-sm uppercase tracking-[0.3em] text-amber-200">{copy.templates.eyebrow}</p>
            <h2 className="text-3xl font-semibold">{copy.templates.title}</h2>
            <p className="text-gray-400">{copy.templates.description}</p>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
              {copy.templates.note}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#151515] p-6">
            <div className="flex items-center justify-between text-xs uppercase text-gray-500">
              <span>First Class</span>
              <span>{copy.templates.active}</span>
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
            <div className="text-xs uppercase text-gray-500">{copy.admin.viewLabel}</div>
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
            <p className="text-sm uppercase tracking-[0.3em] text-amber-200">{copy.admin.eyebrow}</p>
            <h2 className="text-3xl font-semibold">{copy.admin.title}</h2>
            <p className="text-gray-400">{copy.admin.description}</p>
            <div className="flex flex-wrap gap-3 text-sm text-gray-300">
              {copy.admin.chips.map((chip) => (
                <span key={chip} className="rounded-full border border-white/10 px-3 py-1">
                  {chip}
                </span>
              ))}
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
                <h2 className="text-3xl font-semibold text-white">{copy.getStarted.title}</h2>
                <p className="text-gray-300">{copy.getStarted.description}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={appUrl}
                  className="rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-300"
                >
                  {copy.getStarted.openFlowpoint}
                </a>
                <a
                  href={getSectionHref({ locale, sectionId: "features" })}
                  className="rounded-full border border-white/15 px-6 py-3 text-sm text-gray-200 transition hover:border-amber-400/40 hover:text-white"
                >
                  {copy.getStarted.reviewFeatures}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <span>
            © {new Date().getFullYear()} Flowpoint. {copy.footer.rights}
          </span>
          <div className="flex gap-6">
            <a href={appUrl} className="hover:text-white">
              {copy.nav.signIn}
            </a>
            <a href={privacyPolicyUrl} className="hover:text-white">
              {copy.footer.privacyPolicy}
            </a>
            <a href={termsOfServiceUrl} className="hover:text-white">
              {copy.footer.termsOfService}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
