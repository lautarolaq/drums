// Drum Pad 3x3 - Zero Latency Drum Machine with Real Acoustic Samples
class DrumMachine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isInitialized = false;
        this.samplesLoaded = false;
        this.audioBuffers = {};

        // Mapeo de teclas QWERTY a índices de pads (3x3 = 9 pads)
        this.keyMap = {
            // Fila 1
            '1': 0, '2': 1, '3': 2,
            // Fila 2
            'q': 3, 'w': 4, 'e': 5,
            // Fila 3
            'a': 6, 's': 7, 'd': 8
        };

        // Etiquetas para cada pad (batería acústica estándar)
        this.padLabels = [
            'Crash', 'Tom High', 'Tom Mid',
            'Hi-Hat Open', 'Snare', 'Hi-Hat Closed',
            'Tom Low', 'Kick', 'Ride'
        ];

        // Archivos de samples para cada pad
        this.sampleFiles = {
            0: 'samples/crash.mp3',
            1: 'samples/tom_high.mp3',
            2: 'samples/tom_mid.mp3',
            3: 'samples/hihat_open.mp3',
            4: 'samples/snare.mp3',
            5: 'samples/hihat_closed.mp3',
            6: 'samples/tom_low.mp3',
            7: 'samples/kick.mp3',
            8: 'samples/ride.mp3'
        };

        this.init();
    }

    async init() {
        this.createPads();
        this.setupEventListeners();
    }

    async initAudio() {
        if (this.isInitialized) return;

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.8;
        this.masterGain.connect(this.audioContext.destination);

        this.isInitialized = true;

        // Update title to show loading samples
        const title = document.querySelector('.title');
        if (title) {
            title.textContent = 'LOADING SAMPLES...';
            title.style.color = '#fbbf24';
        }

        // Load all samples
        await this.loadSamples();

        // Update title to show ready
        if (title) {
            title.textContent = 'ACOUSTIC DRUMS - READY';
            title.style.color = '#4ade80';
            setTimeout(() => {
                title.textContent = 'ACOUSTIC DRUMS';
                title.style.color = '#fff';
            }, 1000);
        }
    }

    async loadSamples() {
        const loadPromises = Object.keys(this.sampleFiles).map(async (key) => {
            const url = this.sampleFiles[key];
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.audioBuffers[key] = audioBuffer;
            } catch (error) {
                console.error(`Error loading sample ${url}:`, error);
            }
        });

        await Promise.all(loadPromises);
        this.samplesLoaded = true;
    }

    createPads() {
        const grid = document.getElementById('drumGrid');
        const keys = Object.keys(this.keyMap);

        for (let i = 0; i < 9; i++) {
            const pad = document.createElement('div');
            pad.className = 'drum-pad';
            pad.dataset.index = i;

            const keyLabel = document.createElement('div');
            keyLabel.className = 'key';
            keyLabel.textContent = keys[i].toUpperCase();

            const label = document.createElement('div');
            label.className = 'label';
            label.textContent = this.padLabels[i];

            pad.appendChild(keyLabel);
            pad.appendChild(label);
            grid.appendChild(pad);
        }
    }

    setupEventListeners() {
        const pads = document.querySelectorAll('.drum-pad');

        // Touch events
        pads.forEach(pad => {
            pad.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.playSound(parseInt(pad.dataset.index));
                this.activatePad(pad);
            });

            pad.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.deactivatePad(pad);
            });

            // Mouse events (desktop)
            pad.addEventListener('mousedown', (e) => {
                this.playSound(parseInt(pad.dataset.index));
                this.activatePad(pad);
            });

            pad.addEventListener('mouseup', () => {
                this.deactivatePad(pad);
            });

            pad.addEventListener('mouseleave', () => {
                this.deactivatePad(pad);
            });
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (this.keyMap.hasOwnProperty(key) && !e.repeat) {
                const index = this.keyMap[key];
                this.playSound(index);
                const pad = document.querySelector(`[data-index="${index}"]`);
                if (pad) this.activatePad(pad);
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.keyMap.hasOwnProperty(key)) {
                const index = this.keyMap[key];
                const pad = document.querySelector(`[data-index="${index}"]`);
                if (pad) this.deactivatePad(pad);
            }
        });

        // Initialize audio context on first user interaction
        document.addEventListener('touchstart', () => this.initAudio(), { once: true });
        document.addEventListener('mousedown', () => this.initAudio(), { once: true });
        document.addEventListener('keydown', () => this.initAudio(), { once: true });
    }

    activatePad(pad) {
        pad.classList.add('active');
    }

    deactivatePad(pad) {
        setTimeout(() => {
            pad.classList.remove('active');
        }, 100);
    }

    async playSound(index) {
        if (!this.isInitialized) {
            await this.initAudio();
        }

        if (!this.samplesLoaded) {
            console.log('Samples still loading...');
            return;
        }

        const buffer = this.audioBuffers[index];
        if (!buffer) {
            console.error(`No buffer loaded for index ${index}`);
            return;
        }

        // Create a buffer source (can't reuse, must create new one each time)
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.masterGain);

        // Start playback immediately (zero latency)
        source.start(0);
    }
}

// Initialize drum machine
const drumMachine = new DrumMachine();
