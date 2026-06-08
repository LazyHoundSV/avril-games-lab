export class ColorBasketGardenAudio {
  private audioContext?: AudioContext;
  private completionSpeechTimer?: number;

  prepare(): void {
    const context = this.getAudioContext();

    if (!context) {
      return;
    }

    this.resumeContext(context);
    this.playUnlockPulse(context);
  }

  speak(phrase: string): void {
    this.prepare();

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

  speakCompletionPraise(): void {
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

  private playUnlockPulse(context: AudioContext): void {
    const startTime = context.currentTime + 0.01;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(440, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.03);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.04);
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
