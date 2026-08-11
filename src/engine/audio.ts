/** BGM / SE 再生。アセットは必ずマニフェスト経由で解決する。 */

import { resolveAsset } from './assets';

export class AudioPlayer {
  private bgmEl: HTMLAudioElement | null = null;
  private retiringBgm: HTMLAudioElement | null = null;
  private readonly fades = new Map<HTMLAudioElement, number>();
  private currentBgmId: string | null = null;
  private bgmVolume = 0.6;
  private seVolume = 0.7;
  private readonly bgmFadeMs = 500;
  /** 無音プレースホルダ等で再生に失敗しても停止しないよう握り潰す。 */
  private safePlay(el: HTMLAudioElement): void {
    void el.play().catch(() => undefined);
  }

  setVolumes(bgm: number, se: number): void {
    this.bgmVolume = bgm;
    this.seVolume = se;
    if (this.bgmEl) this.bgmEl.volume = bgm;
  }

  get playingBgm(): string | null {
    return this.currentBgmId;
  }

  playBgm(id: string | null): void {
    if (id === this.currentBgmId) return;
    const outgoing = this.bgmEl;
    if (this.retiringBgm) this.pauseBgm(this.retiringBgm);
    this.currentBgmId = id;
    this.bgmEl = null;
    if (!id) {
      if (outgoing) this.pauseBgm(outgoing);
      return;
    }

    const url = resolveAsset(id);
    if (!url) {
      if (outgoing) this.pauseBgm(outgoing);
      return;
    }

    const el = new Audio(url);
    el.loop = true;
    el.volume = 0;
    this.bgmEl = el;
    this.safePlay(el);
    this.fade(el, 0, this.bgmVolume);

    if (outgoing) {
      this.retiringBgm = outgoing;
      this.fade(outgoing, outgoing.volume, 0, () => {
        this.pauseBgm(outgoing);
        if (this.retiringBgm === outgoing) this.retiringBgm = null;
      });
    }
  }

  stopBgm(): void {
    if (this.bgmEl) this.pauseBgm(this.bgmEl);
    if (this.retiringBgm) this.pauseBgm(this.retiringBgm);
    this.bgmEl = null;
    this.retiringBgm = null;
    this.currentBgmId = null;
  }

  playSe(id: string): void {
    const url = resolveAsset(id);
    if (!url) return;
    const el = new Audio(url);
    el.volume = this.seVolume;
    this.safePlay(el);
  }

  private fade(el: HTMLAudioElement, from: number, to: number, onComplete?: () => void): void {
    this.cancelFade(el);
    const startedAt = performance.now();
    el.volume = from;
    const handle = window.setInterval(() => {
      const progress = Math.min((performance.now() - startedAt) / this.bgmFadeMs, 1);
      el.volume = from + (to - from) * progress;
      if (progress === 1) {
        this.cancelFade(el);
        onComplete?.();
      }
    }, 25);
    this.fades.set(el, handle);
  }

  private cancelFade(el: HTMLAudioElement): void {
    const handle = this.fades.get(el);
    if (handle !== undefined) window.clearInterval(handle);
    this.fades.delete(el);
  }

  private pauseBgm(el: HTMLAudioElement): void {
    this.cancelFade(el);
    el.pause();
    el.currentTime = 0;
  }
}
