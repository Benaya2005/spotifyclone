<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { spotifyApi } from '../services/spotifyAuth';
import CategorySelect from '../components/CategorySelect.vue';
import Magnify from 'vue-material-design-icons/Magnify.vue';
import { useSongStore } from '../stores/song';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const songStore = useSongStore();
const authStore = useAuthStore();

const searchQuery = ref('');
const isLoading = ref(false);
const categories = ref([]);
const error = ref(null);
const isInitialized = ref(false);
const searchResults = ref({
  tracks: [],
  artists: [],
  albums: [],
  playlists: []
});

// Add debounce function
let searchTimeout = null;
const debouncedSearch = (value) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    search();
  }, 300);
};

// Watch for changes in searchQuery
watch(searchQuery, (newValue) => {
  if (newValue.trim() && isInitialized.value) {
    debouncedSearch(newValue);
  } else {
    searchResults.value = {
      tracks: [],
      artists: [],
      albums: [],
      playlists: []
    };
  }
});

const fetchCategories = async () => {
  try {
    error.value = null;
    const response = await spotifyApi.getCategories({
      country: 'US',
      limit: 20
    });
    if (response?.categories?.items) {
      categories.value = response.categories.items;
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    error.value = 'Failed to load categories. Please try again.';
  }
};

const search = async () => {
  if (!searchQuery.value.trim() || !isInitialized.value) {
    searchResults.value = {
      tracks: [],
      artists: [],
      albums: [],
      playlists: []
    };
    return;
  }

  isLoading.value = true;
  error.value = null;
  
  try {
    await authStore.initialize();
    const token = authStore.token;
    
    if (!token) {
      throw new Error('No access token available');
    }

    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery.value)}&type=track,artist,album,playlist&limit=20&market=US`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        await authStore.initialize();
        return search();
      }
      throw new Error(`Search failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data) {
      throw new Error('No data received from API');
    }

    searchResults.value = {
      tracks: data.tracks?.items || [],
      artists: data.artists?.items || [],
      albums: data.albums?.items || [],
      playlists: data.playlists?.items || []
    };

  } catch (error) {
    console.error('Error in search:', error);
    error.value = error.message;
    if (error.message.includes('401')) {
      router.push('/login');
    }
    searchResults.value = {
      tracks: [],
      artists: [],
      albums: [],
      playlists: []
    };
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

const goToAlbum = (album) => {
  router.push(`/album/${album.id}`);
};

const goToArtist = (artist) => {
  router.push(`/artist/${artist.id}`);
};

const goToPlaylist = (playlist) => {
  router.push(`/playlist/${playlist.id}`);
};

const goToCategory = (category) => {
  router.push(`/category/${category.id}`);
};

// Initialize auth store
onMounted(async () => {
  try {
    isLoading.value = true;
    await authStore.initialize();
    await fetchCategories();
    isInitialized.value = true;
  } catch (error) {
    console.error('Error during initialization:', error);
    error.value = 'Failed to initialize. Please try refreshing the page.';
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="p-8">
    <div v-if="error" class="bg-red-600 text-white p-4 rounded-md mb-4">
      {{ error }}
      <button @click="error = null" class="ml-4 underline">Dismiss</button>
    </div>

    <div class="relative mb-8">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="What do you want to listen to?"
        class="w-full bg-[#242424] text-white px-4 py-3 rounded-md focus:outline-none"
        :disabled="!isInitialized"
      >
      <button 
        @click="search"
        class="absolute right-3 top-3 text-gray-400 hover:text-white"
        :disabled="!isInitialized"
      >
        <Magnify fillColor="#FFFFFF" :size="24" />
      </button>
    </div>

    <template v-if="!isInitialized || isLoading">
      <div class="text-white text-center">
        {{ !isInitialized ? 'Loading...' : 'Searching...' }}
      </div>
    </template>

    <template v-else>
      <template v-if="searchQuery">
        <template v-if="searchResults.tracks.length === 0 && 
          searchResults.artists.length === 0 && 
          searchResults.albums.length === 0 && 
          searchResults.playlists.length === 0">
          <div class="text-white text-center">No results found for "{{ searchQuery }}"</div>
        </template>

        <template v-else>
          <!-- Tracks Section -->
          <div v-if="searchResults.tracks.length > 0" class="mb-8">
            <h2 class="text-white text-2xl font-semibold mb-4">Songs</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div 
                v-for="track in searchResults.tracks" 
                :key="track?.id"
                class="bg-[#181818] p-4 rounded-md hover:bg-[#282828] cursor-pointer"
                @click="playTrack(track)"
              >
                <div class="flex items-center">
                  <img :src="track?.album?.images?.[0]?.url" class="w-16 h-16 rounded-md">
                  <div class="ml-4">
                    <div class="text-white font-semibold">{{ track?.name }}</div>
                    <div class="text-gray-400 text-sm">{{ track?.artists?.[0]?.name }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Artists Section -->
          <div v-if="searchResults.artists.length > 0" class="mb-8">
            <h2 class="text-white text-2xl font-semibold mb-4">Artists</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div 
                v-for="artist in searchResults.artists" 
                :key="artist?.id"
                class="text-center cursor-pointer"
                @click="goToArtist(artist)"
              >
                <img 
                  :src="artist?.images?.[0]?.url || 'https://i.scdn.co/image/ab6761610000e5eb0f08b008da9d91574819a694'" 
                  class="w-full rounded-full mb-2"
                >
                <div class="text-white font-semibold">{{ artist?.name }}</div>
                <div class="text-gray-400 text-sm">Artist</div>
              </div>
            </div>
          </div>

          <!-- Albums Section -->
          <div v-if="searchResults.albums.length > 0" class="mb-8">
            <h2 class="text-white text-2xl font-semibold mb-4">Albums</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div 
                v-for="album in searchResults.albums" 
                :key="album?.id"
                class="cursor-pointer"
                @click="goToAlbum(album)"
              >
                <img :src="album?.images?.[0]?.url" class="w-full rounded-md mb-2">
                <div class="text-white font-semibold">{{ album?.name }}</div>
                <div class="text-gray-400 text-sm">{{ album?.artists?.[0]?.name }}</div>
              </div>
            </div>
          </div>

          <!-- Playlists Section -->
          <div v-if="searchResults.playlists.length > 0" class="mb-8">
            <h2 class="text-white text-2xl font-semibold mb-4">Playlists</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div 
                v-for="playlist in searchResults.playlists" 
                :key="playlist?.id"
                class="cursor-pointer"
                @click="goToPlaylist(playlist)"
              >
                <img :src="playlist?.images?.[0]?.url" class="w-full rounded-md mb-2">
                <div class="text-white font-semibold">{{ playlist?.name }}</div>
                <div class="text-gray-400 text-sm">By {{ playlist?.owner?.display_name }}</div>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- Browse Categories (shown when no search is active) -->
      <template v-else>
        <button
          type="button"
          class="text-white text-2xl font-semibold hover:underline cursor-pointer mb-4"
        >
          Browse all
        </button>

        <div class="grid xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-6">
          <div 
            v-for="category in categories" 
            :key="category.id"
          >
            <CategorySelect 
              :category="category.name" 
              :image="category.icons[0]?.url"
              :id="category.id"
            />
          </div>
        </div>
      </template>
    </template>
  </div>
</template>