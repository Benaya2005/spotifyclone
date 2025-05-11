import { defineStore } from 'pinia'
import { spotifyApi } from '../services/spotifyAuth'

export const useSongStore = defineStore('song', {
  state: () => ({
    isPlaying: false,
    audio: null,
    currentTrack: null,
    currentArtist: null,
    deviceId: null,
    isInitializing: false,
    tokenRefreshAttempts: 0
  }),
  actions: {
    async refreshTokenAndRetry(action) {
      try {
        if (this.tokenRefreshAttempts >= 3) {
          console.error('Too many token refresh attempts, redirecting to login...');
          window.location.href = '/login';
          return;
        }

        this.tokenRefreshAttempts++;
        console.log(`Attempting to refresh token (attempt ${this.tokenRefreshAttempts})...`);
        
        await spotifyApi.refreshAccessToken();
        console.log('Token refreshed successfully');
        
        this.tokenRefreshAttempts = 0;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          await spotifyApi.getMyCurrentPlaybackState();
          console.log('Token verification successful');
        } catch (error) {
          console.error('Token verification failed:', error);
          throw new Error('Token verification failed');
        }
        
        return action();
      } catch (error) {
        console.error('Error in refreshTokenAndRetry:', error);
        if (this.tokenRefreshAttempts < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.refreshTokenAndRetry(action);
        }
        throw new Error('Failed to refresh token after multiple attempts');
      }
    },
    async initializeDevice() {
      if (this.deviceId || this.isInitializing) return;
      
      this.isInitializing = true;
      try {
        console.log('Starting device initialization...');
        
        // Get available devices
        const devices = await spotifyApi.getMyDevices();
        console.log('Available devices:', devices);
        
        if (devices.devices.length > 0) {
          this.deviceId = devices.devices[0].id;
          console.log('Selected device:', this.deviceId);
          
          // Transfer playback
          await spotifyApi.transferMyPlayback([this.deviceId], { play: false });
          console.log('Playback transfer initiated');
          
          // Wait for transfer to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verify transfer
          const updatedDevices = await spotifyApi.getMyDevices();
          const activeDevice = updatedDevices.devices.find(d => d.is_active);
          console.log('Active device after transfer:', activeDevice);
          
          if (!activeDevice || activeDevice.id !== this.deviceId) {
            console.warn('Device transfer verification failed, but continuing anyway');
          }
        } else {
          throw new Error('No available devices found');
        }
      } catch (error) {
        console.error('Error initializing device:', error);
        throw error;
      } finally {
        this.isInitializing = false;
      }
    },
    async playTrack(track) {
      try {
        if (!track || !track.uri) {
          console.error('Invalid track object:', track);
          throw new Error('Invalid track object');
        }

        if (!this.deviceId) {
          console.log('No device ID, initializing...');
          await this.initializeDevice();
        }
        
      if (!this.deviceId) {
          throw new Error('Failed to initialize device');
        }
        
        console.log('Playing track:', track.name, 'on device:', this.deviceId);
        
        // Ensure the device is active
        try {
          await spotifyApi.transferMyPlayback([this.deviceId], { play: false });
          console.log('Playback transfer initiated');
          
          // Wait for transfer to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error('Error transferring playback:', error);
          // Continue anyway as the device might already be active
        }
        
        // Play the track
      try {
        await spotifyApi.play({
          device_id: this.deviceId,
          uris: [track.uri]
        });
          
        this.currentTrack = track;
        this.isPlaying = true;
          console.log('Track started playing');
          
          // Wait for playback to start
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verify playback state with retries
          let retries = 3;
          let playback = null;
          
          while (retries > 0) {
            try {
              playback = await spotifyApi.getMyCurrentPlaybackState();
              console.log('Current playback state:', playback);
              
              if (playback) {
                // Check if the device is active
                if (playback.device && playback.device.id === this.deviceId) {
                  console.log('Device is active');
                  
                  // Check if the track is playing
                  if (playback.is_playing) {
                    console.log('Track is playing');
                    return;
                  } else {
                    console.log('Track is not playing yet');
                  }
                } else {
                  console.log('Device is not active');
                }
              } else {
                console.log('No playback state available');
              }
            } catch (error) {
              console.warn('Error getting playback state:', error);
            }
            
            retries--;
            if (retries > 0) {
              console.log(`Playback verification failed, retrying... (${retries} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          // If we get here, playback verification failed
          console.warn('Playback verification failed after retries, but track might still be playing');
          // Don't throw an error here, as the track might still be playing
          return;
        } catch (error) {
          console.error('Error playing track:', error);
          // Check if it's a JSON parsing error
          if (error.message && error.message.includes('Unexpected token')) {
            return this.refreshTokenAndRetry(() => this.playTrack(track));
          }
          throw error;
        }
      } catch (error) {
        console.error('Error in playTrack:', error);
        throw error;
      }
    },
    async togglePlayback() {
      try {
        if (!this.deviceId) {
          console.log('No device ID, initializing...');
          await this.initializeDevice();
        }

        // First verify the token is valid and get current state
        let currentState;
        try {
          currentState = await spotifyApi.getMyCurrentPlaybackState();
          console.log('Current playback state:', currentState);
          
          if (currentState) {
            this.isPlaying = currentState.is_playing;
            this.currentTrack = currentState.item;
            this.currentArtist = currentState.item?.artists[0];
          }
        } catch (error) {
          console.log('Token verification failed, attempting refresh...');
          await this.refreshTokenAndRetry(() => this.togglePlayback());
          return;
        }
        
        // If we get here, token is valid, proceed with toggle
        if (this.isPlaying) {
          try {
            console.log('Attempting to pause playback...');
          await spotifyApi.pause({ device_id: this.deviceId });
            
            // Wait for pause to take effect
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verify pause worked
            const pauseState = await spotifyApi.getMyCurrentPlaybackState();
            if (pauseState) {
              this.isPlaying = pauseState.is_playing;
              console.log('Pause state verified:', this.isPlaying);
            } else {
              this.isPlaying = false;
            }
          } catch (error) {
            console.error('Error in pause operation:', error);
            if (error.message && error.message.includes('Unexpected token')) {
              console.log('Token error in pause, attempting refresh...');
              await this.refreshTokenAndRetry(() => this.togglePlayback());
              return;
            }
            this.isPlaying = false;
          }
        } else {
          try {
            console.log('Attempting to start playback...');
            
            // If we have a current track, play it
            if (this.currentTrack) {
              try {
                await spotifyApi.play({
                  device_id: this.deviceId,
                  uris: [this.currentTrack.uri]
                });
                console.log('Started playing current track:', this.currentTrack.name);
              } catch (error) {
                console.error('Error playing current track:', error);
                // If that fails, try just resuming playback
                await spotifyApi.play({ device_id: this.deviceId });
              }
            } else {
              // Just resume playback
          await spotifyApi.play({ device_id: this.deviceId });
            }
            
            // Wait for play to take effect
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verify play worked
            const playState = await spotifyApi.getMyCurrentPlaybackState();
            if (playState) {
              this.isPlaying = playState.is_playing;
              this.currentTrack = playState.item;
              this.currentArtist = playState.item?.artists[0];
              console.log('Play state verified:', {
                isPlaying: this.isPlaying,
                track: this.currentTrack?.name,
                artist: this.currentArtist?.name
              });
            } else {
              this.isPlaying = true;
            }
          } catch (error) {
            console.error('Error in play operation:', error);
            if (error.message && error.message.includes('Unexpected token')) {
              console.log('Token error in play, attempting refresh...');
              await this.refreshTokenAndRetry(() => this.togglePlayback());
              return;
            }
            this.isPlaying = true;
          }
        }
      } catch (error) {
        console.error('Error in togglePlayback:', error);
        if (error.message && error.message.includes('Unexpected token')) {
          console.log('Token error in togglePlayback, attempting refresh...');
          await this.refreshTokenAndRetry(() => this.togglePlayback());
          return;
        }
        this.isPlaying = !this.isPlaying;
      }
    },
    async nextTrack() {
      if (!this.deviceId) {
        console.log('No device ID, initializing...');
        await this.initializeDevice();
      }
      
      try {
        await spotifyApi.skipToNext({ device_id: this.deviceId });
        await this.fetchCurrentPlayback();
      } catch (error) {
        console.error('Error skipping to next track:', error);
        // Check if it's a JSON parsing error
        if (error.message && error.message.includes('Unexpected token')) {
          return this.refreshTokenAndRetry(() => this.nextTrack());
        }
        throw error;
      }
    },
    async previousTrack() {
      if (!this.deviceId) {
        console.log('No device ID, initializing...');
        await this.initializeDevice();
      }
      
      try {
        await spotifyApi.skipToPrevious({ device_id: this.deviceId });
        await this.fetchCurrentPlayback();
      } catch (error) {
        console.error('Error skipping to previous track:', error);
        // Check if it's a JSON parsing error
        if (error.message && error.message.includes('Unexpected token')) {
          return this.refreshTokenAndRetry(() => this.previousTrack());
        }
        throw error;
      }
    },
    async fetchCurrentPlayback() {
      try {
        const playback = await spotifyApi.getMyCurrentPlaybackState();
        if (playback) {
          this.isPlaying = playback.is_playing;
          this.currentTrack = playback.item;
          this.currentArtist = playback.item?.artists[0];
          console.log('Current playback state:', {
            isPlaying: this.isPlaying,
            track: this.currentTrack?.name,
            artist: this.currentArtist?.name,
            progress: playback.progress_ms,
            duration: playback.item?.duration_ms
          });
          return playback;
        }
      } catch (error) {
        console.error('Error fetching playback state:', error);
        if (error.message && error.message.includes('Unexpected token')) {
          console.log('Token error in fetchCurrentPlayback, attempting refresh...');
          await this.refreshTokenAndRetry(() => this.fetchCurrentPlayback());
          return null;
        }
        throw error;
      }
      return null;
    },
    async seekTo(position) {
      try {
        if (!this.deviceId) {
          console.log('No device ID, initializing...');
          await this.initializeDevice();
        }

        console.log('Seeking to position:', position);
        
        try {
          await spotifyApi.seek(Math.floor(position), { device_id: this.deviceId });
          console.log('Seek successful');
          
          // Wait for seek to take effect
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Update the current playback state after seeking
          const state = await this.fetchCurrentPlayback();
          if (state) {
            console.log('Playback state after seek:', {
              position: state.progress_ms,
              track: state.item?.name
            });
          }
        } catch (error) {
          console.error('Error in seek operation:', error);
          if (error.message && error.message.includes('Unexpected token')) {
            console.log('Token error in seek, attempting refresh...');
            await this.refreshTokenAndRetry(() => this.seekTo(position));
            return;
          }
          throw error;
        }
      } catch (error) {
        console.error('Error in seekTo:', error);
        if (error.message && error.message.includes('Unexpected token')) {
          console.log('Token error in seekTo, attempting refresh...');
          await this.refreshTokenAndRetry(() => this.seekTo(position));
          return;
        }
        throw error;
      }
    }
  },
  persist: true
})