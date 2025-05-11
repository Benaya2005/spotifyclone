<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { spotifyApi } from '../services/spotifyAuth';
import { useSongStore } from '../stores/song';
import Play from 'vue-material-design-icons/Play.vue';
import Heart from 'vue-material-design-icons/Heart.vue';
import DotsHorizontal from 'vue-material-design-icons/DotsHorizontal.vue';

const route = useRoute();
const router = useRouter();
const songStore = useSongStore();
const album = ref(null);
const tracks = ref([]);
const isLoading = ref(true);
const error = ref(null);

const fetchAlbumDetails = async () => {
  try {
    isLoading.value = true;
    const albumId = route.params.id;
    const response = await spotifyApi.getAlbum(albumId);
    album.value = response;
    tracks.value = response.tracks.items;
  } catch (error) {
    console.error('Error fetching album details:', error);
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

const goToArtist = (artist) => {
  router.push(`/artist/${artist.id}`);
};

// Watch for route changes to reload data
watch(() => route.params.id, () => {
  fetchAlbumDetails();
});

onMounted(() => {
  fetchAlbumDetails();
});
</script>

<template>
  <div v-if="isLoading" class="p-8 text-white">Loading...</div>
  <div v-else-if="error" class="p-8 text-white">Error: {{ error }}</div>
  <div v-else-if="album" class="p-8">
    <!-- Album Header -->
    <div class="flex items-end gap-8 mb-8">
      <img 
        :src="album.images[0]?.url" 
        :alt="album.name"
        class="w-[232px] h-[232px] object-cover shadow-2xl"
      >
      <div class="flex flex-col justify-end">
        <div class="text-white text-sm font-semibold mb-2">ALBUM</div>
        <h1 class="text-white text-6xl font-bold mb-4">{{ album.name }}</h1>
        <div class="flex items-center gap-2 text-gray-300">
          <img 
            v-if="album.artists[0]?.images?.[0]?.url"
            :src="album.artists[0].images[0].url"
            class="w-6 h-6 rounded-full"
          >
          <span 
            v-for="(artist, index) in album.artists" 
            :key="artist.id"
            class="hover:underline cursor-pointer"
            @click="goToArtist(artist)"
          >
            {{ artist.name }}{{ index < album.artists.length - 1 ? ', ' : '' }}
          </span>
          <span class="text-gray-400">•</span>
          <span>{{ album.release_date.split('-')[0] }}</span>
          <span class="text-gray-400">•</span>
          <span>{{ album.tracks.total }} songs</span>
        </div>
      </div>
    </div>

    <!-- Play Button and Actions -->
    <div class="flex items-center gap-6 mb-8">
      <button 
        @click="playTrack(tracks[0])"
        class="bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-full p-4"
      >
        <Play fillColor="#000000" :size="24" />
      </button>
      <button class="text-gray-400 hover:text-white">
        <Heart fillColor="#FFFFFF" :size="24" />
      </button>
      <button class="text-gray-400 hover:text-white">
        <DotsHorizontal fillColor="#FFFFFF" :size="24" />
      </button>
    </div>

    <!-- Tracks List -->
    <div class="mt-8">
      <div class="text-gray-400 text-sm border-b border-gray-800 pb-2 mb-4">
        <div class="grid grid-cols-[16px_4fr_3fr_3fr] gap-4 px-4">
          <div>#</div>
          <div>TITLE</div>
          <div>ALBUM</div>
          <div>DURATION</div>
        </div>
      </div>

      <div class="space-y-2">
        <div 
          v-for="(track, index) in tracks" 
          :key="track.id"
          class="grid grid-cols-[16px_4fr_3fr_3fr] gap-4 px-4 py-2 rounded hover:bg-white/10 cursor-pointer group"
          @click="playTrack(track)"
        >
          <div class="text-gray-400 group-hover:hidden">{{ index + 1 }}</div>
          <div class="hidden group-hover:block">
            <Play fillColor="#FFFFFF" :size="16" />
          </div>
          <div>
            <div class="text-white">{{ track.name }}</div>
            <div class="text-gray-400 text-sm">
              <span 
                v-for="(artist, index) in track.artists" 
                :key="artist.id"
                class="hover:underline cursor-pointer"
                @click.stop="goToArtist(artist)"
              >
                {{ artist.name }}{{ index < track.artists.length - 1 ? ', ' : '' }}
              </span>
            </div>
          </div>
          <div class="text-gray-400">{{ album.name }}</div>
          <div class="text-gray-400">
            {{ Math.floor(track.duration_ms / 60000) }}:{{ ((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 