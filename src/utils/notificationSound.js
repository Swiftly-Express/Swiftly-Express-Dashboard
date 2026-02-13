/**
 * BULLETPROOF Notification Sound - LOOPS UNTIL STOPPED
 */

class NotificationSound {
    constructor() {
        this.audio = null;
        this.beepInterval = null;
        this.isPlaying = false;
        this.init();
    }

    init() {
        // Create audio immediately
        this.audio = new Audio('/notification.mp3');
        this.audio.volume = 1.0; // MAX VOLUME
        this.audio.load();
        console.log('[NotificationSound] 🔊 Audio loaded');

        // Auto-unlock on ANY interaction
        const unlock = () => {
            this.audio.play().then(() => {
                this.audio.pause();
                this.audio.currentTime = 0;
                console.log('[NotificationSound] ✅ Audio unlocked');
            }).catch(() => { });
        };

        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('touchstart', unlock, { once: true });
        document.addEventListener('keydown', unlock, { once: true });
    }

    play() {
        console.log('[NotificationSound] 🚨🚨🚨 PLAY CALLED');

        if (this.isPlaying) {
            console.log('[NotificationSound] Already playing');
            return;
        }

        this.isPlaying = true;

        // Function to play sound
        const playNow = () => {
            if (!this.isPlaying) return;

            // Try audio file
            if (this.audio) {
                this.audio.currentTime = 0;
                this.audio.volume = 1.0;
                this.audio.play()
                    .then(() => console.log('[NotificationSound] ✅ Playing notification.mp3'))
                    .catch(err => {
                        console.error('[NotificationSound] ❌ Play failed:', err);
                        this.playBeep(); // Fallback to beep
                    });
            }
        };

        // Play immediately
        playNow();

        // LOOP every 2 seconds
        this.beepInterval = setInterval(playNow, 2000);

        console.log('[NotificationSound] 🔁 Looping sound every 2 seconds');
    }

    playBeep() {
        // Fallback beep sound
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.frequency.value = 800;
            gain.gain.value = 0.5;

            osc.start();
            osc.stop(ctx.currentTime + 0.3);

            console.log('[NotificationSound] 🔊 Beep played');
        } catch (e) {
            console.error('[NotificationSound] Beep failed:', e);
        }
    }

    stop() {
        console.log('[NotificationSound] 🛑 STOP CALLED');

        // Clear playing flag FIRST to prevent any new plays
        this.isPlaying = false;

        // Stop the interval loop
        if (this.beepInterval) {
            clearInterval(this.beepInterval);
            this.beepInterval = null;
            console.log('[NotificationSound] ✅ Interval cleared');
        }

        // Forcefully stop audio
        if (this.audio) {
            try {
                this.audio.pause();
                this.audio.currentTime = 0;
                this.audio.volume = 0;
                // Force stop by removing src and reloading
                this.audio.src = '';
                this.audio.load();
                console.log('[NotificationSound] ✅ Audio forcefully stopped');
            } catch (e) {
                console.warn('[NotificationSound] Error stopping audio:', e);
            }

            // Recreate audio element for next play
            setTimeout(() => {
                if (!this.isPlaying) {
                    this.audio = new Audio('/notification.mp3');
                    this.audio.volume = 1.0;
                    this.audio.load();
                }
            }, 100);
        }

        console.log('[NotificationSound] ✅ Stopped completely');
    }
}

const notificationSound = new NotificationSound();

export default notificationSound;
export const playNotificationSound = () => notificationSound.play();
export const stopNotificationSound = () => notificationSound.stop();