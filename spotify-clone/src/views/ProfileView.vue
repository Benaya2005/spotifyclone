<template>
  <div class="profile-container p-8 text-white">
    <div v-if="authStore.user" class="max-w-3xl mx-auto">
      <!-- Profile Header -->
      <div class="flex items-center gap-6 mb-8">
        <img 
          v-if="authStore.user.images && authStore.user.images[0]"
          :src="authStore.user.images[0].url" 
          class="w-32 h-32 rounded-full object-cover border-4 border-spotify-green"
          alt="Profile picture"
        >
        <div v-else class="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center">
          <span class="text-4xl">{{ userInitials }}</span>
        </div>
        
        <div>
          <h1 class="text-4xl font-bold mb-2">{{ authStore.user.display_name || 'Spotify User' }}</h1>
          <div class="flex items-center gap-4 text-gray-300">
            <span v-if="authStore.user.email" class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              {{ authStore.user.email }}
            </span>
            <span class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
              {{ authStore.user.product || 'Free' }} Account
            </span>
          </div>
        </div>
      </div>

      <!-- Profile Details -->
      <div class="bg-[#181818] rounded-lg p-6">
        <h2 class="text-2xl font-semibold mb-4">Profile Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="detail-item">
            <span class="detail-label">Spotify ID</span>
            <span class="detail-value">{{ authStore.user.id }}</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-label">Country</span>
            <span class="detail-value">{{ authStore.user.country || 'Not specified' }}</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-label">Account Type</span>
            <span class="detail-value capitalize">{{ authStore.user.product || 'free' }}</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-label">Followers</span>
            <span class="detail-value">{{ authStore.user.followers?.total || 0 }}</span>
          </div>
        </div>

        <div class="mt-6">
          <a 
            :href="authStore.user.external_urls?.spotify" 
            target="_blank" 
            class="inline-flex items-center text-spotify-green hover:underline"
          >
            View on Spotify
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </a>
        </div>
      </div>

      <!-- Recent Activity Section -->
      <div class="mt-8">
        <h2 class="text-2xl font-semibold mb-4">Your Spotify Stats</h2>
        <div v-if="isLoading" class="text-center py-4">
          <p class="text-gray-400">Loading stats...</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="stat-card">
            <div class="stat-value">{{ userStats.playlists }}</div>
            <div class="stat-label">Playlists</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ userStats.following }}</div>
            <div class="stat-label">Following</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ userStats.topArtists.length }}</div>
            <div class="stat-label">Top Artists</div>
          </div>
        </div>

        <!-- Top Artists Section -->
        <div v-if="userStats.topArtists.length > 0" class="mt-8">
          <h3 class="text-xl font-semibold mb-4">Your Top Artists</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div v-for="artist in userStats.topArtists" :key="artist.id" class="artist-card">
              <img 
                :src="artist.images[0]?.url" 
                :alt="artist.name"
                class="w-full aspect-square object-cover rounded-full mb-2"
              >
              <div class="text-center">
                <div class="font-semibold truncate">{{ artist.name }}</div>
                <div class="text-sm text-gray-400">Artist</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <p class="text-xl">Loading profile data...</p>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth';
import { computed, ref, onMounted } from 'vue';
import { spotifyApi } from '../services/spotifyAuth';

const authStore = useAuthStore();
const userStats = ref({
  playlists: 0,
  following: 0,
  topArtists: []
});
const isLoading = ref(true);

const userInitials = computed(() => {
  if (!authStore.user?.display_name) return '?';
  return authStore.user.display_name
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();
});

const fetchUserStats = async () => {
  try {
    isLoading.value = true;
    
    // Fetch user's playlists
    const playlists = await spotifyApi.getUserPlaylists();
    userStats.value.playlists = playlists.total || 0;
    
    // Fetch user's following
    const following = await spotifyApi.getFollowedArtists();
    userStats.value.following = following.artists.total || 0;
    
    // Fetch user's top artists
    const topArtists = await spotifyApi.getMyTopArtists({ limit: 5 });
    userStats.value.topArtists = topArtists.items || [];
    
    console.log('User stats fetched:', userStats.value);
  } catch (error) {
    console.error('Error fetching user stats:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  if (authStore.user) {
    await fetchUserStats();
  }
});
</script>

<style scoped>
.profile-container {
  background: linear-gradient(to bottom, #1a1a1a, #121212);
  min-height: calc(100vh - 64px);
}

.detail-item {
  @apply py-2 border-b border-gray-700;
}

.detail-label {
  @apply text-gray-400 text-sm block;
}

.detail-value {
  @apply text-white mt-1;
}

.stat-card {
  @apply bg-[#181818] rounded-lg p-4 text-center hover:bg-[#282828] transition-colors;
}

.stat-value {
  @apply text-3xl font-bold text-white mb-1;
}

.stat-label {
  @apply text-gray-400 text-sm;
}

.artist-card {
  @apply bg-[#181818] p-4 rounded-lg hover:bg-[#282828] transition-colors cursor-pointer;
}

.border-spotify-green {
  border-color: #1DB954;
}

.text-spotify-green {
  color: #1DB954;
}
</style>