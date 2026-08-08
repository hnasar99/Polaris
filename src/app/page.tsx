"use client";

import { useRouter } from "next/navigation";
import { Aurora } from "@/components/landing/Aurora";
import { HeroIn, Reveal } from "@/components/landing/motion";
import { PrivacyBoundary } from "@/components/landing/PrivacyBoundary";
import { RoleEntry } from "@/components/landing/RoleEntry";
import { cx } from "@/components/ui";
import { useRole } from "@/features/role/RoleProvider";
import { ROLE_DEFINITIONS } from "@/features/role/roles";
import { useI18n, type MessageKey } from "@/i18n";

const HERO_STATS: ReadonlyArray<{ value: MessageKey; label: MessageKey }> = [
  { value: "landing.stat1Value", label: "landing.stat1Label" },
  { value: "landing.stat2Value", label: "landing.stat2Label" },
  { value: "landing.stat3Value", label: "landing.stat3Label" },
];

const STEPS: ReadonlyArray<{ title: MessageKey; body: MessageKey }> = [
  { title: "landing.how1Title", body: "landing.how1Body" },
  { title: "landing.how2Title", body: "landing.how2Body" },
  { title: "landing.how3Title", body: "landing.how3Body" },
  { title: "landing.how4Title", body: "landing.how4Body" },
];

const PRIVATE_ITEMS: readonly MessageKey[] = [
  "landing.private1",
  "landing.private2",
  "landing.private3",
  "landing.private4",
  "landing.private5",
];

const PUBLIC_ITEMS: readonly MessageKey[] = [
  "landing.public1",
  "landing.public2",
  "landing.public3",
  "landing.public4",
  "landing.public5",
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <PrivacyBoundarySection />
      <HowItWorks />
      <PrivateVsPublic />
      <Audience />
      <FinalCta />
      <SiteFooter />
    </>
  );
}

function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden">
      <Aurora />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-20 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,33rem)] lg:gap-10 lg:pb-28">
        <div className="flex flex-col justify-center">
          <HeroIn>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/[0.07] px-3 py-1.5 text-xs font-medium text-cyan-200">
              <span
                aria-hidden
                className="mn-animate-blink h-1.5 w-1.5 rounded-full bg-cyan-300"
              />
              {t("landing.badge")}
            </span>
          </HeroIn>

          <HeroIn delay={90}>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t("landing.heroTitleLead")}{" "}
              <span className="mn-gradient-text">
                {t("landing.heroTitleAccent")}
              </span>
            </h1>
          </HeroIn>

          <HeroIn delay={180}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              {t("landing.heroSubtitle")}
            </p>
          </HeroIn>

          <HeroIn delay={260}>
            <dl className="mt-8 grid max-w-lg grid-cols-3 gap-3">
              {HERO_STATS.map((stat) => (
                <div
                  key={stat.value}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 backdrop-blur"
                >
                  <dt className="sr-only">{t(stat.label)}</dt>
                  <dd>
                    <span className="block font-mono text-xl font-semibold tabular-nums text-cyan-200 sm:text-2xl">
                      {t(stat.value)}
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug text-slate-500">
                      {t(stat.label)}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </HeroIn>

          <HeroIn delay={340}>
            <a
              href="#how"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
            >
              {t("landing.heroScroll")}
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-4 w-4 animate-bounce"
              >
                <path
                  d="M12 5v14m-5.5-5.5L12 19l5.5-5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </HeroIn>
        </div>

        {/* The dual login is the hero's action, not a footnote. */}
        <HeroIn delay={200} className="lg:pt-6">
          <div className="rounded-3xl border border-white/10 bg-[#07111f]/60 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-5">
            <h2 className="text-sm font-semibold text-white">
              {t("roles.choose")}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {t("roles.chooseSubtitle")}
            </p>
            <div className="mt-4">
              <RoleEntry />
            </div>
          </div>
        </HeroIn>
      </div>
    </section>
  );
}

function PrivacyBoundarySection() {
  const { t } = useI18n();

  return (
    <Section id="boundary">
      <Reveal>
        <SectionHeading
          eyebrow={t("landing.boundaryEyebrow")}
          title={t("landing.boundaryTitle")}
          subtitle={t("landing.boundarySubtitle")}
        />
      </Reveal>

      <Reveal delay={120} className="mt-10">
        <PrivacyBoundary />
      </Reveal>
    </Section>
  );
}

function HowItWorks() {
  const { t } = useI18n();

  return (
    <Section id="how" tone="raised">
      <Reveal>
        <SectionHeading
          eyebrow={t("landing.howEyebrow")}
          title={t("landing.howTitle")}
          subtitle={t("landing.howSubtitle")}
        />
      </Reveal>

      <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <Reveal key={step.title} delay={index * 110}>
            <li className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1628]/60 p-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-8 font-mono text-7xl font-bold text-white/[0.04] transition-colors duration-300 group-hover:text-cyan-300/10"
              >
                {index + 1}
              </span>
              <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 font-mono text-xs font-semibold text-cyan-200 ring-1 ring-inset ring-cyan-300/25">
                {index + 1}
              </span>
              <h3 className="relative mt-4 text-base font-semibold text-white">
                {t(step.title)}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-400">
                {t(step.body)}
              </p>
            </li>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

function PrivateVsPublic() {
  const { t } = useI18n();

  return (
    <Section id="privacy">
      <Reveal>
        <SectionHeading
          eyebrow={t("landing.splitEyebrow")}
          title={t("landing.splitTitle")}
          subtitle={t("landing.splitSubtitle")}
        />
      </Reveal>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <Reveal>
          <LedgerList
            tone="private"
            title={t("landing.privateTitle")}
            items={PRIVATE_ITEMS}
          />
        </Reveal>
        <Reveal delay={120}>
          <LedgerList
            tone="public"
            title={t("landing.publicTitle")}
            items={PUBLIC_ITEMS}
          />
        </Reveal>
      </div>

      <Reveal delay={180} className="mt-4">
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-100">
            <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
              <path
                d="M12 4.5 21 19.5H3L12 4.5Zm0 5.5v4.2m0 2.6v.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("landing.crossingTitle")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-amber-100/75">
            {t("landing.crossingBody")}
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

function LedgerList({
  tone,
  title,
  items,
}: {
  tone: "private" | "public";
  title: string;
  items: readonly MessageKey[];
}) {
  const { t } = useI18n();
  const isPrivate = tone === "private";

  return (
    <div
      className={cx(
        "h-full rounded-2xl border p-5 backdrop-blur",
        isPrivate
          ? "border-emerald-400/25 bg-emerald-400/[0.05]"
          : "border-cyan-400/25 bg-cyan-400/[0.05]",
      )}
    >
      <h3
        className={cx(
          "flex items-center gap-2 text-sm font-semibold uppercase tracking-wide",
          isPrivate ? "text-emerald-200" : "text-cyan-200",
        )}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
          {isPrivate ? (
            <path
              d="M7 10V7.5a5 5 0 0 1 10 0V10M5.5 10h13v9.5h-13z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M12 5.5c-4.2 0-7.4 3.2-9 6.5 1.6 3.3 4.8 6.5 9 6.5s7.4-3.2 9-6.5c-1.6-3.3-4.8-6.5-9-6.5Zm0 4a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          )}
        </svg>
        {title}
      </h3>

      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
            <span
              aria-hidden
              className={cx(
                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                isPrivate ? "bg-emerald-400" : "bg-cyan-400",
              )}
            />
            {t(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Audience() {
  const { t } = useI18n();

  return (
    <Section id="audience" tone="raised">
      <Reveal>
        <SectionHeading
          eyebrow={t("landing.audienceEyebrow")}
          title={t("landing.audienceTitle")}
          subtitle={t("landing.audienceSubtitle")}
        />
      </Reveal>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {(["patient", "lab"] as const).map((role, index) => (
          <Reveal key={role} delay={index * 120}>
            <div className="h-full rounded-2xl border border-white/10 bg-[#0b1628]/60 p-6 backdrop-blur">
              <h3 className="text-lg font-semibold text-white">
                {t(ROLE_DEFINITIONS[role].nameKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {t(ROLE_DEFINITIONS[role].descKey)}
              </p>
              <ul className="mt-4 space-y-2">
                {(role === "patient"
                  ? ([
                      "roles.patientPoint1",
                      "roles.patientPoint2",
                      "roles.patientPoint3",
                    ] as const)
                  : ([
                      "roles.labPoint1",
                      "roles.labPoint2",
                      "roles.labPoint3",
                    ] as const)
                ).map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300/80"
                    >
                      <path
                        d="m5 12.5 4.5 4.5L19 7.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {t(point)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function FinalCta() {
  const { t } = useI18n();

  return (
    <Section id="start">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/[0.09] via-indigo-500/[0.06] to-transparent p-6 sm:p-10">
          <div
            aria-hidden
            className="mn-animate-drift pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-[90px]"
          />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {t("landing.ctaTitle")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
              {t("landing.ctaSubtitle")}
            </p>
          </div>
          <div className="relative mx-auto mt-8 max-w-3xl">
            <RoleEntry />
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

function SiteFooter() {
  const { t } = useI18n();
  const router = useRouter();
  const { setRole } = useRole();

  // The platform console is gated like any other role, so the footer has to
  // grant the role rather than deep-link into a screen that would bounce back.
  const enterAdmin = () => {
    setRole("admin");
    router.push(ROLE_DEFINITIONS.admin.home);
  };

  return (
    <footer className="border-t border-white/5 bg-[#050b14]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <p className="text-base font-semibold text-white">
            {t("common.appName")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {t("landing.footerTagline")}
          </p>
        </div>

        <nav
          aria-label={t("nav.home")}
          className="flex flex-col gap-2 text-sm text-slate-400"
        >
          <a href="#how" className="transition hover:text-white">
            {t("landing.footerHow")}
          </a>
          <a href="#privacy" className="transition hover:text-white">
            {t("landing.footerBoundary")}
          </a>
          <button
            type="button"
            onClick={enterAdmin}
            className="text-left transition hover:text-white"
          >
            {t("landing.footerPlatform")}
          </button>
        </nav>
      </div>

      <div className="border-t border-white/5">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-600">
          {t("landing.footerBuilt")}
        </p>
      </div>
    </footer>
  );
}

function Section({
  id,
  tone = "flat",
  children,
}: {
  id: string;
  tone?: "flat" | "raised";
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cx(
        "scroll-mt-24 border-t border-white/5",
        tone === "raised" && "bg-white/[0.015]",
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20 lg:py-24">
        {children}
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
        {subtitle}
      </p>
    </div>
  );
}
