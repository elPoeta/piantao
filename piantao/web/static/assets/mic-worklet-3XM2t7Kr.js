// AudioWorklet: baja el microfono a 16 kHz mono (promedio ponderado por area, que ademas filtra lo agudo) y lo entrega
// en bloques de 30 ms (480 muestras int16) junto con su nivel RMS. No guarda nada.
class MicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.acc = 0;
    this.filled = 0;
    this.n = 0;
    this.buf = new Int16Array(480);
    this.sumSq = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      let w = 1;
      while (w > 1e-9) {
        const take = Math.min(w, this.ratio - this.filled);
        this.acc += ch[i] * take;
        this.filled += take;
        w -= take;
        if (this.filled >= this.ratio - 1e-9) {
          const v = Math.max(-1, Math.min(1, this.acc / this.ratio));
          this.buf[this.n++] = Math.round(v * 32767);
          this.sumSq += v * v;
          this.acc = 0;
          this.filled = 0;
          if (this.n === this.buf.length) {
            const level = Math.sqrt(this.sumSq / this.n);
            this.port.postMessage({ pcm: this.buf.buffer, level }, [this.buf.buffer]);
            this.buf = new Int16Array(480);
            this.n = 0;
            this.sumSq = 0;
          }
        }
      }
    }
    return true;
  }
}
registerProcessor("mic-processor", MicProcessor);
