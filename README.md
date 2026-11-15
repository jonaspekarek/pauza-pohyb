# Pauza & Pohyb

Build a polished, mobile-first Czech-language app prototype called „Pauza & Pohyb“ for reducing time spent in distracting apps by pairing screen-time limits with short movement breaks.

IMPORTANT PLATFORM REALITY: This Lovable project is a web app/PWA prototype. Do not claim it can monitor or block arbitrary apps installed on Android/iOS. Explain this limitation clearly in the UI/help section. Structure the app so a future native Android app could use Android UsageStats/Accessibility APIs with explicit user-granted permissions; iOS has stricter Screen Time/FamilyControls entitlements. For this web prototype, app selection and limits should be clearly marked as a simulation/demo, not actual system-wide tracking or blocking.

CORE EXPERIENCE:
- Beautiful responsive mobile dashboard in Czech.
- User can create a rule for an app (choose from common apps such as TikTok, Instagram, YouTube, Roblox, Chrome, games, or enter a custom name), set a daily limit in minutes, and choose what happens when it expires.
- Show configured rules, today's simulated usage, remaining time, and progress bars. Persist settings locally.
- When a demo limit expires, show a friendly movement-break screen with the exercise the user selected. Include selectable exercises such as dřepy, jumping jacks, plank, wall push-ups, and stretching, with sensible beginner-friendly duration/repetition targets and a skip/pause option for discomfort or safety. Never shame or punish the user.
- Include an optional camera-based exercise demo: ask permission only after a clear user action; show a visible camera preview and clear camera-on indicator; do not record, upload, or store video/images. If feasible, use on-device pose landmarks to give simple feedback for one exercise (e.g. squat movement), otherwise provide a camera preview with a clearly labelled manual confirmation mode. Camera must be stoppable instantly and must never turn on in the background. Do not claim perfect exercise verification.
- Add a no-camera/manual completion option. Do not require camera use.
- Add onboarding/help explaining prototype limitations and privacy.

DESIGN: modern friendly fitness/productivity app, dark navy/charcoal background with vivid lime accent, clean cards, large readable timer, subtle motion, accessible contrast, Czech copy. Use shadcn/ui components and lucide icons. Make the app feel like a real usable prototype, not a landing page. Include navigation tabs: Přehled, Limity, Cvičení, Nastavení. Seed a few demo rules and sample usage so the UI is immediately explorable.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/58462ce3-d7fb-4f79-b8bd-af13bc64c869).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
