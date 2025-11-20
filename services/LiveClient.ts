import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { MODEL_NAME } from '../constants';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';
import { ConnectionState } from '../types';

export type LiveClientEvents = {
  onStateChange: (state: ConnectionState) => void;
  onAudioLevel: (level: number, source: 'input' | 'output') => void;
  onTranscript: (text: string, role: 'user' | 'model', isFinal: boolean) => void;
  onError: (error: string) => void;
};

export class LiveClient {
  private ai: GoogleGenAI;
  private events: LiveClientEvents;
  private session: any = null; // The active session
  
  // Audio Contexts
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  
  // Audio Nodes
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  
  // Playback State
  private nextStartTime: number = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  
  // Analyzer for visualization
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private volumeInterval: number | null = null;

  constructor(events: LiveClientEvents) {
    this.events = events;
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public async connect(config: { systemInstruction: string; voiceName: string }) {
    // Ensure any previous session is cleaned up
    await this.disconnect();

    try {
      this.events.onStateChange(ConnectionState.CONNECTING);

      // 1. Setup Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
      this.outputAudioContext = new AudioContextClass({ sampleRate: 24000 });

      // 2. Setup Analysers for visualization
      this.inputAnalyser = this.inputAudioContext.createAnalyser();
      this.outputAnalyser = this.outputAudioContext.createAnalyser();
      this.inputAnalyser.fftSize = 256;
      this.outputAnalyser.fftSize = 256;
      
      this.startVolumeMonitoring();

      // 3. Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Check if disconnected while waiting for permission
      if (!this.inputAudioContext) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      // Resume contexts to ensure they are active (needed for some browsers)
      await this.inputAudioContext.resume();
      await this.outputAudioContext.resume();
      
      // 4. Initialize Session with Gemini
      const sessionPromise = this.ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName } },
          },
          systemInstruction: config.systemInstruction,
          inputAudioTranscription: {}, // Enable transcription
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            // Only handle if we are still connected
            if (this.inputAudioContext) {
              this.events.onStateChange(ConnectionState.CONNECTED);
              this.setupAudioProcessing(stream, sessionPromise);
            }
          },
          onmessage: (msg) => this.handleMessage(msg),
          onclose: () => {
            this.events.onStateChange(ConnectionState.DISCONNECTED);
            this.cleanup();
          },
          onerror: (err) => {
            console.error('Session error:', err);
            this.events.onError('Connection error occurred. Please check your network.');
            this.events.onStateChange(ConnectionState.ERROR);
          }
        }
      });

      this.session = await sessionPromise;

      // Check if disconnected while waiting for session
      if (!this.outputAudioContext) {
        // We disconnected early, cleanup the session we just got
        return;
      }

      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.outputAnalyser);
      this.outputAnalyser.connect(this.outputAudioContext.destination);

    } catch (error: any) {
      console.error('Failed to connect:', error);
      let errorMessage = error.message || 'An unknown error occurred.';
      
      // Enhance error messages for common issues
      if (error.name === 'NotAllowedError' || errorMessage.toLowerCase().includes('permission denied')) {
        errorMessage = 'Microphone permission denied. The app needs microphone access to function.';
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        errorMessage = 'Authentication failed. Please check your API key settings.';
      } else if (errorMessage.includes('503')) {
        errorMessage = 'Service unavailable (503). The AI model is currently overloaded. Please try again later.';
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (errorMessage.includes('Requested entity was not found')) {
         errorMessage = 'Model not found or API key invalid for this model.';
      }

      this.events.onError(errorMessage);
      this.events.onStateChange(ConnectionState.ERROR);
      this.cleanup();
    }
  }

  public async disconnect() {
    // Stop tracks immediately
    if (this.inputSource) {
      try {
        // Access the stream from the media stream source if possible, or just clean up contexts
      } catch (e) {}
    }
    this.cleanup();
    this.events.onStateChange(ConnectionState.DISCONNECTED);
  }

  private setupAudioProcessing(stream: MediaStream, sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.inputAnalyser) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.inputSource.connect(this.inputAnalyser);
    this.inputAnalyser.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);

    this.processor.onaudioprocess = (e) => {
      if (!this.inputAudioContext) return; // Guard against execution after cleanup
      
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);
      
      sessionPromise.then((session) => {
          // Only send if session is still active (basic check)
          if (this.inputAudioContext) {
            session.sendRealtimeInput({ media: pcmBlob });
          }
      }).catch(e => console.error("Send input error", e));
    };
  }

  private async handleMessage(message: LiveServerMessage) {
    if (!this.outputAudioContext || !this.outputNode) return;

    // 1. Handle Audio Output
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData) {
      try {
        this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
        
        const audioBuffer = await decodeAudioData(
            base64ToUint8Array(audioData),
            this.outputAudioContext,
            24000,
            1
        );

        // Double check context existence after async decode
        if (!this.outputAudioContext || !this.outputNode) return;

        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputNode);
        
        source.addEventListener('ended', () => {
          this.activeSources.delete(source);
        });

        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;
        this.activeSources.add(source);
      } catch (e) {
        console.error("Audio decode error", e);
      }
    }

    // 2. Handle Interruption
    if (message.serverContent?.interrupted) {
      this.activeSources.forEach(source => {
        try { source.stop(); } catch(e) {}
      });
      this.activeSources.clear();
      this.nextStartTime = 0;
    }

    // 3. Handle Transcription
    const outputTx = message.serverContent?.outputTranscription?.text;
    const inputTx = message.serverContent?.inputTranscription?.text;

    // We pass turnComplete to help UI grouping
    const turnComplete = !!message.serverContent?.turnComplete;

    if (outputTx) {
      this.events.onTranscript(outputTx, 'model', turnComplete);
    }
    if (inputTx) {
      this.events.onTranscript(inputTx, 'user', turnComplete);
    }
  }

  private startVolumeMonitoring() {
    if (this.volumeInterval) clearInterval(this.volumeInterval);
    
    this.volumeInterval = window.setInterval(() => {
      if (this.inputAnalyser) {
        const data = new Uint8Array(this.inputAnalyser.frequencyBinCount);
        this.inputAnalyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        this.events.onAudioLevel(avg, 'input');
      }
      
      if (this.outputAnalyser) {
        const data = new Uint8Array(this.outputAnalyser.frequencyBinCount);
        this.outputAnalyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        this.events.onAudioLevel(avg, 'output');
      }
    }, 100);
  }

  private cleanup() {
    if (this.volumeInterval) {
      clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }
    
    this.activeSources.forEach(s => {
        try { s.stop(); } catch(e) {}
    });
    this.activeSources.clear();

    // Stop all media streams in input source
    if (this.inputSource) {
       this.inputSource.disconnect();
       this.inputSource = null;
    }

    if (this.processor) {
        this.processor.disconnect();
        this.processor.onaudioprocess = null;
        this.processor = null;
    }
    
    if (this.outputNode) {
      this.outputNode.disconnect();
      this.outputNode = null;
    }

    if (this.inputAnalyser) {
      this.inputAnalyser.disconnect();
      this.inputAnalyser = null;
    }
    
    if (this.outputAnalyser) {
      this.outputAnalyser.disconnect();
      this.outputAnalyser = null;
    }
    
    if (this.inputAudioContext) {
       if (this.inputAudioContext.state !== 'closed') this.inputAudioContext.close();
       this.inputAudioContext = null;
    }
    
    if (this.outputAudioContext) {
       if (this.outputAudioContext.state !== 'closed') this.outputAudioContext.close();
       this.outputAudioContext = null;
    }
    
    this.session = null;
  }
}