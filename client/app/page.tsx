'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Braces,
  Check,
  ExternalLink,
  FileCheck2,
  LockKeyhole,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import TermsAndPrivacyModal from '@/components/legal/TermsAndPrivacyModal';

const repositoryUrl = 'https://github.com/paulPortos/Bob_Hackathon-APREP';

const workflow = [
  {
    label: 'Connect',
    icon: Braces,
    description: 'Map your hosted agent endpoint, request body, and response path.',
  },
  {
    label: 'Evaluate',
    icon: FileCheck2,
    description: 'Run saved questions and behavior probes against the system prompt.',
  },
  {
    label: 'Understand',
    icon: BarChart3,
    description: 'Review every answer, score explanation, and per-question trend.',
  },
];

const signals = [
  ['Accuracy', 91],
  ['Security', 86],
  ['Honesty', 88],
  ['Speed', 94],
  ['Prompt adherence', 93],
  ['Semantic accuracy', 90],
] as const;

const safeguards = [
  'Endpoint tokens encrypted at rest',
  'One evaluation per IP each day',
  'Forty requests per IP per minute',
  'Two projects per demo account',
];

export default function LandingPage() {
  const [isLegalOpen, setIsLegalOpen] = useState(false);

  return (
    <main className="min-h-[100svh] overflow-x-hidden bg-slate-50/70 text-slate-950">
      <header className="sticky top-0 z-30 h-[4.5rem] border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto grid h-full max-w-[1400px] grid-cols-[auto_1fr_auto] items-center px-5 sm:px-8 lg:px-12">
          <Link href="/" className="group relative flex w-fit items-center gap-3 focus:outline-none" aria-label="APREP — Agent Preparation">
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl shadow-sm ring-1 ring-slate-200">
              <Image src="/brand/logo.png" alt="" fill sizes="44px" className="object-cover" priority />
            </span>
            <span className="font-mono text-sm font-bold tracking-[0.14em] text-slate-950">
              APREP
            </span>
            <span className="pointer-events-none absolute left-full top-1/2 ml-2 hidden max-w-0 -translate-y-1/2 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-500 ease-out group-hover:max-w-56 group-hover:opacity-100 group-focus-visible:max-w-56 group-focus-visible:opacity-100 lg:block">
              <span className="font-sans text-sm font-medium tracking-normal text-slate-400">— </span>
              <span className="font-sans text-sm font-semibold tracking-normal text-sky-700">A</span>
              <span className="font-sans text-sm font-medium tracking-normal text-slate-400">gent </span>
              <span className="font-sans text-sm font-semibold tracking-normal text-sky-700">PREP</span>
              <span className="font-sans text-sm font-medium tracking-normal text-slate-400">aration</span>
            </span>
          </Link>

          <nav className="hidden items-center justify-center gap-7 text-sm font-medium text-slate-500 md:flex" aria-label="Landing navigation">
            <a href="#workflow" className="transition-colors hover:text-slate-950">How it works</a>
            <a href="#signals" className="transition-colors hover:text-slate-950">Scoring</a>
            <a href="#security" className="transition-colors hover:text-slate-950">Safeguards</a>
          </nav>

          <Link
            href="/auth"
            className="rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:text-sm"
          >
            Try demo
          </Link>
        </div>
      </header>

      <section className="relative flex min-h-[calc(100svh-4.5rem)] items-center border-b border-slate-200/80">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_34%,rgba(14,165,233,0.08),transparent_30%),radial-gradient(circle_at_18%_74%,rgba(124,58,237,0.06),transparent_26%)]" />

        <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-12 px-5 py-4 sm:px-8 sm:py-8 lg:px-12 xl:grid-cols-[minmax(0,1.15fr)_minmax(29rem,0.85fr)] xl:gap-12 2xl:gap-20">
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-semibold tracking-[0.08em] text-sky-700 sm:text-sm">
              <span className="text-violet-700">$</span> ./evaluate-agent --mode=clear
            </p>

            <h1 className="mt-4 font-mono text-[clamp(2.5rem,6.1vw,6.4rem)] font-semibold leading-[0.92] tracking-[-0.07em] text-slate-950 sm:mt-6">
              Trust your agents,
              <span className="mt-2 block text-sky-700">not just score</span>
              <span className="mt-2 block">
                dashboards
                <span
                  className="landing-cursor ml-[0.08em] inline-block h-[0.78em] w-[0.075em] translate-y-[0.06em] bg-sky-600 align-baseline"
                  aria-hidden="true"
                />
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:mt-6 sm:text-base">
              Evaluate hosted AI agents across accuracy, security, honesty, speed, and prompt adherence—with evidence behind every score.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:gap-3">
              <a
                href={repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-xl bg-slate-950 px-5 font-mono text-xs font-bold tracking-[0.1em] text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 sm:min-h-12"
              >
                $ INSTALL
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
              </a>
              <Link
                href="/auth"
                className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white px-5 font-mono text-xs font-bold tracking-[0.1em] text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:min-h-12"
              >
                TRY DEMO
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </div>
          </div>

          <div className="hidden min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_-36px_rgba(15,23,42,0.28)] xl:block">
            <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3.5 font-mono text-xs text-slate-500">
              <div className="flex gap-2" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
              </div>
              <span>~/evaluation · APREP</span>
            </div>

            <div className="overflow-x-auto px-6 py-6 font-mono text-sm leading-8">
              <p className="whitespace-nowrap text-slate-700"><span className="text-violet-700">$</span> POST /projects/support-agent/evaluate</p>
              <p className="whitespace-nowrap text-sky-700">→ connected to hosted agent endpoint</p>
              <p className="whitespace-nowrap text-slate-700"><span className="text-sky-700">✓</span> 12 questions · 5 behavior probes</p>
              <p className="mt-1 whitespace-nowrap text-slate-500">accuracy <span className="font-semibold text-slate-900">91</span> · security <span className="font-semibold text-slate-900">86</span> · honesty <span className="font-semibold text-slate-900">88</span></p>
              <p className="whitespace-nowrap text-slate-500">adherence <span className="font-semibold text-slate-900">93</span> · semantic <span className="font-semibold text-slate-900">90</span> · speed <span className="font-semibold text-slate-900">94</span></p>
              <p className="mt-1 whitespace-nowrap text-slate-700">→ report ready · overall <span className="rounded bg-sky-100 px-1.5 py-0.5 font-semibold text-sky-800">90.3</span></p>
              <p className="mt-1 flex items-center text-slate-700">
                <span className="text-violet-700">$</span>
                <span
                  className="landing-cursor ml-2 inline-block h-[1.05em] w-[0.58em] bg-sky-600"
                  aria-hidden="true"
                />
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="scroll-mt-20 border-b border-slate-200 bg-white px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <p className="font-mono text-xs font-semibold text-sky-700">$ ./workflow</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">From endpoint to evidence.</h2>

          <div className="mt-10 grid overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 shadow-sm sm:grid-cols-3 sm:gap-px">
            {workflow.map(({ label, icon: Icon, description }, index) => (
              <article key={label} className="border-b border-slate-200 bg-white p-6 last:border-b-0 sm:border-b-0 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-400">0{index + 1}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-sky-700">
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                </div>
                <h3 className="mt-8 text-lg font-semibold text-slate-950">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="signals" className="scroll-mt-20 border-b border-slate-200 bg-slate-50/70 px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div>
            <p className="font-mono text-xs font-semibold text-sky-700">$ inspect --scores</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Know why an answer passed.</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-500">
              APREP keeps the response, individual scores, explanation, system prompt, and question-level analytics together in one report.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <p className="text-xs font-medium text-slate-400">Evaluation report</p>
                <p className="mt-1 font-semibold text-slate-950">Support agent · 12 responses</p>
              </div>
              <span className="font-mono text-2xl font-semibold text-sky-700">90.3</span>
            </div>
            <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {signals.map(([label, value]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-mono font-semibold text-slate-800">{value}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-sky-600" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="scroll-mt-20 bg-white px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1400px] gap-12 rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-10 lg:grid-cols-[1fr_0.9fr] lg:p-12">
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <h2 className="mt-7 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Safer by default for an open demo.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">
              Practical controls protect credentials and limit the most common abuse paths without heavy infrastructure.
            </p>
          </div>

          <div className="grid content-center gap-1">
            {safeguards.map((item) => (
              <div key={item} className="flex items-center gap-3 border-b border-slate-200 py-4 text-sm text-slate-700 last:border-b-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700 ring-1 ring-slate-200">
                  {item.includes('encrypted') ? <LockKeyhole className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200/80 bg-white px-5 py-5 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
          <p>© 2026 APREP. All rights reserved.</p>
          <button
            type="button"
            onClick={() => setIsLegalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <Scale className="h-3.5 w-3.5" strokeWidth={1.8} />
            Terms &amp; conditions
          </button>
        </div>
      </footer>

      <TermsAndPrivacyModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        defaultTab="terms"
      />
    </main>
  );
}
