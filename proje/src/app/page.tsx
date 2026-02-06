export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-sand text-ink">
      <div className="pointer-events-none absolute inset-0 bg-aurora" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-6 py-16">
        <header className="flex flex-col gap-6">
          <span className="w-fit rounded-full border border-ink/15 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em]">
            Multi-Agent Platform
          </span>
          <div className="flex flex-col gap-5">
            <h1 className="animate-rise text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              Lookfor Studio
              <span className="block text-tide">
                LangGraph ile cok ajanli akislari tasarla.
              </span>
            </h1>
            <p className="animate-rise-delay max-w-2xl text-lg leading-8 text-ink/70">
              Operasyon, arastirma ve otomasyon akislari icin moduler agent
              katmani. Guvenli, izlenebilir ve kolayca genisletilebilir bir
              temel.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-sand transition hover:bg-ink/90">
              Prototipi Baslat
            </button>
            <button className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink/40">
              Mimariyi Gor
            </button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Ajan Katmanlari</h2>
              <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-tide">
                Aktif
              </span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {['Orchestrator', 'Research', 'Build', 'Validate'].map(label => (
                <div
                  key={label}
                  className="rounded-2xl border border-ink/10 bg-sand/70 px-4 py-4 text-sm font-semibold"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink/50">
                    {label}
                  </p>
                  <p className="mt-3 text-base text-ink">
                    Durum akislari ve gorev dagitimi
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Akis Sagligi</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-ink/10 bg-sand/80 p-4">
                  <p className="text-sm text-ink/60">Ajanlar arasi gecis</p>
                  <p className="mt-2 text-2xl font-semibold">12ms</p>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-sand/80 p-4">
                  <p className="text-sm text-ink/60">Arastirma throughput</p>
                  <p className="mt-2 text-2xl font-semibold">4.6x</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-ink/10 bg-ink p-6 text-sand shadow-sm">
              <h2 className="text-xl font-semibold">LangGraph Cekirdegi</h2>
              <p className="mt-4 text-sm leading-6 text-sand/80">
                Graph node ve edge tanimlari icin hazir altyapi. Akislar sadece
                agent mantigini eklemeni bekliyor.
              </p>
              <div className="mt-6 flex items-center gap-3 text-sm font-semibold">
                <span className="inline-flex h-2 w-2 rounded-full bg-ember" />
                Hazir servis girisi
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-ink/10 bg-white/70 p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold">Uretime Hazir Altyapi</h2>
              <p className="mt-3 text-base leading-7 text-ink/70">
                LangGraph ve Next.js ile agent akislari, server route uzerinden
                guvenli sekilde yonetilir. Konfigurasyon ve telemetry hazir.
              </p>
            </div>
            <div className="animate-float rounded-2xl border border-ink/10 bg-sand/80 px-6 py-5 text-sm text-ink/70">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/50">
                Pipeline
              </p>
              <p className="mt-3 text-base font-semibold text-ink">
                Intake to Plan to Execute to Verify
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
