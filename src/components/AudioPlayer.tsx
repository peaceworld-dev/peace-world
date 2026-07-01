import { useEffect, useRef, useState } from "react";
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Waves, 
  CloudRain, 
  Wind, 
  Sparkles, 
  AlertCircle,
  Trees,
  Flame,
  Droplet,
  Activity
} from "lucide-react";
import { AmbientSound } from "../types";

interface AudioPlayerProps {
  activeSound: AmbientSound;
}

export default function AudioPlayer({ activeSound }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [selectedSound, setSelectedSound] = useState<AmbientSound>(activeSound);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  const soundNodeRef = useRef<AudioNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const birdsIntervalRef = useRef<any>(null);
  const fireIntervalRef = useRef<any>(null);

  // Sync with selected room sound
  useEffect(() => {
    setSelectedSound(activeSound);
    if (isPlaying) {
      // Small timeout to allow state transition and rebuild the synth
      const timer = setTimeout(() => {
        startSound(activeSound);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeSound]);

  // Handle volume changes
  useEffect(() => {
    if (mainGainRef.current) {
      mainGainRef.current.gain.value = volume;
    }
  }, [volume]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return false;
      
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const mainGain = ctx.createGain();
      mainGain.connect(ctx.destination);
      mainGain.gain.value = volume;
      mainGainRef.current = mainGain;
    }
    
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return true;
  };

  const createPinkNoiseBuffer = (ctx: AudioContext) => {
    const bufferSize = 4 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] = pink * 0.11; // normalization
    }
    return buffer;
  };

  const createBrownNoiseBuffer = (ctx: AudioContext) => {
    const bufferSize = 4 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // compensation
    }
    return buffer;
  };

  const stopAll = () => {
    if (birdsIntervalRef.current) {
      clearInterval(birdsIntervalRef.current);
      birdsIntervalRef.current = null;
    }
    if (fireIntervalRef.current) {
      clearInterval(fireIntervalRef.current);
      fireIntervalRef.current = null;
    }
    try {
      if (soundNodeRef.current) {
        (soundNodeRef.current as any).stop?.();
        soundNodeRef.current.disconnect();
        soundNodeRef.current = null;
      }
      if (lfoRef.current) {
        lfoRef.current.stop();
        lfoRef.current.disconnect();
        lfoRef.current = null;
      }
    } catch (e) {
      // Already stopped
    }
  };

  const startSound = (soundType: AmbientSound) => {
    stopAll();
    
    if (!initAudio()) return;
    const ctx = audioCtxRef.current!;
    const mainGain = mainGainRef.current!;

    if (soundType === "silence") {
      return;
    }

    try {
      if (soundType === "rain") {
        // Synthesize rain using pink noise + resonant bandpass filter
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = createPinkNoiseBuffer(ctx);
        noiseNode.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1000, ctx.currentTime);

        noiseNode.connect(filter);
        filter.connect(mainGain);
        
        noiseNode.start();
        soundNodeRef.current = noiseNode;

      } else if (soundType === "waves") {
        // Synthesize waves using brown noise modulated by a very slow LFO
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = createBrownNoiseBuffer(ctx);
        noiseNode.loop = true;

        const waveGain = ctx.createGain();
        waveGain.gain.value = 0.1; // base volume

        // Modulate waveGain with an LFO to simulate water movement
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.08; // 12 seconds per wave cycle
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.35; // depth of oscillation

        lfo.connect(lfoGain);
        lfoGain.connect(waveGain.gain);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 450; // soft underwater-like lowpass

        noiseNode.connect(filter);
        filter.connect(waveGain);
        waveGain.connect(mainGain);

        lfo.start();
        noiseNode.start();

        lfoRef.current = lfo;
        soundNodeRef.current = noiseNode;

      } else if (soundType === "wind") {
        // Synthesize wind using pink noise and a shifting lowpass filter modulated by LFO
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = createPinkNoiseBuffer(ctx);
        noiseNode.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 350;
        filter.Q.value = 2.0;

        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.15; // slow swelling frequency sweeps
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 200; // range of swept frequency

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        noiseNode.connect(filter);
        filter.connect(mainGain);

        lfo.start();
        noiseNode.start();

        lfoRef.current = lfo;
        soundNodeRef.current = noiseNode;

      } else if (soundType === "night") {
        // Night/Cosmic bowl synthesizer: harmonic sine wave oscillators with slight detune
        const voices = [110, 165, 220, 275, 330, 440]; // Deep chords A
        const nodes: OscillatorNode[] = [];
        
        const ambientGroupGain = ctx.createGain();
        ambientGroupGain.connect(mainGain);
        ambientGroupGain.gain.value = 0.25;

        voices.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          
          osc.frequency.value = freq + (Math.random() * 2 - 1); // detune
          osc.type = "sine";

          // Modulate individual voices slowly for organic feel
          const oscLfo = ctx.createOscillator();
          oscLfo.frequency.value = 0.05 + idx * 0.02;
          const oscLfoGain = ctx.createGain();
          oscLfoGain.gain.value = 0.05;

          oscLfo.connect(oscLfoGain);
          oscLfoGain.connect(oscGain.gain);

          oscGain.gain.value = 0.1 / voices.length;

          osc.connect(oscGain);
          oscGain.connect(ambientGroupGain);
          
          osc.start();
          oscLfo.start();
          
          nodes.push(osc);
          nodes.push(oscLfo as any);
        });

        // Add soft crackling campfire (using short filtered clicks)
        const campfireNode = ctx.createBufferSource();
        campfireNode.buffer = createPinkNoiseBuffer(ctx);
        campfireNode.loop = true;
        const cpFilter = ctx.createBiquadFilter();
        cpFilter.type = "peaking";
        cpFilter.frequency.value = 2000;
        cpFilter.Q.value = 10;
        
        const cpGain = ctx.createGain();
        cpGain.gain.value = 0.02; // very subtle

        campfireNode.connect(cpFilter);
        cpFilter.connect(cpGain);
        cpGain.connect(mainGain);
        campfireNode.start();

        // Wrap cleanup
        soundNodeRef.current = {
          disconnect: () => {
            nodes.forEach(n => {
              try { n.stop(); n.disconnect(); } catch(e) {}
            });
            try { campfireNode.stop(); campfireNode.disconnect(); } catch(e) {}
            cpGain.disconnect();
            ambientGroupGain.disconnect();
          }
        } as any;

      } else if (soundType === "forest") {
        // Synthesize a beautiful calm forest environment
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = createPinkNoiseBuffer(ctx);
        noiseNode.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(450, ctx.currentTime);
        filter.Q.setValueAtTime(1.0, ctx.currentTime);

        const windLfo = ctx.createOscillator();
        windLfo.frequency.setValueAtTime(0.06, ctx.currentTime); // very slow leaves rustling
        const windLfoGain = ctx.createGain();
        windLfoGain.gain.setValueAtTime(180, ctx.currentTime);

        windLfo.connect(windLfoGain);
        windLfoGain.connect(filter.frequency);

        const forestGain = ctx.createGain();
        forestGain.gain.setValueAtTime(0.22, ctx.currentTime);

        noiseNode.connect(filter);
        filter.connect(forestGain);
        forestGain.connect(mainGain);

        windLfo.start();
        noiseNode.start();

        // Sparse birds chirping randomly
        const triggerBird = () => {
          try {
            const now = ctx.currentTime;
            const numNotes = 2 + Math.floor(Math.random() * 3);
            let timeOffset = 0;
            
            for (let i = 0; i < numNotes; i++) {
              const osc = ctx.createOscillator();
              const gainNode = ctx.createGain();
              osc.connect(gainNode);
              gainNode.connect(mainGain);
              
              osc.type = "sine";
              const startFreq = 2300 + Math.random() * 400;
              const endFreq = startFreq + 1000 + Math.random() * 600;
              const duration = 0.07 + Math.random() * 0.05;
              
              osc.frequency.setValueAtTime(startFreq, now + timeOffset);
              osc.frequency.exponentialRampToValueAtTime(endFreq, now + timeOffset + duration);
              
              gainNode.gain.setValueAtTime(0, now + timeOffset);
              gainNode.gain.linearRampToValueAtTime(0.012, now + timeOffset + 0.015);
              gainNode.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + duration);
              
              osc.start(now + timeOffset);
              osc.stop(now + timeOffset + duration + 0.01);
              
              timeOffset += duration + 0.05 + Math.random() * 0.08;
            }
          } catch (e) {
            // Context suspended/closed
          }
        };

        triggerBird();
        birdsIntervalRef.current = setInterval(triggerBird, 5000 + Math.random() * 4000);

        soundNodeRef.current = {
          stop: () => {
            try { noiseNode.stop(); } catch(e) {}
            try { windLfo.stop(); } catch(e) {}
          },
          disconnect: () => {
            noiseNode.disconnect();
            filter.disconnect();
            windLfo.disconnect();
            windLfoGain.disconnect();
            forestGain.disconnect();
          }
        } as any;

      } else if (soundType === "fire") {
        // Synthesize a crackling fireplace wood fire
        const roarNode = ctx.createBufferSource();
        roarNode.buffer = createBrownNoiseBuffer(ctx);
        roarNode.loop = true;

        const roarFilter = ctx.createBiquadFilter();
        roarFilter.type = "lowpass";
        roarFilter.frequency.setValueAtTime(140, ctx.currentTime);

        const roarGain = ctx.createGain();
        roarGain.gain.setValueAtTime(0.35, ctx.currentTime);

        roarNode.connect(roarFilter);
        roarFilter.connect(roarGain);
        roarGain.connect(mainGain);
        roarNode.start();

        // High frequency crackles
        const crackleNode = ctx.createBufferSource();
        crackleNode.buffer = createPinkNoiseBuffer(ctx);
        crackleNode.loop = true;

        const crackleFilter = ctx.createBiquadFilter();
        crackleFilter.type = "highpass";
        crackleFilter.frequency.setValueAtTime(2600, ctx.currentTime);

        const crackleGain = ctx.createGain();
        crackleGain.gain.setValueAtTime(0.06, ctx.currentTime);

        // Rapid amplitude sputter
        const crackleLfo = ctx.createOscillator();
        crackleLfo.type = "sawtooth";
        crackleLfo.frequency.setValueAtTime(14, ctx.currentTime);
        
        const crackleLfoGain = ctx.createGain();
        crackleLfoGain.gain.setValueAtTime(0.04, ctx.currentTime);

        crackleLfo.connect(crackleLfoGain);
        crackleLfoGain.connect(crackleGain.gain);

        crackleNode.connect(crackleFilter);
        crackleFilter.connect(crackleGain);
        crackleGain.connect(mainGain);
        
        crackleLfo.start();
        crackleNode.start();

        // Loud periodic wood pops
        const triggerPop = () => {
          try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            const popFilter = ctx.createBiquadFilter();
            
            popFilter.type = "bandpass";
            popFilter.frequency.setValueAtTime(1300 + Math.random() * 800, now);
            popFilter.Q.setValueAtTime(5.0, now);
            
            osc.type = "triangle";
            osc.frequency.setValueAtTime(130 + Math.random() * 100, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 0.1);
            
            gainNode.gain.setValueAtTime(0.06, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
            
            osc.connect(popFilter);
            popFilter.connect(gainNode);
            gainNode.connect(mainGain);
            
            osc.start(now);
            osc.stop(now + 0.12);
          } catch (e) {}
        };

        triggerPop();
        fireIntervalRef.current = setInterval(triggerPop, 1500 + Math.random() * 2500);

        soundNodeRef.current = {
          stop: () => {
            try { roarNode.stop(); } catch(e) {}
            try { crackleNode.stop(); } catch(e) {}
            try { crackleLfo.stop(); } catch(e) {}
          },
          disconnect: () => {
            roarNode.disconnect();
            roarFilter.disconnect();
            roarGain.disconnect();
            crackleNode.disconnect();
            crackleFilter.disconnect();
            crackleGain.disconnect();
            crackleLfo.disconnect();
            crackleLfoGain.disconnect();
          }
        } as any;

      } else if (soundType === "stream") {
        // Synthesize water brook/stream
        const flowNode = ctx.createBufferSource();
        flowNode.buffer = createPinkNoiseBuffer(ctx);
        flowNode.loop = true;

        const flowFilter = ctx.createBiquadFilter();
        flowFilter.type = "bandpass";
        flowFilter.frequency.setValueAtTime(600, ctx.currentTime);
        flowFilter.Q.setValueAtTime(1.0, ctx.currentTime);

        const flowLfo = ctx.createOscillator();
        flowLfo.frequency.setValueAtTime(0.3, ctx.currentTime);
        const flowLfoGain = ctx.createGain();
        flowLfoGain.gain.setValueAtTime(140, ctx.currentTime);

        flowLfo.connect(flowLfoGain);
        flowLfoGain.connect(flowFilter.frequency);

        const flowGain = ctx.createGain();
        flowGain.gain.setValueAtTime(0.24, ctx.currentTime);

        flowNode.connect(flowFilter);
        flowFilter.connect(flowGain);
        flowGain.connect(mainGain);

        flowLfo.start();
        flowNode.start();

        // Continuous wet gurgling bubbles modulation
        const gurgleOsc = ctx.createOscillator();
        gurgleOsc.type = "sine";
        gurgleOsc.frequency.setValueAtTime(340, ctx.currentTime);

        const gurgleLfo = ctx.createOscillator();
        gurgleLfo.frequency.setValueAtTime(4.0, ctx.currentTime);
        const gurgleLfoGain = ctx.createGain();
        gurgleLfoGain.gain.setValueAtTime(120, ctx.currentTime);

        const gurgleGain = ctx.createGain();
        gurgleGain.gain.setValueAtTime(0.03, ctx.currentTime);

        gurgleLfo.connect(gurgleLfoGain);
        gurgleLfoGain.connect(gurgleOsc.frequency);

        gurgleOsc.connect(gurgleGain);
        gurgleGain.connect(mainGain);

        gurgleLfo.start();
        gurgleOsc.start();

        soundNodeRef.current = {
          stop: () => {
            try { flowNode.stop(); } catch(e) {}
            try { flowLfo.stop(); } catch(e) {}
            try { gurgleOsc.stop(); } catch(e) {}
            try { gurgleLfo.stop(); } catch(e) {}
          },
          disconnect: () => {
            flowNode.disconnect();
            flowFilter.disconnect();
            flowLfo.disconnect();
            flowLfoGain.disconnect();
            flowGain.disconnect();
            gurgleOsc.disconnect();
            gurgleLfo.disconnect();
            gurgleLfoGain.disconnect();
            gurgleGain.disconnect();
          }
        } as any;

      } else if (soundType === "binaural") {
        // Binaural delta wave delta beats (100Hz and 104Hz)
        const leftOsc = ctx.createOscillator();
        leftOsc.type = "sine";
        leftOsc.frequency.setValueAtTime(100, ctx.currentTime);

        const rightOsc = ctx.createOscillator();
        rightOsc.type = "sine";
        rightOsc.frequency.setValueAtTime(104, ctx.currentTime);

        const subOsc = ctx.createOscillator();
        subOsc.type = "sine";
        subOsc.frequency.setValueAtTime(50, ctx.currentTime); // deep bass base

        const leftDrone = ctx.createOscillator();
        leftDrone.type = "sine";
        leftDrone.frequency.setValueAtTime(150, ctx.currentTime);

        const rightDrone = ctx.createOscillator();
        rightDrone.type = "sine";
        rightDrone.frequency.setValueAtTime(150.5, ctx.currentTime);

        const droneFilter = ctx.createBiquadFilter();
        droneFilter.type = "lowpass";
        droneFilter.frequency.setValueAtTime(110, ctx.currentTime);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.16, ctx.currentTime);

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.08, ctx.currentTime);

        const droneGain = ctx.createGain();
        droneGain.gain.setValueAtTime(0.06, ctx.currentTime);

        let leftPanner: StereoPannerNode | null = null;
        let rightPanner: StereoPannerNode | null = null;
        let leftDronePanner: StereoPannerNode | null = null;
        let rightDronePanner: StereoPannerNode | null = null;

        try {
          leftPanner = ctx.createStereoPanner();
          leftPanner.pan.setValueAtTime(-1, ctx.currentTime);
          
          rightPanner = ctx.createStereoPanner();
          rightPanner.pan.setValueAtTime(1, ctx.currentTime);

          leftDronePanner = ctx.createStereoPanner();
          leftDronePanner.pan.setValueAtTime(-0.8, ctx.currentTime);

          rightDronePanner = ctx.createStereoPanner();
          rightDronePanner.pan.setValueAtTime(0.8, ctx.currentTime);

          leftOsc.connect(leftPanner);
          leftPanner.connect(oscGain);

          rightOsc.connect(rightPanner);
          rightPanner.connect(oscGain);

          leftDrone.connect(leftDronePanner);
          leftDronePanner.connect(droneFilter);

          rightDrone.connect(rightDronePanner);
          rightDronePanner.connect(droneFilter);

          droneFilter.connect(droneGain);
        } catch (e) {
          leftOsc.connect(oscGain);
          rightOsc.connect(oscGain);
          leftDrone.connect(droneGain);
          rightDrone.connect(droneGain);
        }

        subOsc.connect(subGain);

        oscGain.connect(mainGain);
        subGain.connect(mainGain);
        droneGain.connect(mainGain);

        leftOsc.start();
        rightOsc.start();
        subOsc.start();
        leftDrone.start();
        rightDrone.start();

        soundNodeRef.current = {
          stop: () => {
            try { leftOsc.stop(); } catch(e) {}
            try { rightOsc.stop(); } catch(e) {}
            try { subOsc.stop(); } catch(e) {}
            try { leftDrone.stop(); } catch(e) {}
            try { rightDrone.stop(); } catch(e) {}
          },
          disconnect: () => {
            leftOsc.disconnect();
            rightOsc.disconnect();
            subOsc.disconnect();
            leftDrone.disconnect();
            rightDrone.disconnect();
            oscGain.disconnect();
            subGain.disconnect();
            droneGain.disconnect();
            droneFilter.disconnect();
            if (leftPanner) leftPanner.disconnect();
            if (rightPanner) rightPanner.disconnect();
            if (leftDronePanner) leftDronePanner.disconnect();
            if (rightDronePanner) rightDronePanner.disconnect();
          }
        } as any;
      }
    } catch (e) {
      console.error("Failed to start synthesizer node", e);
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopAll();
      setIsPlaying(false);
    } else {
      const success = initAudio();
      if (success) {
        setIsPlaying(true);
        startSound(selectedSound);
        setAutoplayBlocked(false);
      } else {
        setAutoplayBlocked(true);
      }
    }
  };

  const changeSound = (soundType: AmbientSound) => {
    setSelectedSound(soundType);
    if (isPlaying) {
      startSound(soundType);
    } else {
      // Auto-play when user manually switches sound type
      const success = initAudio();
      if (success) {
        setIsPlaying(true);
        startSound(soundType);
      }
    }
  };

  const playSingingBowl = () => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    // Create a beautiful, rich Tibetan bowl chime on call
    const now = ctx.currentTime;
    const frequencies = [144, 288, 432, 576, 720, 864]; // Pure resonance
    const bowlGain = ctx.createGain();
    bowlGain.connect(mainGainRef.current || ctx.destination);
    
    // Smooth attack and long decay
    bowlGain.gain.setValueAtTime(0, now);
    bowlGain.gain.linearRampToValueAtTime(0.3, now + 0.5);
    bowlGain.gain.exponentialRampToValueAtTime(0.0001, now + 8.0);

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      // Natural harmonic detuning
      osc.frequency.setValueAtTime(freq + (idx * 0.4), now);
      
      const vGain = ctx.createGain();
      // Lower volume for higher harmonics
      vGain.gain.setValueAtTime((0.3 / (idx + 1)), now);
      
      osc.connect(vGain);
      vGain.connect(bowlGain);
      
      osc.start(now);
      osc.stop(now + 8.5);
    });
  };

  return (
    <div id="ambient-audio-panel" className="bg-white border border-neutral-900 rounded-lg p-5 shadow-sm text-neutral-900 font-mono transition-all">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold tracking-wider uppercase">Sons da Casa</h3>
          <p className="text-xs text-neutral-500 mt-1">Sintetizador Web Audio nativo</p>
        </div>
        <button
          id="btn-play-bowl"
          onClick={playSingingBowl}
          className="px-3 py-1.5 border border-neutral-900 rounded text-xs hover:bg-neutral-900 hover:text-white transition duration-200 flex items-center gap-1.5 active:translate-y-[1px]"
          title="Tocar Sino Tibetano"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sino</span>
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <button
          id="btn-toggle-playback"
          onClick={togglePlayback}
          className={`w-12 h-12 rounded-full border border-neutral-900 flex items-center justify-center transition-all ${
            isPlaying ? "bg-neutral-900 text-white" : "bg-white text-neutral-900 hover:bg-neutral-50"
          } active:scale-95`}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>Volume</span>
            <span>{Math.round(volume * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <VolumeX className="w-4 h-4 text-neutral-400" />
            <input
              id="slider-sound-volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 accent-neutral-900 h-[3px] bg-neutral-200 rounded-lg appearance-none cursor-pointer"
            />
            <Volume2 className="w-4 h-4 text-neutral-900" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          { id: "silence", label: "Silêncio", icon: VolumeX },
          { id: "rain", label: "Chuva", icon: CloudRain },
          { id: "waves", label: "Oceano", icon: Waves },
          { id: "wind", label: "Vento", icon: Wind },
          { id: "night", label: "Templo", icon: Sparkles },
          { id: "forest", label: "Floresta", icon: Trees },
          { id: "fire", label: "Lareira", icon: Flame },
          { id: "stream", label: "Riacho", icon: Droplet },
          { id: "binaural", label: "Binaural", icon: Activity }
        ].map((sound) => {
          const Icon = sound.icon;
          return (
            <button
              id={`sound-btn-${sound.id}`}
              key={sound.id}
              onClick={() => changeSound(sound.id as any)}
              className={`flex flex-col items-center justify-center py-2.5 rounded border text-[10px] transition-all ${
                selectedSound === sound.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span>{sound.label}</span>
            </button>
          );
        })}
      </div>

      {autoplayBlocked && (
        <div className="mt-3 flex items-start gap-2 bg-neutral-50 p-2 rounded border border-neutral-200 text-[11px] text-neutral-600">
          <AlertCircle className="w-4 h-4 text-neutral-900 shrink-0 mt-0.5" />
          <span>Ative o som clicando no botão principal acima para permitir a reprodução no navegador.</span>
        </div>
      )}

      {isPlaying && selectedSound !== "silence" && (
        <div className="mt-3.5 flex items-center gap-2 justify-center">
          <div className="flex gap-[3px] h-3 items-end">
            <span className="w-[2px] bg-neutral-900 animate-pulse h-full rounded"></span>
            <span className="w-[2px] bg-neutral-900 animate-pulse h-2/3 rounded delay-75"></span>
            <span className="w-[2px] bg-neutral-900 animate-pulse h-5/6 rounded delay-150"></span>
            <span className="w-[2px] bg-neutral-900 animate-pulse h-1/2 rounded delay-200"></span>
          </div>
          <span className="text-[10px] text-neutral-500 italic">Sintonizando som ambiente...</span>
        </div>
      )}
    </div>
  );
}
