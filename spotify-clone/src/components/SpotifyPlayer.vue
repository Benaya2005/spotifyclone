<script setup>
import { onMounted, ref } from 'vue';
import { useSongStore } from '../stores/song';
import { spotifyApi } from '../services/spotifyAuth';
import { useAuthStore } from '../stores/auth';

const songStore = useSongStore();
const authStore = useAuthStore();
const isReady = ref(false);
const player = ref(null);
const playerError = ref(null);

// Load the Spotify Web Playback SDK Script
const loadSpotifyScript = () => {
  return new Promise((resolve, reject) => {
    if (document.getElementById('spotify-player-script')) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'spotify-player-script';
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    
    script.onload = () => resolve();
    script.onerror = (error) => reject(error);
    
    document.body.appendChild(script);
  });
};

// Set this device as active
const setActiveDevice = async (deviceId) => {
  try {
    // First check if this device is already active
    const response = await spotifyApi.getMyDevices();
    const devices = response.devices;
    const currentDevice = devices.find(d => d.id === deviceId);
    console.log('Available devices:', devices);
    
    if (currentDevice?.is_active) {
      console.log('Device is already active');
      return true;
    }

    // If not active, transfer playback to this device
    await spotifyApi.transferMyPlayback([deviceId], { play: false });
    console.log('Transferred playback to device:', deviceId);
    
    // Wait for the transfer to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify the device is now active
    const verifyResponse = await spotifyApi.getMyDevices();
    const verifyDevices = verifyResponse.devices;
    const verifyDevice = verifyDevices.find(d => d.id === deviceId);
    
    if (!verifyDevice?.is_active) {
      console.error('Device activation verification failed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error setting active device:', error);
    return false;
  }
};

const initializePlayer = async () => {
  try {
    console.log('Initializing Spotify player...');
    
    // Wait for the SDK to be ready
    if (!window.Spotify) {
      console.log('Waiting for Spotify SDK...');
      await new Promise((resolve) => {
        window.onSpotifyWebPlaybackSDKReady = resolve;
      });
    }

    const token = authStore.token;
    if (!token) {
      console.error('No access token available');
      playerError.value = 'No access token available';
      return;
    }

    console.log('Creating Spotify player instance...');
    player.value = new Spotify.Player({
      name: 'Spotify Clone Web Player',
      getOAuthToken: async (cb) => {
        let token = spotifyApi.getAccessToken();
        try {
          // Try to refresh token if needed
          const refreshed = await authStore.initialize();
          if (refreshed) {
            token = spotifyApi.getAccessToken() || '';
            console.log('Token refreshed successfully for player');
          }
        } catch (error) {
          console.error('Error refreshing access token:', error);
        }
        cb(token || '');
      },
      volume: 1.0 // Set initial volume to maximum
    });

    // Error handling
    player.value.addListener('initialization_error', ({ message }) => {
      console.error('Failed to initialize:', message);
      playerError.value = `Initialization error: ${message}`;
      isReady.value = false;
    });

    player.value.addListener('authentication_error', ({ message }) => {
      console.error('Failed to authenticate:', message);
      playerError.value = `Authentication error: ${message}`;
      isReady.value = false;
    });

    player.value.addListener('account_error', ({ message }) => {
      console.error('Failed to validate Spotify account:', message);
      playerError.value = `Premium required: ${message}`;
      isReady.value = false;
    });

    player.value.addListener('playback_error', ({ message }) => {
      console.error('Failed to perform playback:', message);
      playerError.value = `Playback error: ${message}`;
    });

    // Playback status updates
    player.value.addListener('player_state_changed', (state) => {
      console.log('Player state changed:', state);
      if (!state) return;
      
      songStore.isPlaying = !state.paused;
      songStore.currentTrack = state.track_window.current_track;
      songStore.currentArtist = state.track_window.current_track.artists[0];
    });

    // Ready
    player.value.addListener('ready', async ({ device_id }) => {
      console.log('Ready with Device ID:', device_id);
      
      try {
        // Set the device ID in the store
        songStore.deviceId = device_id;
        
        // Try to set this device as active
        const success = await setActiveDevice(device_id);
        if (success) {
          isReady.value = true;
          playerError.value = null;
          
          // Set volume to maximum
          await player.value.setVolume(1.0);
          console.log('Volume set to maximum');
          
          // Initialize playback state
          const state = await player.value.getCurrentState();
          console.log('Initial playback state:', state);
          if (state) {
            songStore.isPlaying = !state.paused;
            songStore.currentTrack = state.track_window.current_track;
          }
        } else {
          playerError.value = 'Failed to set device as active';
          isReady.value = false;
        }
      } catch (error) {
        console.error('Error in ready handler:', error);
        playerError.value = 'Error in ready handler';
        isReady.value = false;
      }
    });

    // Not Ready
    player.value.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline:', device_id);
      isReady.value = false;
      songStore.deviceId = null;
    });

    // Connect to the player
    console.log('Connecting to Spotify player...');
    const connected = await player.value.connect();
    if (connected) {
      console.log('Successfully connected to Spotify!');
    } else {
      console.error('Failed to connect to Spotify');
      playerError.value = 'Failed to connect to player';
      isReady.value = false;
    }
  } catch (error) {
    console.error('Error initializing player:', error);
    playerError.value = 'Error initializing player';
    isReady.value = false;
  }
};

onMounted(async () => {
  try {
    await loadSpotifyScript();
    await initializePlayer();
  } catch (error) {
    console.error('Error in onMounted:', error);
    playerError.value = 'Error initializing player';
    isReady.value = false;
  }
});
</script>

<template>
  <div v-if="isReady" class="hidden"></div>
</template>