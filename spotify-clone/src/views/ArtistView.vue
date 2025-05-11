<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { spotifyApi } from '../services/spotifyAuth';
import { useSongStore } from '../stores/song';
import { useAuthStore } from '../stores/auth';
import Play from 'vue-material-design-icons/Play.vue';

const route = useRoute();
const router = useRouter();
const songStore = useSongStore();
const authStore = useAuthStore();

const artist = ref(null);
const topTracks = ref([]);
const albums = ref([]);
const relatedArtists = ref([]);
const isLoading = ref(true);
const error = ref(null);

const fetchArtistDetails = async () => {
  try {
    isLoading.value = true;
    const artistId = route.params.id;
    
    // Fetch artist details
    const artistData = await spotifyApi.getArtist(artistId);
    artist.value = artistData;

    // Fetch artist's top tracks
    const tracksData = await spotifyApi.getArtistTopTracks(artistId, 'US');
    topTracks.value = tracksData.tracks;

    // Fetch artist's albums
    const albumsData = await spotifyApi.getArtistAlbums(artistId, {
      limit: 20,
      include_groups: ['album', 'single']
    });
    albums.value = albumsData.items;

    // Fetch related artists
    const relatedData = await spotifyApi.getArtistRelatedArtists(artistId);
    relatedArtists.value = relatedData.artists;

  } catch (error) {
    console.error('Error fetching artist details:', error);
    error.value = error.message;
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

// Watch for route changes to reload data
watch(() => route.params.id, () => {
  fetchArtistDetails();
});

onMounted(() => {
  fetchArtistDetails();
});
</script>

<template>
  <div v-if="isLoading" class="p-8 text-white">Loading...</div>
  <div v-else-if="error" class="p-8 text-white">Error: {{ error }}</div>
  <div v-else-if="artist" class="p-8">
    <!-- Artist Header -->
    <div class="flex items-end gap-8 mb-8">
      <img 
        :src="artist.images[0]?.url" 
        :alt="artist.name"
        class="w-[232px] h-[232px] rounded-full shadow-2xl"
      >
      <div class="flex flex-col justify-end">
        <h1 class="text-white text-6xl font-bold mb-4">{{ artist.name }}</h1>
        <div class="text-gray-400">
          {{ artist.followers.total.toLocaleString() }} followers
        </div>
      </div>
    </div>

    <!-- Top Tracks -->
    <div class="mb-8">
      <h2 class="text-white text-2xl font-bold mb-4">Popular</h2>
      <div class="space-y-2">
        <div 
          v-for="(track, index) in topTracks" 
          :key="track.id"
          class="flex items-center justify-between p-2 rounded hover:bg-[#282828] cursor-pointer group"
          @click="playTrack(track)"
        >
          <div class="flex items-center gap-4">
            <div class="w-8 text-center text-gray-400">{{ index + 1 }}</div>
            <img 
              :src="track.album.images[0]?.url" 
              class="w-10 h-10 rounded"
            >
            <div>
              <div class="text-white">{{ track.name }}</div>
              <div class="text-gray-400 text-sm">{{ track.album.name }}</div>
            </div>
          </div>
          <button class="opacity-0 group-hover:opacity-100">
            <Play fillColor="#FFFFFF" :size="24" />
          </button>
        </div>
      </div>
    </div>

    <!-- Albums -->
    <div class="mb-8">
      <h2 class="text-white text-2xl font-bold mb-4">Albums</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <div 
          v-for="album in albums" 
          :key="album.id"
          class="cursor-pointer"
          @click="goToAlbum(album)"
        >
          <img 
            :src="album.images[0]?.url" 
            class="w-full rounded-md mb-2"
          >
          <div class="text-white font-semibold">{{ album.name }}</div>
          <div class="text-gray-400 text-sm">{{ album.release_date.split('-')[0] }} • {{ album.album_type }}</div>
        </div>
      </div>
    </div>

    <!-- Related Artists -->
    <div>
      <h2 class="text-white text-2xl font-bold mb-4">Fans Also Like</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <div 
          v-for="relatedArtist in relatedArtists" 
          :key="relatedArtist.id"
          class="text-center cursor-pointer"
          @click="goToArtist(relatedArtist)"
        >
          <img 
            :src="relatedArtist.images[0]?.url" 
            class="w-full rounded-full mb-2"
          >
          <div class="text-white font-semibold">{{ relatedArtist.name }}</div>
          <div class="text-gray-400 text-sm">Artist</div>
        </div>
      </div>
    </div>
  </div>
</template> 