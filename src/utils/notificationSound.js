/**
 * Notification Sound Utility
 * Plays notification sounds for new orders, requests, and delivery completions
 * Works on both desktop and mobile browsers
 */

class NotificationSound {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.initialized = false;
        this.audioContext = null;
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    initialize() {
        if (this.initialized) return;
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('[NotificationSound] 🔊 Audio initialized');
        } catch (e) {
            console.warn('[NotificationSound] Could not initialize audio:', e);
        }
    }

    /**
     * Play notification sound
     * Works on both desktop and mobile
     */
    async play() {
        try {
            // Initialize if not already done
            if (!this.initialized) {
                this.initialize();
            }

            // If already playing, don't overlap
            if (this.isPlaying) {
                console.log('[NotificationSound] Sound already playing, skipping...');
                return;
            }

            console.log('[NotificationSound] 🔔 Playing notification sound...');

            // Try Web Audio API first (works on all modern browsers)
            if (this.audioContext || window.AudioContext || window.webkitAudioContext) {
                await this.playWithWebAudio();
            } else {
                // Fallback to HTML5 Audio
                this.playFallbackBeep();
            }
        } catch (error) {
            console.error('[NotificationSound] Failed to play sound:', error);
            this.isPlaying = false;
            // Try fallback
            this.playFallbackBeep();
        }
    }

    /**
     * Play using Web Audio API
     */
    async playWithWebAudio() {
        try {
            // Create or reuse audio context
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const audioContext = this.audioContext;

            // Resume context if suspended (required on some mobile browsers and after page idle)
            if (audioContext.state === 'suspended') {
                console.log('[NotificationSound] Resuming suspended audio context...');
                await audioContext.resume();
            }

            // Create a pleasant notification sound (two tones)
            const oscillator1 = audioContext.createOscillator();
            const oscillator2 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            // First tone (higher pitch) - 800 Hz
            oscillator1.type = 'sine';
            oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator1.connect(gainNode);

            // Second tone (slightly lower) - 600 Hz
            oscillator2.type = 'sine';
            oscillator2.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator2.connect(gainNode);

            // Volume control (fade out)
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            gainNode.connect(audioContext.destination);

            // Play the tones
            oscillator1.start(audioContext.currentTime);
            oscillator1.stop(audioContext.currentTime + 0.2);

            oscillator2.start(audioContext.currentTime + 0.15);
            oscillator2.stop(audioContext.currentTime + 0.5);

            this.isPlaying = true;

            // Reset playing state after sound completes
            setTimeout(() => {
                this.isPlaying = false;
            }, 600);

            console.log('[NotificationSound] ✅ Notification sound played (Web Audio)');
        } catch (error) {
            console.error('[NotificationSound] Web Audio failed:', error);
            this.isPlaying = false;
            throw error;
        }
    }

    /**
     * Fallback method using HTML5 Audio with data URI
     */
    playFallbackBeep() {
        try {
            console.log('[NotificationSound] Using HTML5 Audio fallback...');

            // Try to use the notification.mp3 file from public folder first
            if (!this.audio) {
                this.audio = new Audio('/notification.mp3');
                this.audio.volume = 0.6;

                // If file fails to load, use data URI beep as last resort
                this.audio.onerror = () => {
                    console.warn('[NotificationSound] Audio file not found, using data URI beep');
                    this.audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS56+qdTQwOUKfl8LZiHAU2kdXy0HksBS1+y/LNjz8KElyx6OyrVhQKRp7h8r9sIQYuhM3y2IcxBxhltOzpoVALEFKo5fC2YRwFN5HT8tB5KwYtf8vy0ZBACRResdzmq1UUDUZ+4PK+bSMHLoXN8tiHMQcYZLTr6aFQCxBSqOTwtmEcBTeR0vLPeisFLYDK8tGPQAkUXrHb5qxVFAxGfeDyvmwjBy2FzfLYiDAHGGS06+mhUAsQUqnk8LZhHAU3k9Lyz3otBSx/yvLRj0AJFF6x2+arVRQMRn3g8r5sIwcthc3y2IgwBxhltOvpoVALEFKp5PC2YRwFN5PR8s98LQUsf8ry0Y9ACRRes9vmq1UUDEd94PK+bCMHLYXN8tiIMAcYZbTr6aFQCxBSqeTwtmEcBTeT0fLPfC0FLH/K8tGPQAkUXrPb5qtVFAxGfeDyvmwjBy2FzfLYiDAHGGW06+mhUAsQUqnk8LZhHAU3k9Hyz3wtBSx/yvLRj0AJFF6z2+arVRQMRn3g8r5sIwcthc3y2IgwBxhltOvpoVALEFKp5PC2YRwFN5PR8s98LQUsf8ry0Y9ACRRes9vmq1UUDEd94PK+bCMHLYXN8tiIMAcYZbTr6aFQCxBSqeTwtmEcBTeT0fLPfC0FLH/K8tGPQAkUXrPb5qtVFAxGfeDyvmwjBy2FzfLYiDAHGGW06+mhUAsQUqnk8LZhHAU3k9Hyz3wtBSx/yvLRj0AJFF6z2+arVRQMRn3g8r5sIwcthc3y2IgwBxhltOvpoVALEFKp5PC2YRwFN5PR8s98LQUsf8ry0Y9ACRRes9vmq1UUDEd94PK+bCMHLYXN8tiIMAcYZbTr6aFQCxBSqeTwtmEcBTeT0fLPfC0FLH/K8tGPQAkUXrPb5qtVFAxGfeDyvmwjBy2FzfLYiDAHGGW06+mhUAsQUqnk8LZhHAU3k9Hyz3wtBSx/yvLRj0AJFF6z2+arVRQMRn3g8r5sIwcthc3y2IgwBxhltOvpoVALEFKp5PC2YRwFN5PR8s98LQUsf8ry0Y9ACRRes9vmq1UUDEd94PK+bCMHLYXN8tiIMAcYZbTr6aFQCxBSqeTwtmEcBTeT0fLPfC0FLH/K8tGPQAkUXrPb5qtVFAxGfeDyvmwjBy2FzfLYiDAHGGW06+mhUAsQUqnk8LZhHAU3k9Hyz3wtBSx/yvLRj0AJFF6z2+arVRQMRn3g8r5sIwcthc3y2IgwBxhltOvpoVALEFKp5PC2YRwFN5PR8s98LQUsf8ry0Y9ACRRes9vmq1UUDEd94PK+bCMHLYXN8tiIMAcYZbTr6aFQCxBSqeTwtmEcBTeT0fLPfC0FLH/K8tGPQAkUXrPb5qtVFAxGfeDyvmwjBy2FzfLYiDAHGGW06+mhUAsQUqnk8LZhHAU3k9Hyz3wtBSx/yvLRj0AJFF6z2+arVRQMRn3g8r5sIwcthc3y2IgwBxhltOvpoVALEFKp5PC2YRwFN5PR8s98LQUsf8ry0Y9ACRRes9vmq1UUDEd94PK+bCMHLYXN8tiIMAcYZbTr6aFQCxBSqeTwtmEcBTeT0fLPfC0FLH/K8tGPQAkUXrPb5qtVFAxGfeDyvmwjBy2FzfLYiDAA==');
                    this.audio.volume = 0.5;
                };
            }

            // Play the audio
            this.audio.currentTime = 0;
            const playPromise = this.audio.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('[NotificationSound] ✅ HTML5 Audio played successfully');
                    })
                    .catch(e => {
                        console.warn('[NotificationSound] HTML5 Audio play failed:', e);
                    });
            }
        } catch (e) {
            console.warn('[NotificationSound] All sound methods failed:', e);
        }
    }

    /**
     * Stop currently playing sound
     */
    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
        this.isPlaying = false;
    }
}

// Export singleton instance
const notificationSound = new NotificationSound();

// Auto-initialize audio on page load and play a silent tone to unlock audio
if (typeof window !== 'undefined') {
    // Initialize immediately on page load
    window.addEventListener('load', () => {
        notificationSound.initialize();
        
        // Play a very brief, nearly silent sound to unlock audio for future plays
        // This bypasses browser autoplay restrictions
        try {
            if (notificationSound.audioContext) {
                const ctx = notificationSound.audioContext;
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                gainNode.gain.setValueAtTime(0.001, ctx.currentTime); // Nearly silent
                oscillator.frequency.setValueAtTime(1, ctx.currentTime);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.01); // 10ms
                
                console.log('[NotificationSound] Audio unlocked on page load');
            }
        } catch (e) {
            console.warn('[NotificationSound] Could not unlock audio:', e);
        }
    });

    // Also initialize on first user interaction as backup
    const initAudio = () => {
        notificationSound.initialize();
        document.removeEventListener('click', initAudio);
        document.removeEventListener('touchstart', initAudio);
        document.removeEventListener('keydown', initAudio);
    };

    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });
}

export default notificationSound;

// Named exports for convenience
export const playNotificationSound = () => notificationSound.play();
export const stopNotificationSound = () => notificationSound.stop();
