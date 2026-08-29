/**
 * Web Speech API Voice Dictation Utility for Construction Site & Daily Logs
 */

export interface SpeechDictationCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

export class SpeechDictationHelper {
  private recognition: any = null;
  private isListening = false;

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  public start(callbacks: SpeechDictationCallbacks, lang = 'de-DE'): boolean {
    if (!this.isSupported()) {
      callbacks.onError('Spracherkennung wird von diesem Browser nicht unterstützt');
      return false;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = lang;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          callbacks.onResult(finalTranscript, true);
        } else if (interimTranscript) {
          callbacks.onResult(interimTranscript, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        callbacks.onError(event.error || 'Fehler bei der Spracherkennung');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        callbacks.onEnd();
      };

      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err: any) {
      callbacks.onError(err?.message || 'Fehler beim Starten der Spracherkennung');
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.isListening = false;
    }
  }
}
