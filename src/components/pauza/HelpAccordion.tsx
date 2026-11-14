import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ITEMS = [
  {
    id: "jak",
    title: "Jak Pauza & Pohyb funguje",
    body: (
      <>
        <p>
          Nastavíte si denní limit pro aplikace, které vás nejvíc pohlcují. Když limit vyprší, místo výčitek
          přijde krátká pohybová pauza – pár dřepů, protažení nebo plank. Po dokončení můžete získat pár
          bonusových minut.
        </p>
        <p>Nikdy vás netrestáme. Pauzu můžete kdykoli přeskočit nebo pozastavit.</p>
      </>
    ),
  },
  {
    id: "omezeni",
    title: "Co tento prototyp neumí",
    body: (
      <>
        <p>
          Jde o <strong>webový prototyp</strong>. Prohlížeč z bezpečnostních důvodů nevidí, jaké jiné aplikace
          v telefonu používáte, a nemůže je blokovat.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Čas v aplikacích je <strong>simulovaný</strong> – přidáváte ho ručně nebo spuštěním simulace.</li>
          <li>Obrazovka s pauzou se zobrazí jen tady v aplikaci, ne nad TikTokem či jinou aplikací.</li>
          <li>Režim „Konec na dnešek“ je ukázka – nic se skutečně nezamyká.</li>
        </ul>
      </>
    ),
  },
  {
    id: "nativni",
    title: "Jak by fungovala nativní verze",
    body: (
      <>
        <p>
          <strong>Android:</strong> nativní aplikace by mohla číst čas v aplikacích přes systémové rozhraní
          UsageStats. Oprávnění „Přístup k údajům o využití“ musíte sami povolit v nastavení telefonu. Pro
          zobrazení pauzy při otevření aplikace by mohla volitelně použít službu Usnadnění – vždy jen s vaším
          výslovným souhlasem a s možností ho kdykoli odvolat.
        </p>
        <p>
          <strong>iOS:</strong> Apple umožňuje limity jen přes rozhraní Čas u obrazovky (FamilyControls,
          DeviceActivity). To vyžaduje speciální oprávnění schválené Applem a váš souhlas; blokační obrazovky
          zobrazuje systém.
        </p>
      </>
    ),
  },
  {
    id: "soukromi",
    title: "Soukromí a data",
    body: (
      <>
        <p>
          Všechna nastavení, limity a historie pauz se ukládají <strong>jen v tomto prohlížeči na tomto
          zařízení</strong>. Nemáte účet a nic se neodesílá na server.
        </p>
        <p>Data smažete tlačítkem „Obnovit ukázková data“ nebo vymazáním dat prohlížeče.</p>
      </>
    ),
  },
  {
    id: "kamera",
    title: "Kamera je volitelná",
    body: (
      <>
        <ul className="list-disc space-y-1 pl-5">
          <li>Zapne se až po stisknutí tlačítka „Zapnout kameru“, nikdy na pozadí.</li>
          <li>Vždy vidíte náhled a červený ukazatel „Kamera zapnutá“. Vypnout ji jde jedním dotykem.</li>
          <li>Video ani fotky se nenahrávají, neukládají ani neodesílají.</li>
          <li>
            U dřepů může běžet rozpoznání pohybu přímo v zařízení. Stahuje se jen model (soubor od Googlu),
            žádný obraz neopouští telefon.
          </li>
          <li>Rozpoznání je orientační a může se mýlit. Cvik vždy můžete potvrdit ručně.</li>
          <li>Když stránku opustíte nebo přepnete aplikaci, kamera se sama vypne.</li>
        </ul>
      </>
    ),
  },
  {
    id: "bezpecnost",
    title: "Bezpečnost při cvičení",
    body: (
      <>
        <p>
          Cviky jsou nastavené pro začátečníky a u každého najdete lehčí variantu. Pokud ucítíte bolest,
          závrať nebo dušnost, přestaňte – tlačítko „Necítím se dobře“ je tu přesně pro to.
        </p>
        <p>Aplikace nenahrazuje radu lékaře ani fyzioterapeuta.</p>
      </>
    ),
  },
];

export function HelpAccordion({ defaultOpen }: { defaultOpen?: string }) {
  return (
    <Accordion type="single" collapsible {...(defaultOpen ? { defaultValue: defaultOpen } : {})} className="surface px-4">
      {ITEMS.map((item) => (
        <AccordionItem key={item.id} value={item.id} className="last:border-b-0">
          <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">{item.title}</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground">
            {item.body}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
