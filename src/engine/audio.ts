/** BGM / SE 再生。アセットは必ずマニフェスト経由で解決する。 */

import { resolveAsset } from './assets';

export class AudioPlayer {
  private bgmEl: HTMLAudioElement | null = null;
  private currentBgmId: string | null = null;
  private bgmVolume = 0.6;
  private seVolume = 0.7;
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
    this.stopBgm();
    this.currentBgmId = id;
    if (!id) return;

    const url = resolveAsset(id);
    if (!url) return;

    const el = new Audio(url);
    el.loop = true;
    el.volume = this.bgmVolume;
    this.bgmEl = el;
    this.safePlay(el);
  }

  stopBgm(): void {
    if (this.bgmEl) {
      this.bgmEl.pause();
      this.bgmEl = null;
    }
    this.currentBgmId = null;
  }

  playSe(id: string): void {
    const url = resolveAsset(id);
    if (!url) return;
    const el = new Audio(url);
    el.volume = this.seVolume;
    this.safePlay(el);
  }
}
