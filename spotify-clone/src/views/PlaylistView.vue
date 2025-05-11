<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { spotifyApi } from '../services/spotifyAuth';
import { useSongStore } from '../stores/song';
import { storeToRefs } from 'pinia';
import Play from 'vue-material-design-icons/Play.vue';
import Pause from 'vue-material-design-icons/Pause.vue';

const route = useRoute();
const router = useRouter();
const songStore = useSongStore();
const { isPlaying, currentTrack } = storeToRefs(songStore);
const playlist = ref(null);
const tracks = ref([]);
const isLoading = ref(true);
const error = ref(null);

const setupDevice = async () => {
  try {
    const devices = await spotifyApi.getMyDevices();
    if (devices.devices.length > 0) {
      const device = devices.devices[0];
      await songStore.transferPlayback(device.id);
    } else {
      console.error('No devices found');
      error.value = 'No playback devices found. Please open Spotify on your device.';
    }
  } catch (error) {
    console.error('Error setting up device:', error);
  }
};

const fetchPlaylistDetails = async () => {
  try {
    const playlistId = route.params.id;
    console.log('Fetching playlist:', playlistId);

    // Reset state
    isLoading.value = true;
    error.value = null;
    playlist.value = null;
    tracks.value = [];

    const response = await spotifyApi.getPlaylist(playlistId);
    console.log('Playlist response:', response);
    
    playlist.value = response;
    tracks.value = response.tracks.items;
  } catch (error) {
    console.error('Error fetching playlist details:', error);
    if (error.status === 404) {
      error.value = 'Playlist not found';
    } else if (error.status === 401) {
      error.value = 'Please log in again';
      router.push('/login');
    } else {
      error.value = 'Failed to load playlist content';
    }
  } finally {
    isLoading.value = false;
  }
};

const playTrack = async (track) => {
  try {
    await setupDevice();
    await songStore.playTrack(track.track);
  } catch (error) {
    console.error('Error playing track:', error);
  }
};

const isCurrentTrack = (track) => {
  return currentTrack.value?.id === track.track.id;
};

const goToTrack = (track) => {
  router.push(`/track/${track.id}`);
};

// Watch for route changes
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      fetchPlaylistDetails();
    }
  }
);

onMounted(() => {
  fetchPlaylistDetails();
});
</script>

<template>
  <div v-if="isLoading" class="p-8 text-white">Loading...</div>
  <div v-else-if="error" class="p-8 text-white">{{ error }}</div>
  <div v-else-if="playlist" class="p-8">
    <!-- Playlist Header -->
    <div class="flex items-end gap-8 mb-8">
      <img 
        :src="playlist.images[0]?.url" 
        class="w-48 h-48 rounded-md shadow-2xl"
        :alt="playlist.name"
      >
      <div class="flex flex-col">
        <div class="text-sm text-white mb-2">PLAYLIST</div>
        <h1 class="text-white text-6xl font-bold mb-4">{{ playlist.name }}</h1>
        <p class="text-gray-300">{{ playlist.description }}</p>
        <div class="flex items-center mt-4 text-gray-300">
          <span class="font-bold text-white">{{ playlist.owner.display_name }}</span>
          <span class="mx-2">•</span>
          <span>{{ tracks.length }} songs</span>
        </div>
      </div>
    </div>

    <!-- Tracks List -->
    <div class="mt-8">
      <div class="grid grid-cols-[16px_4fr_3fr_3fr_16px] gap-4 px-4 py-2 text-gray-400 border-b border-gray-800">
        <div>#</div>
        <div>TITLE</div>
        <div>ALBUM</div>
        <div>DATE ADDED</div>
        <div>DURATION</div>
      </div>

      <div 
        v-for="(item, index) in tracks" 
        :key="item.track.id"
        @click="goToTrack(item.track)"
        class="grid grid-cols-[16px_4fr_3fr_3fr_16px] gap-4 px-4 py-2 text-gray-300 hover:bg-[#282828] rounded-md cursor-pointer group"
        :class="{ 'bg-[#282828]': isCurrentTrack(item.track) }"
      >
        <div class="flex items-center">
          <div v-if="isCurrentTrack(item.track)" class="text-green-500">
            {{ index + 1 }}
          </div>
          <div v-else class="group-hover:hidden">
            {{ index + 1 }}
          </div>
          <button 
            v-if="!isCurrentTrack(item.track)" 
            class="hidden group-hover:block text-white"
            @click="playTrack(item)"
          >
            <Play fillColor="#FFFFFF" :size="20" />
          </button>
          <button 
            v-else 
            class="group-hover:block text-green-500"
            @click="playTrack(item)"
          >
            <Pause v-if="isPlaying" fillColor="#1DB954" :size="20" />
            <Play v-else fillColor="#1DB954" :size="20" />
          </button>
        </div>
        <div class="flex items-center">
          <img 
            :src="item.track.album.images[0]?.url" 
            class="w-10 h-10 rounded mr-4"
            :alt="item.track.name"
          >
          <div>
            <div class="text-white" :class="{ 'text-green-500': isCurrentTrack(item.track) }">
              {{ item.track.name }}
            </div>
            <div class="text-sm">{{ item.track.artists[0].name }}</div>
          </div>
        </div>
        <div class="flex items-center">{{ item.track.album.name }}</div>
        <div>{{ new Date(item.added_at).toLocaleDateString() }}</div>
        <div>{{ Math.floor(item.track.duration_ms / 60000) }}:{{ ((item.track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0') }}</div>
      </div>
    </div>
  </div>
</template> 