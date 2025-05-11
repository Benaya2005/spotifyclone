<template>
  <div class="login-container">
    <button 
      @click="loginWithSpotify" 
      class="spotify-login-button"
    >
      Login with Spotify
    </button>
  </div>
</template>

<script setup>
import { getSpotifyAuthUrl } from '../services/spotifyAuth';

const loginWithSpotify = () => {
  window.location.href = getSpotifyAuthUrl();
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #121212;
}

.spotify-login-button {
  background-color: #1DB954;
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 50px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
}

.spotify-login-button:hover {
  background-color: #1ed760;
  transform: scale(1.05);
}
</style>