// The one master clock for the whole opening (globe → port story → hero), in wall seconds.
// Advanced only by the stage's frame loop; everything else reads `T`.
export class MasterClock {
  T = 0;
  playing = true;
  /** When set, time may not pass this point (e.g. the 3D scene is still loading). */
  holdAt: number | null = null;

  tick(dt: number) {
    if (!this.playing) return;
    const next = this.T + dt;
    this.T = this.holdAt !== null && this.T <= this.holdAt ? Math.min(next, this.holdAt) : next;
  }

  seek(T: number) {
    this.T = T;
  }
}
