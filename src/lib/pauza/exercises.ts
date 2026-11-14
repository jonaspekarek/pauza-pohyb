import { Hand, PersonStanding, Timer, Wind, Zap, type LucideIcon } from "lucide-react";
import type { ExerciseId } from "./types";

export interface Exercise {
  id: ExerciseId;
  name: string;
  short: string;
  /** "reps" = count repetitions, "time" = hold/perform for seconds. */
  kind: "reps" | "time";
  target: number;
  icon: LucideIcon;
  steps: string[];
  easier: string;
  safety: string;
  /** On-device camera feedback is available (orientation only). */
  cameraFeedback: boolean;
}

export const EXERCISES: Exercise[] = [
  {
    id: "drepy",
    name: "Dřepy",
    short: "10 pomalých dřepů",
    kind: "reps",
    target: 10,
    icon: PersonStanding,
    steps: [
      "Postavte se, chodidla na šířku ramen.",
      "Pomalu se posaďte dozadu, jako byste si sedali na židli.",
      "Kolena míří stejným směrem jako špičky, záda rovná.",
      "Zatlačte patami a vraťte se nahoru.",
    ],
    easier: "Dřep na židli: sedněte si a zase vstaňte, klidně s oporou rukou.",
    safety: "Jděte jen tak hluboko, jak je vám to příjemné. Bolest kolen = stop.",
    cameraFeedback: true,
  },
  {
    id: "jumping-jacks",
    name: "Jumping jacks",
    short: "30 s skoků roznožmo",
    kind: "time",
    target: 30,
    icon: Zap,
    steps: [
      "Stoj spatný, ruce podél těla.",
      "Výskokem roznožte a ruce zvedněte nad hlavu.",
      "Výskokem se vraťte zpět.",
      "Držte vlastní tempo, dýchejte plynule.",
    ],
    easier: "Bez skákání: střídavě vykročte do strany a zvedněte ruce.",
    safety: "Potřebujete pevnou obuv nebo měkký povrch a dost místa kolem sebe.",
    cameraFeedback: false,
  },
  {
    id: "plank",
    name: "Plank",
    short: "Výdrž 20 s",
    kind: "time",
    target: 20,
    icon: Timer,
    steps: [
      "Opřete se o předloktí, lokty pod rameny.",
      "Natáhněte nohy, tělo tvoří rovnou linii.",
      "Zpevněte břicho, nepropadejte se v bedrech.",
      "Dýchejte, nezadržujte dech.",
    ],
    easier: "Plank na kolenou nebo s rukama opřenýma o stůl.",
    safety: "Při bolesti zad okamžitě přestaňte a zkuste lehčí variantu.",
    cameraFeedback: false,
  },
  {
    id: "kliky-o-zed",
    name: "Kliky o zeď",
    short: "10 kliků o zeď",
    kind: "reps",
    target: 10,
    icon: Hand,
    steps: [
      "Postavte se asi krok od zdi.",
      "Dlaně opřete o zeď ve výšce ramen.",
      "Pokrčte lokty a přibližte hrudník ke zdi.",
      "Odtlačte se zpět do výchozí pozice.",
    ],
    easier: "Stoupněte si blíž ke zdi – čím blíž, tím snazší.",
    safety: "Zkontrolujte, že vám nekloužou nohy ani dlaně.",
    cameraFeedback: false,
  },
  {
    id: "protazeni",
    name: "Protažení",
    short: "60 s protažení",
    kind: "time",
    target: 60,
    icon: Wind,
    steps: [
      "Pomalu kružte rameny dozadu (5×).",
      "Natáhněte ruce nad hlavu a protáhněte se do výšky.",
      "Lehce ukloňte hlavu k jednomu a pak druhému rameni.",
      "Předkloňte se s pokrčenými koleny a nechte paže volně viset.",
    ],
    easier: "Protažení vsedě na židli – ramena, krk a zápěstí.",
    safety: "Protahujte se jemně, bez hmitání a bez bolesti.",
    cameraFeedback: false,
  },
];

export function getExercise(id: string | undefined): Exercise {
  return EXERCISES.find((e) => e.id === id) ?? EXERCISES[0]!;
}

export function exerciseTargetLabel(e: Exercise): string {
  return e.kind === "reps" ? `${e.target} opakování` : `${e.target} s`;
}
