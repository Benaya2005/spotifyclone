<script setup>
import { ref, onMounted } from 'vue'
import MenuItem from './components/MenuItem.vue';
import MusicPlayer from './components/MusicPlayer.vue'
import SpotifyPlayer from './components/SpotifyPlayer.vue'
import ChevronUp from 'vue-material-design-icons/ChevronUp.vue';
import ChevronDown from 'vue-material-design-icons/ChevronDown.vue';
import ChevronRight from 'vue-material-design-icons/ChevronRight.vue';
import ChevronLeft from 'vue-material-design-icons/ChevronLeft.vue';
import { logout } from './services/spotifyAuth';
import { useSongStore } from './stores/song'
import { useAuthStore } from './stores/auth'
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router'
import { spotifyApi } from './services/spotifyAuth';
import PlaylistItem from './components/PlaylistItem.vue';

const useSong = useSongStore()
const { isPlaying, currentTrack } = storeToRefs(useSong)

const authStore = useAuthStore()
const { user, isAuthenticated } = storeToRefs(authStore)

const userPlaylists = ref([]);
const isLoadingPlaylists = ref(true);

const fetchUserPlaylists = async () => {
  try {
    const response = await spotifyApi.getUserPlaylists({
      limit: 50,
      fields: 'items(id,name,images,tracks.total,owner.display_name)'
    });
    
    if (response.items) {
      userPlaylists.value = response.items.sort((a, b) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
    }
  } catch (error) {
    console.error('Error fetching user playlists:', error);
  } finally {
    isLoadingPlaylists.value = false;
  }
};

onMounted(() => { 
  isPlaying.value = false;
  authStore.initialize();
  fetchUserPlaylists();
});

let openMenu = ref(false)
const router = useRouter();

const handleLogout = () => {
  logout();
  router.push('/login');
};

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/search');
  }
};

const goForward = () => {
  if (window.history.length > 1) {
    router.forward();
  }
};

const goToPlaylist = (playlist) => {
  router.push(`/playlist/${playlist.id}`);
};
</script>

<template>
    <div v-if="isAuthenticated">
        <SpotifyPlayer />
        
        <div 
          id="TopNav"
          class="
            w-[calc(100%-240px)] 
            h-[60px] 
            fixed 
            right-0 
            z-20 
            bg-[#101010] 
            bg-opacity-80 
            flex 
            items-center 
            justify-between
          "
        >
            <div class="flex items-center ml-6">
                <button 
                    type="button" 
                    @click="goBack"
                    class="rounded-full bg-black p-[1px] cursor-pointer hover:bg-[#282828]"
                >
                    <ChevronLeft fillColor="#FFFFFF" :size="30" />
                </button>
                <button 
                    type="button" 
                    @click="goForward"
                    class="rounded-full bg-black p-[1px] hover:bg-[#282828] ml-4 cursor-pointer"
                >
                    <ChevronRight fillColor="#FFFFFF" :size="30" />
                </button>
            </div>

            <button @click="openMenu = !openMenu" :class="openMenu ? 'bg-[#282828]' : 'bg-black'"
                class="bg-black hover:bg-[#282828] rounded-full p-0.5 mr-8 mt-0.5 cursor-pointer">
                <div class="flex items-center">
                    <img 
                      v-if="user && user.images && user.images[0]"
                      class="rounded-full" 
                      width="27"
                      :src="user.images[0].url"
                    >
                    <img 
                      v-else
                      class="rounded-full" 
                      width="27"
                      src="https://i.scdn.co/image/ab6775700000ee8518fe447fac315f236ce0bb52"
                    >
                    <div class="text-white text-[14px] ml-1.5 font-semibold">{{ user?.display_name || 'User' }}</div>
                    <ChevronDown v-if="!openMenu" @click="openMenu = true" fillColor="#FFFFFF" :size="25" />
                    <ChevronUp v-else @click="openMenu = false" fillColor="#FFFFFF" :size="25" />
                </div>
            </button>

            <span v-if="openMenu"
                class="fixed w-[190px] bg-[#282828] shadow-2xl z-50 rounded-sm top-[52px] right-[35px] p-1 cursor-pointer">
                <ul class="text-gray-200 font-semibold text-[14px]">
                    <RouterLink to="/profile">
                        <li class="px-3 py-2.5 hover:bg-[#3E3D3D] border-b border-b-gray-600">Profile</li>
                    </RouterLink>
                    <li @click="handleLogout" class="px-3 py-2.5 hover:bg-[#3E3D3D]">Log out</li>
                </ul>
            </span>
        </div>

        <div id="SideNav" class="h-[100%] p-6 w-[240px] fixed z-50 bg-black">
            <RouterLink to="/">
              <img width="125" src="/images/icons/spotify-logo.png">
            </RouterLink>
            <div class="my-8"></div>
            <ul>
                <RouterLink to="/">
                    <MenuItem class="ml-[1px]" :iconSize="23" name="Home" iconString="home" pageUrl="/" />
                </RouterLink>
                <RouterLink to="/search">
                    <MenuItem class="ml-[1px]" :iconSize="24" name="Search" iconString="search" pageUrl="/search" />
                </RouterLink>
                <RouterLink to="/library">
                    <MenuItem class="ml-[2px]" :iconSize="23" name="Your Library" iconString="library" pageUrl="/library" />
                </RouterLink>
                <div class="py-3.5"></div>
                <MenuItem :iconSize="24" name="Create Playlist" iconString="playlist" pageUrl="/playlist" />
                <MenuItem class="-ml-[1px]" :iconSize="27" name="Liked Songs" iconString="liked" pageUrl="/liked" />
            </ul>
            <div class="border-b border-b-gray-700"></div>
            <div class="mt-4">
              <h2 class="text-gray-400 text-sm font-semibold px-2 mb-2">YOUR PLAYLISTS</h2>
              <div class="space-y-1">
                <div v-if="isLoadingPlaylists" class="text-gray-400 text-sm px-2">
                  Loading playlists...
                </div>
                <div v-else-if="userPlaylists.length === 0" class="text-gray-400 text-sm px-2">
                  No playlists found
                </div>
                <PlaylistItem 
                  v-for="playlist in userPlaylists" 
                  :key="playlist.id"
                  :playlist="playlist"
                />
              </div>
            </div>
        </div>

        <div
            class="
                fixed
                right-0
                top-0
                w-[calc(100%-240px)]
                overflow-auto
                h-full
                bg-gradient-to-b
                from-[#1C1C1C]
                to-black
            "
        >
            <div class="mt-[70px]"></div>
            <RouterView :key="$route.fullPath" />
            <div class="mb-[100px]"></div>
        </div>

        <MusicPlayer v-if="currentTrack"/>
    </div>

    <RouterView v-else />
</template>

<style scoped>
.logout-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.logout-button:hover {
  background-color: #333;
}
</style>