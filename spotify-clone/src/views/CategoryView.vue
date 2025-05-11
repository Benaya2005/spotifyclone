<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { spotifyApi } from '../services/spotifyAuth';

const route = useRoute();
const router = useRouter();
const category = ref(null);
const playlists = ref([]);
const isLoading = ref(true);
const error = ref(null);

const fetchCategoryDetails = async () => {
  try {
    const categoryId = route.params.id;
    console.log('Fetching category:', categoryId);

    // Reset state
    isLoading.value = true;
    error.value = null;
    category.value = null;
    playlists.value = [];

    // Fetch category details
    const categoryResponse = await spotifyApi.getCategory(categoryId, { country: 'US' });
    console.log('Category response:', categoryResponse);
    category.value = categoryResponse;

    // Fetch category playlists
    const playlistsResponse = await spotifyApi.getCategoryPlaylists(categoryId, {
      country: 'US',
      limit: 20,
      offset: 0
    });
    console.log('Playlists response:', playlistsResponse);
    
    if (playlistsResponse?.playlists?.items) {
      playlists.value = playlistsResponse.playlists.items;
    } else {
      console.error('No playlists found in response:', playlistsResponse);
      error.value = 'No playlists found for this category';
    }
  } catch (error) {
    console.error('Error fetching category details:', error);
    if (error.status === 404) {
      error.value = 'Category not found';
    } else if (error.status === 401) {
      error.value = 'Please log in again';
      router.push('/login');
    } else {
      error.value = 'Failed to load category content';
    }
  } finally {
    isLoading.value = false;
  }
};

const goToPlaylist = (playlist) => {
  router.push(`/playlist/${playlist.id}`);
};

// Watch for route changes
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      fetchCategoryDetails();
    }
  }
);

onMounted(() => {
  fetchCategoryDetails();
});
</script>

<template>
  <div v-if="isLoading" class="p-8 text-white">Loading...</div>
  <div v-else-if="error" class="p-8 text-white">{{ error }}</div>
  <div v-else-if="category" class="p-8">
    <!-- Category Header -->
    <div class="flex items-end gap-8 mb-8">
      <img 
        :src="category.icons[0]?.url" 
        class="w-48 h-48 rounded-md shadow-2xl"
        :alt="category.name"
      >
      <div class="flex flex-col">
        <div class="text-sm text-white mb-2">CATEGORY</div>
        <h1 class="text-white text-6xl font-bold mb-4">{{ category.name }}</h1>
      </div>
    </div>

    <!-- Playlists Grid -->
    <div class="mt-8">
      <h2 class="text-white text-2xl font-semibold mb-4">Featured Playlists</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <div 
          v-for="playlist in playlists" 
          :key="playlist.id"
          @click="goToPlaylist(playlist)"
          class="bg-[#181818] p-4 rounded-md hover:bg-[#282828] cursor-pointer"
        >
          <img 
            :src="playlist.images[0]?.url" 
            class="w-full aspect-square object-cover rounded-md mb-4"
            :alt="playlist.name"
          >
          <div class="text-white font-semibold truncate">{{ playlist.name }}</div>
          <div class="text-gray-400 text-sm truncate">{{ playlist.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template> 