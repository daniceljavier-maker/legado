"use client";

/**
 * Voz y oído de Julián, versión provisional.
 * - hablar(): usa la voz del navegador hasta que llegue ElevenLabs (LG-022).
 * - Oido: nivel del micrófono con Web Audio para que la persona vea que se la oye.
 * No se graba ni se envía nada.
 */

export function hablar(texto: string, alTerminar?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    alTerminar?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "es-ES";
  u.rate = 0.9;
  u.pitch = 0.95;
  const voces = synth.getVoices().filter((v) => v.lang.startsWith("es"));
  const preferida =
    voces.find((v) => /es-(ES|MX)/i.test(v.lang) && /male|hombre|jorge|diego|pablo|enrique|carlos|juan/i.test(v.name)) ??
    voces.find((v) => /es-(ES|MX)/i.test(v.lang)) ??
    voces[0];
  if (preferida) u.voice = preferida;
  u.onend = () => alTerminar?.();
  u.onerror = () => alTerminar?.();
  synth.speak(u);
}

export function callar() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export class Oido {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private datos: Uint8Array<ArrayBuffer> | null = null;

  async abrir(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.ctx = new AudioContext();
      const src = this.ctx.createMediaStreamSource(this.stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.datos = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
      src.connect(this.analyser);
      return true;
    } catch {
      return false;
    }
  }

  /** 0–1, suavizado por quien lo pinte. */
  nivel(): number {
    if (!this.analyser || !this.datos) return 0;
    this.analyser.getByteTimeDomainData(this.datos);
    let suma = 0;
    for (let i = 0; i < this.datos.length; i++) {
      const v = (this.datos[i] - 128) / 128;
      suma += v * v;
    }
    const rms = Math.sqrt(suma / this.datos.length);
    return Math.min(1, rms * 4);
  }

  cerrar() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close().catch(() => undefined);
    this.stream = null;
    this.ctx = null;
    this.analyser = null;
  }
}
