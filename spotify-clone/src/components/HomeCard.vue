<script setup>
import { toRefs } from 'vue'
import { useRouter } from 'vue-router';
import { useSongStore } from '../stores/song';

const router = useRouter();
const songStore = useSongStore();

const props = defineProps({
    image: String,
    title: String,
    subTitle: String,
    track: Object,
    album: Object,
    playlist: Object
})
const { image, title, subTitle, track, album, playlist } = toRefs(props)

const handleClick = () => {
  if (album.value) {
    router.push(`/album/${album.value.id}`);
  } else if (track.value) {
    songStore.playTrack(track.value);
  }
  // You can add similar logic for playlists
}
</script>

<template>
  <div 
    @click="handleClick"
    class="bg-[#111111] p-4 rounded-md m-2 hover:bg-[#252525] cursor-pointer"
  >
    <img class="rounded-md w-full aspect-square object-cover" :src="image" alt="">
    <div class="text-white pt-4 font-semibold text-[17px] truncate">{{ title }}</div>
    <div class="text-gray-400 pt-1 pb-3 text-[14px] truncate">{{ subTitle }}</div>
  </div>
</template>