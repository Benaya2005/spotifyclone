<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { spotifyApi } from '../services/spotifyAuth';
import { useSongStore } from '../stores/song';
import { storeToRefs } from 'pinia';
import Play from 'vue-material-design-icons/Play.vue';
import Pause from 'vue-material-design-icons/Pause.vue';
import SkipBackward from 'vue-material-design-icons/SkipBackward.vue';
import SkipForward from 'vue-material-design-icons/SkipForward.vue';

const route = useRoute();
const router = useRouter();
const songStore = useSongStore();
const { isPlaying, currentTrack } = storeToRefs(songStore);
const track = ref(null);
const isLoading = ref(true);
const error = ref(null);
const isPlayerReady = ref(false);

const setupDevice = async () => {
  try {
    if (!songStore.deviceId) {
      console.log('Waiting for player to be ready...');
      // Wait for the player to be ready
      await new Promise(resolve => {
        const checkReady = setInterval(() => {
          if (songStore.deviceId) {
            clearInterval(checkReady);
            resolve();
          }
        }, 100);
      });
    }
    
    console.log('Using device ID:', songStore.deviceId);
    return songStore.deviceId;
  } catch (error) {
    console.error('Error setting up device:', error);
    return null;
  }
};

const fetchTrackDetails = async () => {
  try {
    const trackId = route.params.id;
    console.log('Fetching track:', trackId);

    const response = await spotifyApi.getTrack(trackId);
    console.log('Track response:', response);
    
    track.value = response;
  } catch (error) {
    console.error('Error fetching track details:', error);
    if (error.status === 404) {
      error.value = 'Track not found';
    } else if (error.status === 401) {
      error.value = 'Please log in again';
      router.push('/login');
    } else {
      error.value = 'Failed to load track content';
    }
  } finally {
    isLoading.value = false;
  }
};

const playTrack = async () => {
  try {
    const deviceId = await setupDevice();
    if (!deviceId) {
      error.value = 'Please wait for the player to be ready';
      return;
    }
    
    console.log('Playing track:', track.value);
    await spotifyApi.play({
      device_id: deviceId,
      uris: [track.value.uri]
    });
    
    songStore.currentTrack = track.value;
    songStore.isPlaying = true;
  } catch (error) {
    console.error('Error playing track:', error);
    if (error.status === 404) {
      error.value = 'Track not found';
    } else if (error.status === 401) {
      error.value = 'Please log in again';
      router.push('/login');
    } else {
      error.value = 'Failed to play track. Please make sure Spotify is open on your device.';
    }
  }
};

const togglePlayback = async () => {
  try {
    const deviceId = await setupDevice();
    if (!deviceId) {
      error.value = 'Please wait for the player to be ready';
      return;
    }

    if (isPlaying.value) {
      await spotifyApi.pause({ device_id: deviceId });
    } else {
      await spotifyApi.play({ device_id: deviceId });
    }
    songStore.isPlaying = !isPlaying.value;
  } catch (error) {
    console.error('Error toggling playback:', error);
  }
};

onMounted(() => {
  fetchTrackDetails();
});
</script>

<template>
  <div v-if="isLoading" class="p-8 text-white">Loading...</div>
  <div v-else-if="error" class="p-8 text-white">{{ error }}</div>
  <div v-else-if="track" class="p-8">
    <!-- Track Header -->
    <div class="flex items-center gap-8 mb-8">
      <img 
        :src="track.album.images[0]?.url" 
        class="w-48 h-48 rounded-md shadow-2xl"
        :alt="track.name"
      >
      <div class="flex flex-col">
        <div class="text-sm text-white mb-2">TRACK</div>
        <h1 class="text-white text-6xl font-bold mb-4">{{ track.name }}</h1>
        <div class="flex items-center mt-4 text-gray-300">
          <span class="font-bold text-white">{{ track.artists[0].name }}</span>
          <span class="mx-2">•</span>
          <span>{{ track.album.name }}</span>
        </div>
      </div>
    </div>

    <!-- Playback Controls -->
    <div class="flex items-center justify-center gap-8 mt-8">
      <button class="text-white hover:text-green-500 transition-colors">
        <SkipBackward fillColor="currentColor" :size="30" />
      </button>
      <button 
        @click="playTrack"
        class="bg-white rounded-full p-4 hover:scale-105 transition-transform"
      >
        <Play v-if="!isPlaying" fillColor="#181818" :size="30" />
        <Pause v-else fillColor="#181818" :size="30" />
      </button>
      <button class="text-white hover:text-green-500 transition-colors">
        <SkipForward fillColor="currentColor" :size="30" />
      </button>
    </div>

    <!-- Track Details -->
    <div class="mt-8 text-gray-300">
      <h2 class="text-2xl font-bold text-white mb-4">About this track</h2>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <h3 class="font-semibold mb-2">Artist</h3>
          <p>{{ track.artists[0].name }}</p>
        </div>
        <div>
          <h3 class="font-semibold mb-2">Album</h3>
          <p>{{ track.album.name }}</p>
        </div>
        <div>
          <h3 class="font-semibold mb-2">Release Date</h3>
          <p>{{ new Date(track.album.release_date).toLocaleDateString() }}</p>
        </div>
        <div>
          <h3 class="font-semibold mb-2">Duration</h3>
          <p>{{ Math.floor(track.duration_ms / 60000) }}:{{ ((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0') }}</p>
        </div>
      </div>
    </div>
  </div>
</template> 