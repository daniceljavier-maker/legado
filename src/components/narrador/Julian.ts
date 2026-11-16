"use client";

import { ECOS, texto, type Pais } from "@/lib/guion";

/**
 * Voz y oído de Julián.
 * - decir(): reproduce el audio pregrabado (ElevenLabs: Leo para México, Rafa para España).
 *   Si el audio no carga, cae a la voz del navegador para no dejar a la persona en silencio.
 * - Oido: nivel del micrófono con Web Audio. No se graba ni se envía nada.
 */

let el: HTMLAudioElement | null = null;
let ultimoEco = "";

function audio(): HTMLAudioElement {
  // Un único elemento: en iOS solo se puede reproducir tras un gesto del usuario,
  // y reutilizarlo permite encadenar audios sin nuevos gestos.
  if (!el) {
    el = new Audio();
    el.preload = "auto";
  }
  return el;
}

function hablarNavegador(txt: string, pais: Pais, alTerminar: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !txt) {
    alTerminar();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(txt);
  u.lang = pais === "mx" ? "es-MX" : "es-ES";
  u.rate = 0.92;
  u.onend = alTerminar;
  u.onerror = alTerminar;
  synth.speak(u);
}

/** Reproduce una línea del guion. `alTerminar` se llama una sola vez. */
export function decir(pais: Pais, id: string, alTerminar?: () => void) {
  const a = audio();
  callar();
  let hecho = false;
  const fin = () => {
    if (hecho) return;
    hecho = true;
    alTerminar?.();
  };
  const respaldo = () => hablarNavegador(texto(pais, id), pais, fin);
  a.onended = fin;
  a.onerror = respaldo;
  a.src = `/narrador/voz/${pais}/${id}.mp3`;
  a.play().catch(respaldo);
}

/** Reproduce varias líneas seguidas. */
export function secuencia(pais: Pais, ids: string[], alTerminar?: () => void) {
  const [primero, ...resto] = ids;
  if (!primero) {
    alTerminar?.();
    return;
  }
  decir(pais, primero, resto.length ? () => secuencia(pais, resto, alTerminar) : alTerminar);
}

/** Un «mmm, qué bonito» al azar, distinto del anterior. */
export function ecoAlAzar(): string {
  const opciones = ECOS.filter((e) => e !== ultimoEco);
  ultimoEco = opciones[Math.floor(Math.random() * opciones.length)];
  return ultimoEco;
}

export function callar() {
  if (el) {
    el.onended = null;
    el.onerror = null;
    el.pause();
  }
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
