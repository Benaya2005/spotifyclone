<script setup>
import { onMounted, ref } from 'vue';
import { spotifyApi, refreshAccessToken } from '../services/spotifyAuth';
import HomeCard from '../components/HomeCard.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const newReleases = ref([]);
const recommendedTracks = ref([]);
const isLoading = ref(true);
const error = ref(null);

// Check token and refresh if necessary
const checkAndRefreshToken = async () => {
  let token = spotifyApi.getAccessToken();

  if (!token) {
    console.log('No access token found. Attempting to refresh...');
    try {
      token = await refreshAccessToken();
      spotifyApi.setAccessToken(token);
      console.log('Access token refreshed');
    } catch (err) {
      console.error('Error refreshing token:', err);
      router.push('/login'); // Force re-login if refresh fails
      throw new Error('Failed to refresh token');
    }
  }
  return token;
};

// Fetch new releases
const fetchNewReleases = async () => {
  try {
    const token = await checkAndRefreshToken();
    const response = await spotifyApi.getNewReleases({
      country: 'US',
      limit: 5,
    });

    if (response.albums?.items) {
      newReleases.value = response.albums.items;
    } else {
      console.error("No new releases found", response);
    }
  } catch (err) {
    console.error("Error fetching new releases:", err);
  }
};

// Fetch recommended tracks
const fetchRecommendedTracks = async () => {
  try {
    const token = await checkAndRefreshToken();
    const response = await spotifyApi.getNewReleases({
      country: 'US',
      limit: 5,
      offset: 5 // Get the next set of releases after the first 5
    });

    if (response.albums?.items) {
      recommendedTracks.value = response.albums.items;
      console.log('Recommended tracks set:', recommendedTracks.value);
    } else {
      console.error("No recommended tracks found", response);
    }
  } catch (err) {
    console.error("Error fetching recommended tracks:", err);
  }
};

onMounted(async () => {
  try {
    await Promise.all([fetchNewReleases(), fetchRecommendedTracks()]);
  } catch (err) {
    console.error("Error in onMounted:", err);
  } finally {
    isLoading.value = false;
  }
});
</script>
<template>
  <div v-if="isLoading" class="p-8 text-white">Loading...</div>
  <div v-else>
    <div class="p-8">
      <button
        type="button"
        class="text-white text-2xl font-semibold hover:underline cursor-pointer"
      >
        New Releases
      </button>

      <div class="py-1.5"></div>

      <div class="flex items-center">
        <HomeCard 
          v-for="album in newReleases" 
          :key="album.id"
          :image="album.images[0]?.url" 
          :title="album.name" 
          :subTitle="album.artists[0]?.name"
          :album="album"
        />
      </div>

      <div class="mt-8">
        <button
          type="button"
          class="text-white text-2xl font-semibold hover:underline cursor-pointer"
        >
          Recommended Tracks
        </button>

        <div class="py-1.5"></div>

        <div class="flex items-center">
          <HomeCard 
            v-for="album in recommendedTracks" 
            :key="album.id"
            :image="album.images[0]?.url" 
            :title="album.name" 
            :subTitle="album.artists[0]?.name"
            :album="album"
          />
        </div>
      </div>
    </div>
  </div>
</template>
