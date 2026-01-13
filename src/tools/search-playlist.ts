/**
 * Tool: search_p3_playlist_by_date
 * Search P3 playlist history for a specific date or date range
 */

import { z } from 'zod';
import { getApiClient, P3_CHANNEL_ID } from '../api-client.js';
import type { Song, PlaylistResponse, SRApiSong } from '../types.js';

/**
 * Input validation schema
 */
export const SearchPlaylistSchema = z.object({
  date: z
    .string()
    .min(1, 'Date is required')
    .describe(
      'ISO 8601 date string (e.g., "2024-12-15") or date range "2024-12-01 to 2024-12-31"'
    ),
  artist_filter: z
    .string()
    .optional()
    .describe('Filter results by artist name (case-insensitive substring match)'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(25)
    .describe('Maximum number of songs to return (default: 25, max: 100)'),
});

export type SearchPlaylistInput = z.infer<typeof SearchPlaylistSchema>;

/**
 * Parse date input and return start/end date times
 * Validates that dates are within the last 90 days and not in the future
 */
function parseDateInput(dateInput: string): { startDateTime: string; endDateTime: string } {
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Check if it's a date range (contains "to")
  const isRange = dateInput.includes(' to ');

  let startDate: Date;
  let endDate: Date;

  try {
    if (isRange) {
      const [startStr, endStr] = dateInput.split(' to ').map((s) => s.trim());
      startDate = new Date(startStr);
      endDate = new Date(endStr);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date format in range');
      }

      // Set start to beginning of day, end to end of day
      startDate.setUTCHours(0, 0, 0, 0);
      endDate.setUTCHours(23, 59, 59, 999);
    } else {
      // Single date - search the entire day
      startDate = new Date(dateInput);

      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid date format');
      }

      // Set to beginning of day
      startDate.setUTCHours(0, 0, 0, 0);

      // End date is the same day at end of day
      endDate = new Date(startDate);
      endDate.setUTCHours(23, 59, 59, 999);
    }
  } catch {
    throw new Error(
      'Invalid date format. Please use ISO 8601 format (e.g., "2024-12-15") or ' +
      'date range format (e.g., "2024-12-01 to 2024-12-31")'
    );
  }

  // Validate: no future dates
  if (startDate > now || endDate > now) {
    throw new Error(
      'Future dates are not allowed. Please provide a date within the last 90 days.'
    );
  }

  // Validate: within last 90 days
  if (startDate < ninetyDaysAgo) {
    throw new Error(
      'Date is too far in the past. Please provide a date within the last 90 days.'
    );
  }

  // Validate: start date before end date
  if (startDate > endDate) {
    throw new Error('Start date must be before or equal to end date.');
  }

  return {
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
  };
}

/**
 * Convert SR API song data to our Song interface
 */
function parseSong(apiSong: SRApiSong, index: number): Song | null {
  const title = apiSong.title || 'Unknown Title';
  const artist = apiSong.artist || 'Unknown Artist';
  const startTime = apiSong.starttimeutc || new Date().toISOString();
  const stopTime = apiSong.stoptimeutc || new Date().toISOString();

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
    id: `song-${index}`,
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
 * Filter songs by artist name (case-insensitive substring match)
 */
function filterByArtist(songs: Song[], artistFilter: string): Song[] {
  const filterLower = artistFilter.toLowerCase();
  return songs.filter((song) => song.artist.toLowerCase().includes(filterLower));
}

/**
 * Execute the search_p3_playlist_by_date tool
 */
export async function searchPlaylistByDate(
  input: SearchPlaylistInput
): Promise<PlaylistResponse> {
  const apiClient = getApiClient();
  const errors: string[] = [];
  let songs: Song[] = [];

  try {
    // Parse and validate date input
    const { startDateTime, endDateTime } = parseDateInput(input.date);

    // Fetch playlist from API
    const response = await apiClient.getPlaylistByDateRange(startDateTime, endDateTime);

    const playlist = response.sr?.playlist;

    if (!playlist) {
      throw new Error('No playlist data returned from Sveriges Radio API');
    }

    // Parse songs
    const apiSongs = normalizeToArray(playlist.song);
    songs = apiSongs
      .map((apiSong, index) => parseSong(apiSong, index))
      .filter((song): song is Song => song !== null);

    // Apply artist filter if provided
    if (input.artist_filter) {
      const originalCount = songs.length;
      songs = filterByArtist(songs, input.artist_filter);

      if (songs.length === 0 && originalCount > 0) {
        errors.push(
          `No songs found matching artist filter: "${input.artist_filter}". ` +
          `Found ${originalCount} total songs in the date range.`
        );
      }
    }

    // Apply limit
    if (songs.length > input.limit) {
      songs = songs.slice(0, input.limit);
    }

    return {
      songs,
      metadata: {
        channel: 'P3',
        channelId: P3_CHANNEL_ID,
        timestamp: new Date().toISOString(),
        query: {
          type: 'date-range',
          startDate: startDateTime,
          endDate: endDateTime,
          artistFilter: input.artist_filter,
          limit: input.limit,
        },
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    // Convert error to user-friendly message
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while searching the playlist';

    return {
      songs: [],
      metadata: {
        channel: 'P3',
        channelId: P3_CHANNEL_ID,
        timestamp: new Date().toISOString(),
        query: {
          type: 'date-range',
          artistFilter: input.artist_filter,
          limit: input.limit,
        },
      },
      errors: [errorMessage],
    };
  }
}
