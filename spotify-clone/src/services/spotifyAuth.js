import SpotifyWebApi from 'spotify-web-api-js';

// Initialize Spotify Web API instance
export const spotifyApi = new SpotifyWebApi();

// Environment variables
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5173/callback';

// Required scopes
const scopes = [
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'user-top-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-follow-read'
].join(' ');

// Store the access token in localStorage and set it in the API instance
export const setAuthToken = (token) => {
  localStorage.setItem('spotifyToken', token);
  
  console.log('Token stored:', token); // Debug log

  spotifyApi.setAccessToken(token);
};

// Retrieve the stored token from localStorage
export const getStoredToken = () => {
  const token = localStorage.getItem('spotifyToken');
  console.log('getStoredToken:', token); // Debug log to see what is being retrieved
  return token;};

// Generate Spotify authorization URL
export const getSpotifyAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    show_dialog: 'true'
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

// Exchange authorization code for access token
// Exchange authorization code for access and refresh tokens
export const exchangeCodeForToken = async (code) => {
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Access token:', data.access_token);
        // Store both access and refresh tokens in localStorage
        localStorage.setItem('spotifyToken', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
        return data.access_token;
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        throw error;
    }
};



// Check if user is authenticated
export const checkAuth = () => {
  const token = getStoredToken();
  console.log('Token retrieved in checkAuth:', token); // Debug log to check retrieved token

  return !!token;
};

// Logout by clearing the token
export const logout = () => {
  localStorage.removeItem('spotifyToken');
  if (spotifyApi) {
    spotifyApi.setAccessToken(null);
  }
  window.location.reload(); // Ensures complete state reset
};
// Initialize with stored token if available
const initToken = getStoredToken();
if (initToken) {
  spotifyApi.setAccessToken(initToken);
}

// Initialize with stored token if available, otherwise, use the refreshed token
export const initializeApi = async () => {
  let token = getStoredToken();
  
  // If no token is available, or it's expired, try refreshing it
  if (!token) {
    token = await refreshAccessToken();
  }
  
  spotifyApi.setAccessToken(token);
  spotifyApi.setPromiseImplementation(fetch);
  spotifyApi._customHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

// spotifyAuth.js

// Fetch profile data from Spotify using the access token
// Fetch profile data from Spotify using the access token
export const fetchProfile = async () => {
  let token = getStoredToken(); // Retrieve the access token from localStorage

  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // If the token is expired, refresh the token and retry
      if (response.status === 401 || response.status === 403) {
        console.log('Token expired or invalid. Refreshing token...');
        token = await refreshAccessToken(); // Refresh the token
        return fetchProfile(); // Retry the request with the new token
      } else {
        throw new Error('Failed to fetch profile data');
      }
    }

    const profile = await response.json();
    console.log('Profile Data:', profile);
    return profile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken'); // Retrieve the stored refresh token
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();
  if (data.access_token) {
    // Store the new access token
    localStorage.setItem('spotifyToken', data.access_token);
    return data.access_token;
  } else {
    console.error('Error refreshing token:', data);
    throw new Error('Error refreshing token');
  }
};
// src/services/spotifyAuth.js
export const checkAndRefreshToken = async () => {
  let token = spotifyApi.getAccessToken();

  if (!token) {
    console.log('No access token found. Attempting to refresh...');
    try {
      token = await refreshAccessToken();
      spotifyApi.setAccessToken(token);
      console.log('Access token refreshed');
    } catch (err) {
      console.error('Error refreshing token:', err);
      throw new Error('Failed to refresh token');
    }
  }
  return token;
};
