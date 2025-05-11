<script setup>
import { ref, onMounted } from 'vue';
import { spotifyApi } from '../services/spotifyAuth';
import { useSongStore } from '../stores/song';
import { useAuthStore } from '../stores/auth';

const songStore = useSongStore();
const authStore = useAuthStore();
const likedSongs = ref([]);
const isLoading = ref(true);
const error = ref(null);

const fetchLikedSongs = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    await authStore.initialize();
    const response = await spotifyApi.getMySavedTracks({
      limit: 50,
      market: 'US'
    });
    
    if (response?.items) {
      likedSongs.value = response.items.map(item => item.track);
    }
  } catch (error) {
    console.error('Error fetching liked songs:', error);
    error.value = 'Failed to load liked songs. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const playTrack = async (track) => {
  try {
    await songStore.playTrack(track);
  } catch (error) {
    console.error('Error playing track:', error);
  }
};

onMounted(() => {
  fetchLikedSongs();
});
</script>

<template>
  <div class="p-8">
    <div v-if="error" class="bg-red-600 text-white p-4 rounded-md mb-4">
      {{ error }}
      <button @click="error = null" class="ml-4 underline">Dismiss</button>
    </div>

    <div class="mb-8">
      <h1 class="text-white text-3xl font-bold mb-2">Liked Songs</h1>
      <p class="text-gray-400">{{ likedSongs.length }} songs</p>
    </div>

    <div v-if="isLoading" class="text-white text-center">
      Loading liked songs...
    </div>

    <div v-else-if="likedSongs.length === 0" class="text-white text-center">
      No liked songs found
    </div>

    <div v-else class="space-y-2">
      <div 
        v-for="track in likedSongs" 
        :key="track.id"
        class="flex items-center justify-between p-2 rounded-md hover:bg-[#282828] cursor-pointer"
        @click="playTrack(track)"
      >
        <div class="flex items-center">
          <img 
            :src="track.album?.images?.[0]?.url" 
            class="w-12 h-12 rounded-md"
            :alt="track.name"
          >
          <div class="ml-4">
            <div class="text-white font-semibold">{{ track.name }}</div>
            <div class="text-gray-400 text-sm">
              {{ track.artists?.map(artist => artist.name).join(', ') }}
            </div>
          </div>
        </div>
        <div class="text-gray-400 text-sm">
          {{ track.album?.name }}
        </div>
      </div>
    </div>
  </div>
</template> 