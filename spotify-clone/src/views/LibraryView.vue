<template>
  <div class="p-8">
    <div v-if="isLoading" class="text-white">Loading...</div>
    <div v-else>
      <h2 class="text-white text-2xl font-semibold mb-4">Your Playlists</h2>
      
      <div v-if="userPlaylists.length === 0" class="text-gray-400">
        You don't have any playlists yet.
      </div>
      
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div 
          v-for="playlist in userPlaylists" 
          :key="playlist.id"
          @click="goToPlaylist(playlist)"
          class="bg-[#111111] p-4 rounded-md hover:bg-[#252525] cursor-pointer"
        >
          <img 
            :src="playlist.images[0]?.url || 'https://via.placeholder.com/150'" 
            alt="Playlist cover"
            class="w-full aspect-square object-cover rounded-md"
          >
          <h3 class="text-white font-semibold mt-2 truncate">{{ playlist.name }}</h3>
          <p class="text-gray-400 text-sm truncate">
            {{ playlist.description || `By ${playlist.owner.display_name}` }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { spotifyApi } from '../services/spotifyAuth';
import { useRouter } from 'vue-router';

const router = useRouter();
const userPlaylists = ref([]);
const isLoading = ref(true);

const checkAndRefreshToken = async () => {
  let token = spotifyApi.getAccessToken();
  if (!token) {
    console.log('No access token found. Attempting to refresh...');
    try {
      token = await spotifyApi.refreshAccessToken();
      spotifyApi.setAccessToken(token);
      console.log('Access token refreshed');
    } catch (err) {
      console.error('Error refreshing token:', err);
      router.push('/login');
      throw new Error('Failed to refresh token');
    }
  }
  return token;
};

const fetchUserPlaylists = async () => {
  try {
    await checkAndRefreshToken();
    const response = await spotifyApi.getUserPlaylists();
    
    if (response.items) {
      userPlaylists.value = response.items;
    } else {
      console.error("No playlists found", response);
    }
  } catch (error) {
    console.error('Error fetching user playlists:', error);
    if (error.status === 401) {
      router.push('/login');
    }
  } finally {
    isLoading.value = false;
  }
};

const goToPlaylist = (playlist) => {
  router.push(`/playlist/${playlist.id}`);
};

onMounted(() => {
  fetchUserPlaylists();
});
</script>