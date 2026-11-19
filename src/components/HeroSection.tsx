import { ArrowRight } from 'lucide-react';
import { HERO_IMAGE, type ShopSettings } from '../data/coffeeData';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  settings: ShopSettings;
}

export function HeroSection({ settings }: HeroSectionProps) {
  return (
    <section id="top" className="border-b border-zinc-200/80 bg-[#FAFAFA]">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-12 sm:px-6 lg:px-8 lg:pt-14 lg:pb-16">
        {/* 2-Column Balanced Split */}
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="mb-3 text-sm font-medium text-[#1C4A38]">
              {settings.neighborhood} · {settings.address}
            </p>
            <h1
              className="font-display text-zinc-900 font-medium tracking-tight leading-[1.08] text-balance"
              style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)' }}
            >
              {settings.heroHeadline}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-600">
              {settings.heroDescription}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a
                href="#menu"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#1C4A38] px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#15392B] active:scale-[0.99] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C4A38]"
              >
                Explore the Menu
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#contact"
                className="inline-flex min-h-[44px] items-center px-2 py-2 text-sm font-medium text-zinc-700 transition-colors duration-150 hover:text-zinc-900 hover:underline hover:underline-offset-4 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C4A38]"
              >
                Hours &amp; Contact
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-100 lg:aspect-auto lg:h-full lg:min-h-[380px]">
              <ResilientImage
                src={HERO_IMAGE.src}
                alt={HERO_IMAGE.alt}
                fallbackTitle={`${settings.name} Coffee Bar`}
                className="h-full w-full object-cover"
                containerClassName="h-full w-full min-h-[280px]"
              />
            </div>
          </div>
        </div>

        {/* Full-Width 3-Column Shop Strip Below Hero Split */}
        <div className="mt-10 grid grid-cols-1 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-6 py-5">
            <p className="text-xs font-medium text-zinc-500">Daily Hours</p>
            <p className="mt-1 text-base font-semibold text-zinc-900 tabular-nums">
              {settings.hoursSummary}
            </p>
            <p className="mt-0.5 text-sm text-zinc-600">{settings.hoursDays}</p>
          </div>

          <div className="px-6 py-5">
            <p className="text-xs font-medium text-zinc-500">Neighborhood Bar</p>
            <p className="mt-1 text-base font-semibold text-zinc-900">
              {settings.address}
            </p>
            <p className="mt-0.5 text-sm text-zinc-600">{settings.cityStateZip}</p>
          </div>

          <div className="px-6 py-5">
            <p className="text-xs font-medium text-zinc-500">On Pour-Over Today</p>
            <p className="mt-1 text-base font-semibold text-zinc-900">
              {settings.roastSpotlight}
            </p>
            <p className="mt-0.5 text-sm text-zinc-600">{settings.roastNotes}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
