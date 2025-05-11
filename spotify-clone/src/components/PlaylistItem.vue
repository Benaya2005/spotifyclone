<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  playlist: {
    type: Object,
    required: true
  }
});

const goToPlaylist = () => {
  router.push(`/playlist/${props.playlist.id}`);
};
</script>

<template>
  <div 
    @click="goToPlaylist"
    class="flex items-center gap-3 p-2 rounded-md hover:bg-[#282828] cursor-pointer group"
  >
    <img 
      :src="playlist.images[0]?.url || 'https://i.scdn.co/image/ab67706f00000002ca5a7517156021292e5663bb'" 
      :alt="playlist.name"
      class="w-12 h-12 rounded-md shadow-lg"
    >
    <div class="flex flex-col">
      <div class="text-white font-medium text-sm truncate max-w-[150px]">
        {{ playlist.name }}
      </div>
      <div class="text-gray-400 text-xs">
        {{ playlist.tracks?.total || 0 }} songs
      </div>
    </div>
  </div>
</template> 