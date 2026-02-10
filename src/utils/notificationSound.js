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
        this.unlocked = false;
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    initialize() {
        if (this.initialized) return;
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Pre-load the audio file
            this.audio = new Audio('/notification.mp3');
            this.audio.preload = 'auto';
            this.audio.volume = 0.7;
            
            // Handle loading errors
            this.audio.addEventListener('error', (e) => {
                console.error('[NotificationSound] Audio file failed to load:', e);
                console.log('[NotificationSound] Falling back to beep sound');
            });
            
            this.initialized = true;
            console.log('[NotificationSound] 🔊 Audio initialized');
        } catch (e) {
            console.warn('[NotificationSound] Could not initialize audio:', e);
        }
    }

    /**
     * Unlock audio on user interaction (required for mobile browsers)
     */
    async unlock() {
        if (this.unlocked) return;
        
        try {
            // Resume audio context if suspended
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Play a silent sound to unlock
            if (this.audio) {
                this.audio.volume = 0;
                const playPromise = this.audio.play();
                if (playPromise !== undefined) {
                    await playPromise;
                    this.audio.pause();
                    this.audio.currentTime = 0;
                    this.audio.volume = 0.7;
                }
            }
            
            this.unlocked = true;
            console.log('[NotificationSound] ✅ Audio unlocked');
        } catch (e) {
            console.warn('[NotificationSound] Failed to unlock audio:', e);
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

            // Unlock audio if not unlocked
            if (!this.unlocked) {
                await this.unlock();
            }

            // If already playing, don't overlap
            if (this.isPlaying) {
                console.log('[NotificationSound] Sound already playing, skipping...');
                return;
            }

            console.log('[NotificationSound] 🔔 Playing notification sound...');
            this.isPlaying = true;

            // Resume audio context if suspended
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Try to play the audio file first
            if (this.audio && !this.audio.error) {
                try {
                    this.audio.currentTime = 0;
                    this.audio.volume = 0.7;
                    
                    const playPromise = this.audio.play();
                    
                    if (playPromise !== undefined) {
                        await playPromise;
                        console.log('[NotificationSound] ✅ Notification sound played (Audio file)');
                        
                        // Reset playing state when sound ends
                        this.audio.onended = () => {
                            this.isPlaying = false;
                        };
                        
                        // Fallback timeout in case onended doesn't fire
                        setTimeout(() => {
                            this.isPlaying = false;
                        }, 3000);
                        
                        return;
                    }
                } catch (error) {
                    console.warn('[NotificationSound] Audio file playback failed:', error);
                }
            }

            // Fallback to Web Audio API beep
            await this.playWithWebAudio();
            
        } catch (error) {
            console.error('[NotificationSound] Failed to play sound:', error);
            this.isPlaying = false;
        }
    }

    /**
     * Play using Web Audio API (fallback)
     */
    async playWithWebAudio() {
        try {
            // Create or reuse audio context
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const audioContext = this.audioContext;

            // Resume context if suspended
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

            // Reset playing state after sound completes
            setTimeout(() => {
                this.isPlaying = false;
            }, 600);

            console.log('[NotificationSound] ✅ Notification sound played (Web Audio beep)');
        } catch (error) {
            console.error('[NotificationSound] Web Audio failed:', error);
            this.isPlaying = false;
            throw error;
        }
    }

    /**
     * Stop currently playing sound
     */
    stop() {
        console.log('[NotificationSound] 🛑 Stopping sound...');
        
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
        this.isPlaying = false;
    }
}

// Export singleton instance
const notificationSound = new NotificationSound();

// Auto-initialize and unlock audio on page load
if (typeof window !== 'undefined') {
    // Initialize on page load
    window.addEventListener('load', () => {
        notificationSound.initialize();
    });

    // Unlock audio on first user interaction
    const unlockAudio = () => {
        notificationSound.initialize();
        notificationSound.unlock();
    };

    // Listen for various user interactions
    ['click', 'touchstart', 'touchend', 'keydown'].forEach(event => {
        document.addEventListener(event, unlockAudio, { once: true });
    });
}

export default notificationSound;

// Named exports for convenience
export const playNotificationSound = () => notificationSound.play();
export const stopNotificationSound = () => notificationSound.stop();