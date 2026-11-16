# Pauza & Pohyb – varianta C: web pro správu + nativní Android aplikace

Cíl: web zůstane „ovládacím panelem“ (účet, limity, cviky, statistiky). Skutečné měření času v aplikacích a zobrazení pauzy po překročení limitu zajistí samostatná Android aplikace. iOS zatím ne.

## 1) Co zůstane ve webové aplikaci (Lovable)
- Přihlášení a účet (e-mail, případně Google).
- Správa pravidel: aplikace, denní limit, akce po vypršení (připomínka / pohybová pauza / konec na dnešek), cvik a počet opakování.
- Katalog cviků, nastavení odměny (bonusové minuty), jazyk (CZ/EN/ES).
- Statistiky: čas v aplikacích za den/týden (z dat, která pošle telefon), dokončené pauzy, série dnů.
- Seznam spárovaných telefonů a možnost je odpojit.
- Export a smazání všech dat.
- Web sám nikdy nic neměří ani neblokuje – jen zobrazuje, co pošle telefon. Bez telefonu dál funguje simulace (stávající simulovaný UsageProvider), jasně označená jako demo.
- Odstraní se BMI, váha, graf váhy a kalorie (požadavek: žádné zdravotní funkce).

## 2) Co musí být v Android aplikaci (Kotlin + Jetpack Compose, Android Studio)
- Přihlášení stejným účtem, stažení pravidel.
- Seznam skutečně nainstalovaných aplikací (PackageManager) – výběr se pošle na web, takže web pak ukazuje opravdové aplikace z telefonu.
- Měření: UsageStatsManager (queryEvents) po udělení oprávnění „Přístup k údajům o využití“. Uživatel ho zapíná sám v systémovém nastavení; aplikace vysvětlí proč, dřív než ho otevře.
- Kontrola v popředí: krátký periodický dotaz (cca každých 15–30 s) běžící jen ve viditelné službě na popředí s trvalou notifikací „Pauza & Pohyb hlídá vaše limity“. Žádné skryté běžení.
- Po překročení limitu – tři úrovně, od nejbezpečnější:
  1. Notifikace s plnou obrazovkou (full-screen intent) „Čas vypršel“ → otevře vlastní obrazovku pauzy. Toto je výchozí řešení.
  2. Překryvné okno (SYSTEM_ALERT_WINDOW, „Zobrazovat přes ostatní aplikace“) – volitelné, uživatel zapíná ručně.
  3. Accessibility služba – NEPOUŽÍVAT v MVP. Google Play ji povoluje jen pro účely přístupnosti nebo s výslovným prohlášením a kontrolou; riziko zamítnutí je vysoké.
- Obrazovka pauzy: velký nápis, cvik a počet opakování, tlačítka „Začít cvičit“, „Hotovo ručně“, „Ignorovat pro dnešek“ a vždy viditelné „Přerušit (nouze)“.
- Kamera (volitelně): CameraX + ML Kit Pose Detection přímo v telefonu, zapne se až po stisku tlačítka, viditelný indikátor, nic se neukládá ani neodesílá, okamžité vypnutí.
- Offline fronta: měření a pauzy se ukládají lokálně (Room) a odešlou se, až bude internet.
- Spuštění po restartu (BOOT_COMPLETED) – jen pokud uživatel ochranu zapnul.

## 3) Bezpečná synchronizace web ↔ Android
- Backend: Lovable Cloud (databáze + přihlašování). Android používá stejné přihlášení přes oficiální klientskou knihovnu; žádné tajné klíče v aplikaci, jen veřejný klíč.
- Řádkové zabezpečení: každý vidí jen svá data.
- Datový model (zjednodušeně):
  - profiles (jméno, jazyk, odměna v minutách)
  - devices (telefon, název, poslední synchronizace, verze aplikace)
  - rules (balíček aplikace, název, limit, akce, cvik, cíl, zapnuto, updated_at)
  - installed_apps (zařízení, balíček, název) – jen na vyžádání uživatele
  - daily_usage (zařízení, balíček, den, minuty) – jen souhrny za den, žádná historie otevírání
  - day_overrides (pravidlo, den, „ignorováno“, bonusové minuty)
  - break_logs (čas, cvik, režim ruční/kamera, dokončeno, počet)
- Směr dat: pravidla vytváří web i telefon; měření posílá jen telefon.
- Konflikty: u pravidel vyhrává novější updated_at; minuty za den se neslučují sčítáním, telefon posílá vždy celkový stav dne (bezpečné při opakovaném odeslání); záznamy pauz mají unikátní ID vytvořené v telefonu, takže se neduplikují.
- Offline: telefon vždy rozhoduje podle poslední stažené verze pravidel; web ukazuje „naposledy synchronizováno před X min“.
- Soukromí: nesbírá se obsah aplikací, poloha, obrázky ani video. Data se dají exportovat a smazat; odpojení zařízení smaže jeho tokeny.

## 4) Limity platformy (poctivě)
- UsageStats jen měří, neumí nic zablokovat a data přicházejí se zpožděním několika sekund.
- Spolehlivé „tvrdé“ zablokování libovolné aplikace běžná aplikace z Google Play neumí. Uživatel může pauzu vždy obejít (vypnout oprávnění, ukončit službu, odinstalovat). To je v pořádku – aplikace je pomocník, ne zámek.
- Výrobci (Xiaomi, Samsung, Huawei) agresivně ukončují aplikace na pozadí – je nutné vést uživatele k výjimce z optimalizace baterie.
- Google Play vyžaduje: zásady ochrany soukromí, formulář o datové bezpečnosti, zdůvodnění služby na popředí, u overlay/accessibility další prohlášení.
- Rodičovské hlídání cizího telefonu není cílem (vyžadovalo by Device Admin/Family Link – mimo rozsah).
- iOS: vyžaduje speciální oprávnění Apple (Family Controls) – samostatný budoucí projekt.

## 5) Testování na telefonu
- Min. 3 zařízení: Pixel (čistý Android 13+), Samsung, Xiaomi; Android 10 jako nejnižší verze.
- Checklist:
  - oprávnění nezapnuto → aplikace srozumitelně vysvětlí a nic neměří
  - oprávnění odebráno za běhu → upozornění, žádný pád
  - limit 1 min u testovací aplikace → do 30 s se zobrazí pauza
  - „Ignorovat pro dnešek“ a reset o půlnoci
  - nouzové přerušení funguje vždy
  - restart telefonu → služba se obnoví (pokud zapnuto)
  - režim letadlo → data se uloží a odešlou později bez duplikátů
  - baterie: 24 h provozu, cíl < 2–3 % spotřeby (Android Studio Profiler, Battery Historian)
  - odinstalace → nic nezůstane běžet; na webu jde zařízení odpojit a data smazat
  - kamera: zapne se jen po stisku, indikátor viditelný, vypnutí okamžité
- Interní testování přes Google Play Console (interní test) před veřejným vydáním.

## 6) Bezpečnost uživatele
- Vždy dostupné „Přerušit (nouze)“ a „Necítím se dobře“ – bez trestu, bez zahanbování.
- Kamera jen po výslovném stisku, viditelný indikátor, žádný záznam, žádný upload.
- Žádné BMI, váha ani kalorie.
- Notifikace na popředí vždy viditelná, dokud ochrana běží.

## Fáze
1. **Web – příprava (Lovable, ~1 týden):** zapnout Lovable Cloud, přihlášení, tabulky a zabezpečení, převod lokálních dat do databáze, odstranění BMI/váhy/kalorií, stránka „Zařízení“ a párování kódem.
2. **Android MVP (Android Studio, ~2–3 týdny):** přihlášení, stažení pravidel, oprávnění UsageStats, služba na popředí, měření, full-screen notifikace s obrazovkou pauzy, ruční dokončení, nouzové přerušení, odesílání souhrnů.
3. **Synchronizace a offline (~1 týden):** Room fronta, řešení konfliktů, výpis nainstalovaných aplikací na web, statistiky na webu ze skutečných dat.
4. **Kamera na Androidu (~1–2 týdny):** CameraX + ML Kit, dřepy/kliky, stejná pravidla soukromí.
5. **Volitelné overlay + vydání (~1–2 týdny):** překryvné okno jako volba, testy na zařízeních, Play Console, zásady soukromí.

## Nejmenší smysluplné MVP
- Web: přihlášení, pravidla (aplikace + limit + cvik + počet), seznam zařízení, denní statistika.
- Android: přihlášení, oprávnění UsageStats, viditelná služba, při překročení full-screen notifikace „Čas vypršel“ → obrazovka s cvikem, „Hotovo“ (ruční), „Ignorovat pro dnešek“, „Přerušit“. Bez kamery, bez overlay, bez accessibility.

## Co udělám v Lovable vs. co vznikne zvlášť
- **V Lovable:** celý web, Lovable Cloud (databáze, přihlášení, zabezpečení), datový model, API pro telefon, statistiky, odstranění zdravotních funkcí, texty pro zásady soukromí.
- **Zvlášť v Android Studiu (Kotlin):** celá Android aplikace – měření, služba, notifikace, obrazovka pauzy, kamera, offline ukládání, publikace na Google Play. Lovable Android kód sestavit ani spustit neumí; mohu ale připravit popis API a ukázky kódu.

## Technické poznámky
- Android: minSdk 29, targetSdk aktuální; oprávnění PACKAGE_USAGE_STATS, FOREGROUND_SERVICE (typ specialUse s odůvodněním), POST_NOTIFICATIONS, USE_FULL_SCREEN_INTENT (na Android 14+ omezené – fallback na heads-up notifikaci), RECEIVE_BOOT_COMPLETED, CAMERA (jen fáze 4), SYSTEM_ALERT_WINDOW (jen fáze 5).
- Detekce aplikace v popředí: UsageEvents ACTIVITY_RESUMED/PAUSED, počítání vlastním součtem intervalů.
- Plánování: služba na popředí pro hlídání + WorkManager pro synchronizaci.
- Klient: supabase-kt (auth + postgrest), tokeny v EncryptedSharedPreferences/DataStore.
- Web: stávající UsageProvider rozšířit o „cloudový“ provider čtoucí daily_usage; simulace zůstane pro demo.
