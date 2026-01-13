/**
 * Tool: get_p3_current_playlist
 * Fetches the currently playing song on SR P3
 */

import { z } from 'zod';
import { getApiClient, P3_CHANNEL_ID } from '../api-client.js';
import type { Song, PlaylistResponse, SRApiSong } from '../types.js';

/**
 * No input parameters required for this tool
 */
export const GetCurrentPlaylistSchema = z.object({});

export type GetCurrentPlaylistInput = z.infer<typeof GetCurrentPlaylistSchema>;

/**
 * Convert SR API song data to our Song interface
 */
function parseSong(apiSong: SRApiSong | undefined, fallbackTime: string): Song | null {
  if (!apiSong) return null;

  const title = apiSong.title || 'Unknown Title';
  const artist = apiSong.artist || 'Unknown Artist';
  const startTime = apiSong.starttimeutc || fallbackTime;
  const stopTime = apiSong.stoptimeutc || fallbackTime;

  // Calculate duration in seconds
  let duration: number | undefined;
  try {
    const start = new Date(startTime).getTime();
    const stop = new Date(stopTime).getTime();
    if (!isNaN(start) && !isNaN(stop) && stop > start) {
      duration = Math.floor((stop - start) / 1000);
    }
  } catch {
    // Duration calculation failed, leave it undefined
  }

  return {
    title,
    artist,
    composer: apiSong.composer,
    albumName: apiSong.albumname,
    recordLabel: apiSong.recordlabel,
    startTimeUTC: startTime,
    stopTimeUTC: stopTime,
    duration,
    description: apiSong.description,
  };
}

/**
 * Handle arrays that might be single objects or arrays
 */
function normalizeToArray<T>(item: T | T[] | undefined): T[] {
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

/**
 * Execute the get_p3_current_playlist tool
 */
export async function getCurrentPlaylist(
  _input: GetCurrentPlaylistInput
): Promise<PlaylistResponse> {
  const apiClient = getApiClient();
  const errors: string[] = [];
  const songs: Song[] = [];

  try {
    const response = await apiClient.getCurrentPlaylist();

    const currentTime = new Date().toISOString();
    const playlist = response.sr?.playlist;

    if (!playlist) {
      throw new Error('No playlist data returned from Sveriges Radio API');
    }

    // Parse current song
    const currentSongs = normalizeToArray(playlist.song);
    const currentSong = currentSongs.length > 0 ? parseSong(currentSongs[0], currentTime) : null;

    // Parse previous song
    const previousSongs = normalizeToArray(playlist.previoussong);
    const previousSong = previousSongs.length > 0 ? parseSong(previousSongs[0], currentTime) : null;

    // Parse next song
    const nextSongs = normalizeToArray(playlist.nextsong);
    const nextSong = nextSongs.length > 0 ? parseSong(nextSongs[0], currentTime) : null;

    // Add songs in order: previous, current, next
    if (previousSong) songs.push(previousSong);
    if (currentSong) songs.push(currentSong);
    if (nextSong) songs.push(nextSong);

    if (songs.length === 0) {
      errors.push('No songs found in the current playlist');
    }

    return {
      songs,
      metadata: {
        channel: 'P3',
        channelId: P3_CHANNEL_ID,
        timestamp: currentTime,
        query: {
          type: 'current',
        },
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    // Convert error to user-friendly message
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while fetching the current playlist';

    return {
      songs: [],
      metadata: {
        channel: 'P3',
        channelId: P3_CHANNEL_ID,
        timestamp: new Date().toISOString(),
        query: {
          type: 'current',
        },
      },
      errors: [errorMessage],
    };
  }
}
