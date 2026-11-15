import { Camera, CameraOff, Loader2, ShieldCheck, Video } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Exercise } from "@/lib/pauza/exercises";
import { cn } from "@/lib/utils";

type CamStatus = "idle" | "requesting" | "on" | "denied" | "unsupported" | "error";
type PoseStatus = "off" | "loading" | "ready" | "failed";

// Model + runtime files are fetched once; no camera frames ever leave the device.
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

interface Landmark {
  x: number;
  y: number;
  visibility?: number;
}

function angle(a: Landmark, b: Landmark, c: Landmark) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  if (mag === 0) return 180;
  return (Math.acos(Math.min(1, Math.max(-1, dot / mag))) * 180) / Math.PI;
}

interface PoseLandmarkerLike {
  detectForVideo(video: HTMLVideoElement, ts: number): { landmarks: Landmark[][] };
  close(): void;
}

export function CameraCoach({
  exercise,
  feedbackEnabled,
  onRep,
}: {
  exercise: Exercise;
  feedbackEnabled: boolean;
  onRep: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const landmarkerRef = useRef<PoseLandmarkerLike | null>(null);
  const sessionRef = useRef(0);
  const phaseRef = useRef<"up" | "down">("up");
  const lastRepRef = useRef(0);
  const onRepRef = useRef(onRep);
  onRepRef.current = onRep;

  const [status, setStatus] = useState<CamStatus>("idle");
  const [pose, setPose] = useState<PoseStatus>("off");
  const [feedback, setFeedback] = useState("");
  const [autoStopped, setAutoStopped] = useState(false);

  const useFeedback = feedbackEnabled && !!exercise.counter;

  const stop = useCallback(() => {
    sessionRef.current += 1;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    try {
      landmarkerRef.current?.close();
    } catch {
      /* already closed */
    }
    landmarkerRef.current = null;
    phaseRef.current = "up";
    setPose("off");
    setFeedback("");
    setStatus((s) => (s === "on" || s === "requesting" ? "idle" : s));
  }, []);

  // Never leave the camera running: stop on unmount, tab switch or page hide.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && streamRef.current) {
        stop();
        setAutoStopped(true);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", stop);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", stop);
      stop();
    };
  }, [stop]);

  // Switching exercise turns the camera off so the user consciously re-enables it.
  useEffect(() => {
    stop();
  }, [exercise.id, stop]);

  async function start() {
    setAutoStopped(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    const session = ++sessionRef.current;
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (session !== sessionRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }
      setStatus("on");
      if (useFeedback) void startPose(session);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setStatus(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "error");
    }
  }

  async function startPose(session: number) {
    setPose("loading");
    setFeedback("Načítám rozpoznávání pohybu…");
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
      let landmarker: PoseLandmarkerLike;
      try {
        landmarker = (await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numPoses: 1,
        })) as unknown as PoseLandmarkerLike;
      } catch {
        landmarker = (await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
          runningMode: "VIDEO",
          numPoses: 1,
        })) as unknown as PoseLandmarkerLike;
      }
      if (session !== sessionRef.current) {
        landmarker.close();
        return;
      }
      landmarkerRef.current = landmarker;
      setPose("ready");
      setFeedback("Postavte se tak, aby byly vidět boky, kolena i kotníky.");
      loop(session);
    } catch {
      if (session !== sessionRef.current) return;
      setPose("failed");
      setFeedback("");
    }
  }

  function loop(session: number) {
    let lastTime = -1;
    let lastMsg = "";
    const say = (msg: string) => {
      if (msg !== lastMsg) {
        lastMsg = msg;
        setFeedback(msg);
      }
    };
    const color = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "lime";

    const tick = () => {
      if (session !== sessionRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const lm = landmarkerRef.current;
      if (video && canvas && lm && video.readyState >= 2 && video.currentTime !== lastTime) {
        lastTime = video.currentTime;
        const result = lm.detectForVideo(video, performance.now());
        const points = result.landmarks?.[0];
        const ctx = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        if (!points) {
          say("Nevidím vás – ustupte kousek dál od kamery.");
        } else {
          const pick = (i: number): Landmark => points[i] ?? { x: 0, y: 0, visibility: 0 };
          const left = [pick(23), pick(25), pick(27)] as const;
          const right = [pick(24), pick(26), pick(28)] as const;
          const vis = (arr: readonly Landmark[]) => arr.reduce((s, p) => s + (p?.visibility ?? 0), 0) / 3;
          const side = vis(left) >= vis(right) ? left : right;

          if (ctx) {
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = 6;
            ctx.lineCap = "round";
            for (const chain of [[11, 23, 25, 27], [12, 24, 26, 28]]) {
              ctx.beginPath();
              chain.forEach((idx, i) => {
                const p = pick(idx);
                const x = p.x * canvas.width;
                const y = p.y * canvas.height;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              });
              ctx.stroke();
            }
          }

          if (vis(side) < 0.5) {
            say("Postavte se tak, aby byly vidět boky, kolena i kotníky.");
          } else {
            const knee = angle(side[0], side[1], side[2]);
            if (phaseRef.current === "up") {
              if (knee < 105) {
                phaseRef.current = "down";
                say("Výborně, teď nahoru!");
              } else if (knee < 150) {
                say("Ještě kousek dolů – jen pokud je to pohodlné.");
              } else {
                say("Pomalu se posaďte dozadu…");
              }
            } else if (knee > 155) {
              phaseRef.current = "up";
              const now = performance.now();
              if (now - lastRepRef.current > 600) {
                lastRepRef.current = now;
                onRepRef.current();
                say("Dřep započítán ✓");
              }
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  const on = status === "on";

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-background",
          on ? "border-recording/60" : "border-border",
          on || status === "requesting" ? "aspect-[3/4]" : "hidden",
        )}
      >
        {/* Mirrored preview; frames stay in memory only and are never recorded. */}
        <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover" />
        {status === "requesting" && (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Čekám na povolení kamery…
            </span>
          </div>
        )}
        {on && (
          <>
            <div
              role="status"
              className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-recording px-2.5 py-1 text-xs font-bold text-recording-foreground"
            >
              <span className="h-2 w-2 rounded-full bg-recording-foreground animate-pulse-rec" aria-hidden />
              Kamera zapnutá
            </div>
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden /> Nic se neukládá
            </div>
            <div className="absolute inset-x-3 bottom-3">
              <div className="rounded-xl bg-background/85 px-3 py-2 text-center text-sm font-semibold backdrop-blur" aria-live="polite">
                {useFeedback && pose !== "failed" ? (
                  <span className="flex items-center justify-center gap-2">
                    {pose === "loading" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    {feedback}
                  </span>
                ) : (
                  <span>
                    <span className="mr-1.5 rounded bg-info/15 px-1.5 py-0.5 text-[11px] font-bold text-info">Ruční potvrzení</span>
                    Kamera slouží jako zrcadlo – opakování počítejte tlačítkem níže.
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {on ? (
        <Button variant="recording" size="xl" className="w-full" onClick={stop}>
          <CameraOff /> Vypnout kameru
        </Button>
      ) : status === "requesting" ? (
        <Button variant="calm" size="xl" className="w-full" onClick={stop}>
          Zrušit
        </Button>
      ) : (
        <div className="surface space-y-3 p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-info/15 text-info">
              <Video className="h-5 w-5" aria-hidden />
            </span>
            <div className="text-sm">
              <p className="font-semibold">Volitelná kamera</p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                <li>• Zapne se až po stisknutí tlačítka.</li>
                <li>• Nic se nenahrává, neukládá ani neodesílá.</li>
                <li>
                  •{" "}
                  {!!exercise.counter
                    ? "U dřepů dává orientační zpětnou vazbu přímo v zařízení – nemusí být přesná."
                    : "U tohoto cviku slouží jen jako zrcadlo, dokončení potvrdíte ručně."}
                </li>
              </ul>
            </div>
          </div>
          {status === "denied" && (
            <p className="rounded-lg bg-warning/10 p-2.5 text-xs text-warning">
              Přístup ke kameře nebyl povolen. To je v pořádku – cvičit můžete i bez ní. Povolení lze změnit
              v nastavení prohlížeče.
            </p>
          )}
          {(status === "unsupported" || status === "error") && (
            <p className="rounded-lg bg-warning/10 p-2.5 text-xs text-warning">
              Kameru se nepodařilo spustit (možná ji používá jiná aplikace nebo ji prohlížeč nepodporuje).
              Pokračujte prosím v režimu bez kamery.
            </p>
          )}
          {pose === "failed" && (
            <p className="rounded-lg bg-info/10 p-2.5 text-xs text-info">
              Rozpoznávání pohybu se nenačetlo, používáme ruční potvrzení.
            </p>
          )}
          {autoStopped && (
            <p className="rounded-lg bg-secondary p-2.5 text-xs text-muted-foreground">
              Kamera se vypnula, protože jste opustili stránku.
            </p>
          )}
          <Button variant="soft" size="xl" className="w-full" onClick={start}>
            <Camera /> Zapnout kameru
          </Button>
        </div>
      )}
    </div>
  );
}
