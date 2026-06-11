import { setRequestLocale } from 'next-intl/server'
import { locales, type Locale } from '@/i18n'
import Link from 'next/link'
import Image from 'next/image'
import { LanguageToggle } from '@/components/layout/LanguageToggle'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-nunito)' }}>

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-5 py-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <Image
            src="/logo-icon-sp-round.png"
            alt="Swappanini"
            width={32}
            height={32}
            className="rounded-full"
          />
          <span
            className="text-xl font-black tracking-tight"
            style={{ fontFamily: 'var(--font-fredoka)', color: '#1B3B1A' }}
          >
            Swappanini
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle locale={locale} variant="pill" />
          <Link
            href={`/${locale}/login`}
            className="text-sm font-black px-4 py-2 rounded-full border-2 transition-all active:scale-[0.97]"
            style={{ borderColor: '#1B3B1A', color: '#1B3B1A' }}
          >
            Se connecter
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="px-5 pt-8 pb-10 max-w-2xl mx-auto text-center">
        <span
          className="inline-block text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-6"
          style={{ background: 'rgba(0,194,65,0.1)', color: '#00C241', border: '1px solid rgba(0,194,65,0.25)' }}
        >
          ⚽ FIFA World Cup 2026
        </span>

        <h1
          className="text-5xl leading-tight mb-4"
          style={{ fontFamily: 'var(--font-fredoka)', color: '#1B3B1A', fontSize: 'clamp(2.4rem, 8vw, 3.8rem)' }}
        >
          Ton album Panini,{' '}
          <span style={{ color: '#00C241' }}>complété.</span>
        </h1>

        <p className="text-lg font-semibold mb-8 max-w-sm mx-auto" style={{ color: '#6b7280', lineHeight: 1.6 }}>
          Suis tes vignettes, trouve tes doublons et échange avec des collectionneurs du monde entier.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${locale}/register`}
            className="px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.97] text-center"
            style={{ background: '#AAFF00', color: '#1B3B1A' }}
          >
            Créer mon compte →
          </Link>
          <Link
            href={`/${locale}/login`}
            className="px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.97] text-center border-2"
            style={{ borderColor: '#e5e7eb', color: '#374151', background: 'white' }}
          >
            Se connecter
          </Link>
        </div>

        <p className="text-xs font-semibold mt-4" style={{ color: '#9ca3af' }}>
          Gratuit · Aucune carte bancaire requise
        </p>
      </section>

      {/* ── Feature 1 : Album ── */}
      <section className="px-5 pb-6 max-w-2xl mx-auto">
        <div
          className="rounded-3xl overflow-hidden"
          style={{ background: '#f8fffe', border: '1.5px solid #d1fae5' }}
        >
          {/* Visual mockup */}
          <div
            className="px-6 pt-8 pb-4 flex flex-col items-center gap-3"
            style={{ background: 'linear-gradient(180deg, #e6fff2 0%, #f8fffe 100%)' }}
          >
            {/* Fake sticker grid */}
            <div className="flex gap-2">
              {[
                { owned: true, code: 'BRZ', name: 'Vinicius', double: true },
                { owned: true, code: 'FRA', name: 'Mbappé', double: false },
                { owned: false, code: 'ARG', name: 'Di María', double: false },
                { owned: true, code: 'ENG', name: 'Bellingham', double: true },
                { owned: false, code: 'ESP', name: 'Yamal', double: false },
              ].map((s) => (
                <div
                  key={s.code}
                  className="relative rounded-xl flex flex-col items-center justify-between py-2 px-1.5"
                  style={{
                    width: '58px', height: '72px', flexShrink: 0,
                    background: s.owned ? 'white' : 'white',
                    border: `1.5px ${s.owned ? 'solid' : 'dashed'} ${s.owned ? '#00C241' : '#86efac'}`,
                  }}
                >
                  {s.double && (
                    <span
                      className="absolute -top-2 -right-2 text-[9px] font-black px-1 py-0.5 rounded-md leading-none"
                      style={{ background: '#AAFF00', color: '#1B3B1A' }}
                    >
                      +1
                    </span>
                  )}
                  <span className="text-[9px] font-black self-start leading-none" style={{ color: s.owned ? '#9ca3af' : '#86efac' }}>
                    {s.owned ? '✓' : '?'}
                  </span>
                  <span className="font-black text-xs leading-none" style={{ color: s.owned ? '#1B3B1A' : '#86efac' }}>
                    {s.code.slice(0, 3)}
                  </span>
                  <span className="text-[8px] font-medium text-center leading-tight truncate w-full px-0.5" style={{ color: s.owned ? '#6b7280' : '#86efac' }}>
                    {s.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats bar */}
            <div className="w-full max-w-xs rounded-2xl px-4 py-3 flex gap-4 justify-center" style={{ background: 'white', border: '1px solid #e5e7eb' }}>
              <div className="text-center">
                <p className="font-black text-xl" style={{ color: '#00C241' }}>47%</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Complété</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="text-center">
                <p className="font-black text-xl" style={{ color: '#1B3B1A' }}>12</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Doubles</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="text-center">
                <p className="font-black text-xl" style={{ color: '#6b7280' }}>520</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Manquants</p>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="px-6 py-5">
            <span
              className="inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
              style={{ background: '#d1fae5', color: '#059669' }}
            >
              📒 Album digital
            </span>
            <h2
              className="text-2xl font-black mb-2 leading-tight"
              style={{ fontFamily: 'var(--font-fredoka)', color: '#1B3B1A' }}
            >
              Suis toutes tes vignettes en un clic
            </h2>
            <p className="text-sm font-semibold leading-relaxed" style={{ color: '#6b7280' }}>
              Tape sur une vignette pour l'ajouter à ta collection. Un double ? Un appui long et c'est marqué. Ton avancement se met à jour en temps réel.
            </p>
            <ul className="mt-4 space-y-2">
              {[
                'Catalogue complet des 980 vignettes WC 2026',
                'Groupes A–L + Spéciaux Coca-Cola & FWC',
                'Suivi des doublons et des manquants',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm font-semibold" style={{ color: '#374151' }}>
                  <span className="text-base leading-none mt-0.5" style={{ color: '#00C241' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Feature 2 : Échanges ── */}
      <section className="px-5 pb-6 max-w-2xl mx-auto">
        <div
          className="rounded-3xl overflow-hidden"
          style={{ background: '#fffdf5', border: '1.5px solid #fef08a' }}
        >
          {/* Visual mockup */}
          <div
            className="px-6 pt-8 pb-4 flex flex-col items-center gap-3"
            style={{ background: 'linear-gradient(180deg, #fefce8 0%, #fffdf5 100%)' }}
          >
            {/* Fake match cards */}
            {[
              { pseudo: 'Lucas', location: 'São Paulo, BR', gives: 3, gets: 2, priority: true },
              { pseudo: 'María', location: 'Barcelona, ES', gives: 2, gets: 4, priority: false },
            ].map((m) => (
              <div
                key={m.pseudo}
                className="w-full max-w-xs rounded-2xl p-3 flex items-center gap-3"
                style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-black text-base flex-shrink-0 border-2"
                  style={{ background: 'white', borderColor: '#00C241', color: '#00C241', fontFamily: 'var(--font-fredoka)' }}
                >
                  {m.pseudo[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm" style={{ color: '#1B3B1A' }}>
                    {m.pseudo}
                    {m.priority && (
                      <span
                        className="ml-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full"
                        style={{ background: '#AAFF00', color: '#1B3B1A' }}
                      >
                        PRIORITÉ
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{m.location}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: '#6b7280' }}>
                    Tu donnes <strong style={{ color: '#1B3B1A' }}>{m.gives}</strong>
                    {' · '}
                    Tu reçois <strong style={{ color: '#00C241' }}>{m.gets}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Text */}
          <div className="px-6 py-5">
            <span
              className="inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
              style={{ background: '#fef9c3', color: '#854d0e' }}
            >
              🔄 Échanges
            </span>
            <h2
              className="text-2xl font-black mb-2 leading-tight"
              style={{ fontFamily: 'var(--font-fredoka)', color: '#1B3B1A' }}
            >
              Échange avec les bons collectionneurs
            </h2>
            <p className="text-sm font-semibold leading-relaxed" style={{ color: '#6b7280' }}>
              On calcule automatiquement quels collectionneurs ont ce qu'il te faut et veulent ce que tu as. Plus de recherches inutiles — juste les meilleurs matchs.
            </p>
            <ul className="mt-4 space-y-2">
              {[
                'Matching intelligent par doublons et envies',
                'Échange par courrier ou en main propre',
                'Boîte de messagerie intégrée',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm font-semibold" style={{ color: '#374151' }}>
                  <span className="text-base leading-none mt-0.5" style={{ color: '#00C241' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-5 py-10 max-w-2xl mx-auto text-center">
        <h2
          className="text-3xl mb-3"
          style={{ fontFamily: 'var(--font-fredoka)', color: '#1B3B1A' }}
        >
          Prêt à compléter ton album ?
        </h2>
        <p className="text-sm font-semibold mb-6" style={{ color: '#9ca3af' }}>
          Rejoins les collectionneurs déjà inscrits
        </p>
        <Link
          href={`/${locale}/register`}
          className="inline-block px-10 py-4 rounded-2xl font-black text-xl transition-all active:scale-[0.97]"
          style={{ background: '#AAFF00', color: '#1B3B1A' }}
        >
          C&apos;est parti ! →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 px-5 py-6 max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Image
            src="/logo-icon-sp-round.png"
            alt="Swappanini"
            width={20}
            height={20}
            className="rounded-full opacity-60"
          />
          <span className="text-xs font-bold text-gray-400">
            Swappanini © 2026
          </span>
        </div>
        <p className="text-xs text-gray-300">
          Non affilié à Panini Group. Fait par des collectionneurs, pour des collectionneurs.
        </p>
      </footer>
    </div>
  )
}
