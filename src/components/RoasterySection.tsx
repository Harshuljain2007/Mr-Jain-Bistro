import type { ShopSettings } from '../data/coffeeData';

interface RoasterySectionProps {
  settings: ShopSettings;
}

export function RoasterySection({ settings }: RoasterySectionProps) {
  const pillars = [
    {
      index: '01.',
      title: 'Roasted Every Tuesday',
      body: 'We roast washed and honey-processed micro-lots in 12 kg batches on our Loring smart roaster, resting beans for five days before hitting the hopper.',
    },
    {
      index: '02.',
      title: 'Water & Extraction Precision',
      body: 'Every espresso shot and pour-over is brewed with remineralized filtered water balanced for clarity, sweetness, and clean finish.',
    },
    {
      index: '03.',
      title: 'Morning Bakery from Scratch',
      body: 'Our bakers mix naturally leavened croissant dough 72 hours ahead, laminating with cultured farm butter and fresh whole spices.',
    },
  ];

  return (
    <section id="roastery" className="border-b border-zinc-200/80 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <p className="text-xs font-medium tracking-wide text-[#1C4A38] uppercase">
              Our Craft
            </p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-zinc-900 sm:text-4xl text-balance">
              Unhurried coffee, rooted in {settings.neighborhood}.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              {settings.name} brings transparent, lightly roasted coffee and warm morning
              hospitality to {settings.address}. Grab a ceramic mug at the oak counter or
              bring home a freshly bagged 250g box.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 border-t border-zinc-200 pt-8 lg:col-span-7 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12">
            {pillars.map((pillar) => (
              <div key={pillar.index} className="flex flex-col gap-1.5 sm:flex-row sm:gap-5">
                <span className="font-display text-base font-medium text-[#1C4A38] tabular-nums shrink-0">
                  {pillar.index}
                </span>
                <div>
                  <h3 className="font-sans text-base font-semibold text-zinc-900">
                    {pillar.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                    {pillar.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
