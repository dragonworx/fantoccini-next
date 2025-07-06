import { Sprite } from "../sprite";

export interface SceneOptions {
  root?: Sprite;
  frameRate?: number; // frames per second, default 60
}

export class Scene {
  root: Sprite;
  private _frameRate: number;
  private _running: boolean = false;
  private _lastFrameTime: number = 0;
  private _frameRequest: number | null = null;

  constructor(options: SceneOptions = {}) {
    this.root = options.root || new Sprite();
    this._frameRate = options.frameRate ?? 60;
  }

  get frameRate() {
    return this._frameRate;
  }

  set frameRate(rate: number) {
    this._frameRate = Math.max(1, rate);
  }

  start() {
    if (!this._running) {
      this._running = true;
      this._lastFrameTime = performance.now();
      this._frameRequest = requestAnimationFrame(this._frameLoop);
    }
  }

  stop() {
    this._running = false;
    if (this._frameRequest !== null) {
      cancelAnimationFrame(this._frameRequest);
      this._frameRequest = null;
    }
  }

  private _frameLoop = (now: number) => {
    if (!this._running) return;
    const minFrameTime = 1000 / this._frameRate;
    if (now - this._lastFrameTime >= minFrameTime) {
      this._lastFrameTime = now;
      this.update();
    }
    this._frameRequest = requestAnimationFrame(this._frameLoop);
  };

  /**
   * Recursively updates all dirty sprites in the scene graph.
   */
  update() {
    this._updateSpriteRecursive(this.root);
  }

  private _updateSpriteRecursive(sprite: Sprite) {
    if (sprite.dirty) {
      sprite.updateStyle();
    }
    // If Sprite supports children, walk them here.
    // For now, check if sprite.children exists and is iterable.
    const children = (sprite as any).children;
    if (Array.isArray(children)) {
      for (const child of children) {
        this._updateSpriteRecursive(child);
      }
    }
  }
}
