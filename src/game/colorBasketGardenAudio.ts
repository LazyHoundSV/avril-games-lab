export class ColorBasketGardenAudio {
  private audioContext?: AudioContext;
  private completionSpeechTimer?: number;

  speak(phrase: string): void {
    const speechSynthesis = this.getSpeechSynthesis();
    const Utterance = this.getSpeechSynthesisUtterance();

    if (!speechSynthesis || !Utterance) {
      return;
    }

    speechSynthesis.cancel();

    const utterance = new Utterance(phrase);
    utterance.lang = "en-US";
    utterance.rate = 0.88;
    utterance.pitch = 1.18;
    utterance.volume = 1;

    speechSynthesis.speak(utterance);
  }

  playDropChime(): void {
    const context = this.getAudioContext();

    if (!context) {
      return;
    }

    this.resumeContext(context);

    const startTime = context.currentTime + 0.01;
    this.playTone(context, 659.25, startTime, 0.13, 0.12);
    this.playTone(context, 987.77, startTime + 0.08, 0.16, 0.1);
  }

  playCompletionCelebration(): void {
    const context = this.getAudioContext();

    if (context) {
      this.resumeContext(context);
      this.playClapBurst(context);
      this.playTone(context, 783.99, context.currentTime + 0.2, 0.16, 0.12);
      this.playTone(context, 1046.5, context.currentTime + 0.32, 0.22, 0.1);
    }

    this.clearCompletionSpeechTimer();
    this.completionSpeechTimer = window.setTimeout(() => {
      this.completionSpeechTimer = undefined;
      this.speak("Yay! Well done!");
    }, 430);
  }

  cleanup(): void {
    this.clearCompletionSpeechTimer();
    this.getSpeechSynthesis()?.cancel();
  }

  private getAudioContext(): AudioContext | undefined {
    if (this.audioContext) {
      return this.audioContext;
    }

    const AudioContextConstructor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextConstructor) {
      return undefined;
    }

    try {
      this.audioContext = new AudioContextConstructor();
      return this.audioContext;
    } catch {
      return undefined;
    }
  }

  private resumeContext(context: AudioContext): void {
    if (context.state === "suspended") {
      void context.resume().catch(() => {
        // Some browsers only allow audio resume during a trusted interaction.
      });
    }
  }

  private playTone(
    context: AudioContext,
    frequency: number,
    startTime: number,
    duration: number,
    peakVolume: number,
  ): void {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakVolume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }

  private playClapBurst(context: AudioContext): void {
    const startTime = context.currentTime + 0.02;

    for (let i = 0; i < 3; i += 1) {
      this.playNoisePop(context, startTime + i * 0.09);
    }
  }

  private playNoisePop(context: AudioContext, startTime: number): void {
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.045), context.sampleRate);
    const samples = buffer.getChannelData(0);

    for (let i = 0; i < samples.length; i += 1) {
      samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    source.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.setValueAtTime(900, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.05);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start(startTime);
  }

  private getSpeechSynthesis(): SpeechSynthesis | undefined {
    return "speechSynthesis" in window ? window.speechSynthesis : undefined;
  }

  private getSpeechSynthesisUtterance(): typeof SpeechSynthesisUtterance | undefined {
    return "SpeechSynthesisUtterance" in window ? window.SpeechSynthesisUtterance : undefined;
  }

  private clearCompletionSpeechTimer(): void {
    if (this.completionSpeechTimer !== undefined) {
      window.clearTimeout(this.completionSpeechTimer);
      this.completionSpeechTimer = undefined;
    }
  }
}
