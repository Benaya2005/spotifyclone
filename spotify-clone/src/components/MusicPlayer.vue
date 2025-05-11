<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import MusicPlayerVolume from '../components/MusicPlayerVolume.vue'
import Heart from 'vue-material-design-icons/Heart.vue';
import PictureInPictureBottomRight from 'vue-material-design-icons/PictureInPictureBottomRight.vue';
import Play from 'vue-material-design-icons/Play.vue';
import Pause from 'vue-material-design-icons/Pause.vue';
import SkipBackward from 'vue-material-design-icons/SkipBackward.vue';
import SkipForward from 'vue-material-design-icons/SkipForward.vue';

import { useSongStore } from '../stores/song'
import { storeToRefs } from 'pinia';
const useSong = useSongStore()
const { isPlaying, currentTrack, currentArtist } = storeToRefs(useSong)

let isHover = ref(false)
let progress = ref(0)
let duration = ref(0)
let currentTime = ref(0)

// Update progress every second
let progressInterval = null

const startProgressInterval = () => {
  if (progressInterval) clearInterval(progressInterval)
  progressInterval = setInterval(async () => {
    try {
      const state = await useSong.fetchCurrentPlayback()
      if (state) {
        currentTime.value = state.progress_ms || 0
        duration.value = state.item?.duration_ms || 0
        progress.value = (currentTime.value / duration.value) * 100
        console.log('Progress updated:', {
          currentTime: formatTime(currentTime.value),
          duration: formatTime(duration.value),
          progress: progress.value.toFixed(2) + '%'
        })
      }
    } catch (error) {
      console.warn('Error updating progress:', error)
    }
  }, 100) // Update more frequently for smoother progress
}

const stopProgressInterval = () => {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

const formatTime = (ms) => {
  if (!ms) return '0:00'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const seekTo = async (e) => {
  try {
    const seekTime = (e.offsetX / e.target.offsetWidth) * duration.value
    console.log('Seeking to:', {
      seekTime,
      duration: duration.value,
      progress: (seekTime / duration.value) * 100
    })
    await useSong.seekTo(seekTime)
    currentTime.value = seekTime
    progress.value = (seekTime / duration.value) * 100
  } catch (error) {
    console.error('Error seeking:', error)
  }
}

const togglePlayback = () => {
  useSong.togglePlayback();
};

const nextTrack = async () => {
  try {
    await useSong.nextTrack();
    // Reset progress when changing tracks
    currentTime.value = 0
    progress.value = 0
  } catch (error) {
    console.error('Error skipping to next track:', error)
  }
};

const prevTrack = async () => {
  try {
    await useSong.previousTrack();
    // Reset progress when changing tracks
    currentTime.value = 0
    progress.value = 0
  } catch (error) {
    console.error('Error skipping to previous track:', error)
  }
};

// Watch for track changes and playback state
watch([currentTrack, isPlaying], ([newTrack, newIsPlaying]) => {
  console.log('Track or playback state changed:', { 
    track: newTrack?.name, 
    isPlaying: newIsPlaying 
  })
  if (newTrack && newIsPlaying) {
    startProgressInterval()
  } else {
    stopProgressInterval()
  }
})

// Clean up on component unmount
onMounted(() => {
  console.log('MusicPlayer mounted, current track:', currentTrack.value)
  if (currentTrack.value && isPlaying.value) {
    startProgressInterval()
  }
})

onUnmounted(() => {
  stopProgressInterval()
})
</script>

<template>
  <div
    id="MusicPlayer"
    v-if="currentTrack"
    class="
      fixed
      flex
      items-center
      justify-between
      bottom-0
      w-full
      z-50
      h-[90px]
      bg-[#181818]
      border-t
      border-t-[#272727]
    "
  >
    <div class="flex items-center w-1/4">
      <div class="flex items-center ml-4">
        <img class="rounded-sm shadow-2xl" width="55" :src="currentTrack.album.images[0].url">
        <div class="ml-4">
          <div class="text-[14px] text-white hover:underline cursor-pointer">
            {{ currentTrack.name }}
          </div>
          <div class="text-[11px] text-gray-500 hover:underline hover:text-white cursor-pointer">
            {{ currentTrack.artists[0].name }}
          </div>
        </div>
      </div>
      <div class="flex items-center ml-8">
        <Heart fillColor="#1BD760" :size="20" />
        <PictureInPictureBottomRight class="ml-4" fillColor="#FFFFFF" :size="18" />
      </div>
    </div>

    <div class="max-w-[35%] mx-auto w-2/4 mb-3">
      <div class="flex-col items-center justify-center">
        <div class="buttons flex items-center justify-center h-[30px]">
          <button class="mx-2">
            <SkipBackward fillColor="#FFFFFF" :size="25" @click="prevTrack"/>
          </button>
          <button class="p-1 rounded-full mx-3 bg-white" @click="togglePlayback">
            <Play v-if="!isPlaying" fillColor="#181818" :size="25" />
            <Pause v-else fillColor="#181818" :size="25" />
          </button>
          <button class="mx-2">
            <SkipForward fillColor="#FFFFFF" :size="25" @click="nextTrack"/>
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="flex items-center justify-center mt-2">
          <div class="text-[12px] text-gray-400 w-[40px]">
            {{ formatTime(currentTime) }}
          </div>
          <div 
            class="w-[500px] h-[4px] bg-gray-600 rounded-full mx-4 cursor-pointer relative group"
            @click="seekTo"
          >
            <div 
              class="absolute h-full bg-white rounded-full group-hover:bg-green-500 transition-colors"
              :style="{ width: `${progress}%` }"
            ></div>
            <div 
              class="absolute h-full bg-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
          <div class="text-[12px] text-gray-400 w-[40px]">
            {{ formatTime(duration) }}
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center w-1/4 justify-end pr-10">
      <MusicPlayerVolume />
    </div>
  </div>
</template>

<style scoped>
.buttons button {
  transition: all 0.2s ease;
}

.buttons button:hover {
  transform: scale(1.1);
}

.buttons button:active {
  transform: scale(0.95);
}

/* Add hover effect for progress bar */
.group:hover .bg-white {
  height: 8px;
  margin-top: -2px;
}
</style>