<script setup>
import { ref, onMounted } from 'vue';
import { spotifyApi } from '../services/spotifyAuth';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { useSongStore } from '../stores/song';

const router = useRouter();
const authStore = useAuthStore();
const songStore = useSongStore();

const playlistName = ref('');
const playlistDescription = ref('');
const isPublic = ref(true);
const isLoading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const searchResults = ref([]);
const selectedTracks = ref([]);
const isSearching = ref(false);

const createPlaylist = async () => {
  try {
    if (!playlistName.value.trim()) {
      error.value = 'Please enter a playlist name';
      return;
    }

    isLoading.value = true;
    error.value = null;

    // Get user profile to get user ID
    const userProfile = await spotifyApi.getMe();
    if (!userProfile?.id) {
      throw new Error('Could not get user profile');
    }
    
    // Create the playlist with the correct user ID and options
    const playlist = await spotifyApi.createPlaylist(userProfile.id, {
      name: playlistName.value,
      description: playlistDescription.value,
      public: isPublic.value
    });

    // Add tracks to the playlist if any are selected
    if (selectedTracks.value.length > 0) {
      const trackUris = selectedTracks.value.map(track => track.uri);
      await spotifyApi.addTracksToPlaylist(playlist.id, trackUris);
    }

    // Navigate to the new playlist
    router.push(`/playlist/${playlist.id}`);
  } catch (error) {
    console.error('Error creating playlist:', error);
    error.value = 'Failed to create playlist. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const searchTracks = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  try {
    isSearching.value = true;
    const response = await spotifyApi.searchTracks(searchQuery.value, {
      limit: 20,
      market: 'US'
    });
    
    if (response?.tracks?.items) {
      searchResults.value = response.tracks.items;
    }
  } catch (error) {
    console.error('Error searching tracks:', error);
    error.value = 'Failed to search tracks. Please try again.';
  } finally {
    isSearching.value = false;
  }
};

const addTrack = (track) => {
  if (!selectedTracks.value.find(t => t.id === track.id)) {
    selectedTracks.value.push(track);
  }
};

const removeTrack = (trackId) => {
  selectedTracks.value = selectedTracks.value.filter(track => track.id !== trackId);
};

const playTrack = async (track) => {
  try {
    await songStore.playTrack(track);
  } catch (error) {
    console.error('Error playing track:', error);
  }
};
</script>

<template>
  <div class="p-8">
    <div v-if="error" class="bg-red-600 text-white p-4 rounded-md mb-4">
      {{ error }}
      <button @click="error = null" class="ml-4 underline">Dismiss</button>
    </div>

    <div class="max-w-2xl mx-auto">
      <h1 class="text-white text-3xl font-bold mb-8">Create New Playlist</h1>

      <!-- Playlist Details Form -->
      <div class="bg-[#181818] p-6 rounded-lg mb-8">
        <div class="mb-4">
          <label class="block text-white mb-2">Playlist Name</label>
          <input
            v-model="playlistName"
            type="text"
            class="w-full bg-[#242424] text-white px-4 py-2 rounded-md focus:outline-none"
            placeholder="My Playlist"
          >
        </div>

        <div class="mb-4">
          <label class="block text-white mb-2">Description</label>
          <textarea
            v-model="playlistDescription"
            class="w-full bg-[#242424] text-white px-4 py-2 rounded-md focus:outline-none"
            placeholder="Add an optional description"
            rows="3"
          ></textarea>
        </div>

        <div class="mb-4">
          <label class="flex items-center text-white">
            <input
              v-model="isPublic"
              type="checkbox"
              class="mr-2"
            >
            Public Playlist
          </label>
        </div>
      </div>

      <!-- Track Search -->
      <div class="bg-[#181818] p-6 rounded-lg mb-8">
        <h2 class="text-white text-xl font-semibold mb-4">Add Tracks</h2>
        
        <div class="mb-4">
          <input
            v-model="searchQuery"
            @input="searchTracks"
            type="text"
            class="w-full bg-[#242424] text-white px-4 py-2 rounded-md focus:outline-none"
            placeholder="Search for tracks to add"
          >
        </div>

        <!-- Search Results -->
        <div v-if="isSearching" class="text-white text-center py-4">
          Searching...
        </div>

        <div v-else-if="searchResults.length > 0" class="space-y-2">
          <div 
            v-for="track in searchResults" 
            :key="track.id"
            class="flex items-center justify-between p-2 rounded-md hover:bg-[#282828]"
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
            <div class="flex items-center space-x-4">
              <button 
                @click="playTrack(track)"
                class="text-gray-400 hover:text-white"
              >
                ▶️
              </button>
              <button 
                @click="addTrack(track)"
                class="text-gray-400 hover:text-white"
                :disabled="selectedTracks.find(t => t.id === track.id)"
              >
                ➕
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Tracks -->
      <div v-if="selectedTracks.length > 0" class="bg-[#181818] p-6 rounded-lg mb-8">
        <h2 class="text-white text-xl font-semibold mb-4">Selected Tracks ({{ selectedTracks.length }})</h2>
        
        <div class="space-y-2">
          <div 
            v-for="track in selectedTracks" 
            :key="track.id"
            class="flex items-center justify-between p-2 rounded-md hover:bg-[#282828]"
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
            <button 
              @click="removeTrack(track.id)"
              class="text-gray-400 hover:text-white"
            >
              ❌
            </button>
          </div>
        </div>
      </div>

      <!-- Create Button -->
      <button
        @click="createPlaylist"
        :disabled="isLoading || !playlistName.trim()"
        class="w-full bg-green-500 text-white py-3 rounded-full font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isLoading ? 'Creating...' : 'Create Playlist' }}
      </button>
    </div>
  </div>
</template> 