<script setup>
import { ref, onMounted, watch } from 'vue'

import VolumeMute from 'vue-material-design-icons/VolumeMute.vue';
import VolumeHigh from 'vue-material-design-icons/VolumeHigh.vue';

import { useSongStore } from '../stores/song'
import { storeToRefs } from 'pinia';
const useSong = useSongStore()
const { audio } = storeToRefs(useSong)

let isHover = ref(false)

// PLAYER REFS
let vol = ref(100)
let volume = ref(null)

const updateVolume = async (newVolume) => {
  try {
    // Update the Spotify player volume
    if (window.Spotify && useSong.deviceId) {
      const player = new window.Spotify.Player({
        name: 'Spotify Clone Web Player',
        getOAuthToken: cb => cb(useSong.token)
      });
      await player.setVolume(newVolume / 100);
      console.log('Volume updated to:', newVolume);
    }
  } catch (error) {
    console.error('Error updating volume:', error);
  }
};

onMounted(() => {
    if (volume.value) {
    volume.value.addEventListener("input", (e) => {
            const newVolume = e.currentTarget.value;
            vol.value = newVolume;
            updateVolume(newVolume);
    });
    }
})

// Watch for volume changes
watch(vol, (newVolume) => {
  updateVolume(newVolume);
});
</script>

<template>
    <div class="flex items-center">
    <VolumeMute v-if="vol == 0" fillColor="#FFFFFF" :size="20" />
    <VolumeHigh v-else fillColor="#FFFFFF" :size="20" />
    <div
        class="flex items-center ml-2 w-[150px] relative mt-2 mb-[23px]"
        @mouseenter="isHover = true"
        @mouseleave="isHover = false"
    >
        <input
            v-model="vol"
            ref="volume"
            type="range"
                min="0"
                max="100"
            class="
                mt-[24px]
                absolute
                rounded-full
                my-2
                w-full
                h-0
                z-40
                appearance-none
                bg-opacity-100
                focus:outline-none
                accent-white
            "
            :class="{ 'rangeDotHidden': !isHover }"
        >
        <div
            class="pointer-events-none mt-[6px] absolute h-[4px] z-10 inset-y-0 left-0 w-0"
            :style="`width: ${vol}%;`"
            :class="isHover ? 'bg-green-500' : 'bg-white'"
        />
        <div class="absolute h-[4px] z-[-0] mt-[6px] inset-y-0 left-0 w-full bg-gray-500 rounded-full" />
        </div>
    </div>
</template>

<style>
.rangeDotHidden[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 0;
  height: 0;
}
</style>
