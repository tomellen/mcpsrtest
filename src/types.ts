/**
 * TypeScript types and interfaces for SR P3 MCP Server
 */

/**
 * Represents a single song/track from SR P3 playlist
 */
export interface Song {
  /** Unique identifier for the song entry */
  id?: string;
  /** Song title */
  title: string;
  /** Artist name */
  artist: string;
  /** Composer name (if available) */
  composer?: string;
  /** Album name */
  albumName?: string;
  /** Record label */
  recordLabel?: string;
  /** Start time in UTC (ISO 8601 format) */
  startTimeUTC: string;
  /** Stop time in UTC (ISO 8601 format) */
  stopTimeUTC: string;
  /** Duration in seconds */
  duration?: number;
  /** Additional description or notes */
  description?: string;
}

/**
 * Metadata about the playlist query
 */
export interface PlaylistMetadata {
  /** Channel name (always "P3" for this server) */
  channel: string;
  /** Channel ID (always 565 for P3) */
  channelId: number;
  /** Timestamp when the query was executed */
  timestamp: string;
  /** Query parameters used */
  query: {
    type: 'current' | 'date-range';
    startDate?: string;
    endDate?: string;
    artistFilter?: string;
    limit?: number;
  };
}

/**
 * Response format for playlist tools
 */
export interface PlaylistResponse {
  /** Array of songs matching the query */
  songs: Song[];
  /** Metadata about the query and response */
  metadata: PlaylistMetadata;
  /** Error messages if any (non-fatal errors) */
  errors?: string[];
}

/**
 * SR API raw song data structure (after XML parsing)
 */
export interface SRApiSong {
  title?: string;
  description?: string;
  artist?: string;
  composer?: string;
  albumname?: string;
  recordlabel?: string;
  starttimeutc?: string;
  stoptimeutc?: string;
}

/**
 * SR API raw response structure for "right now" endpoint
 */
export interface SRApiRightNowResponse {
  sr?: {
    playlist?: {
      song?: SRApiSong | SRApiSong[];
      previoussong?: SRApiSong | SRApiSong[];
      nextsong?: SRApiSong | SRApiSong[];
    };
  };
}

/**
 * SR API raw response structure for playlist by channel endpoint
 */
export interface SRApiPlaylistResponse {
  sr?: {
    playlist?: {
      song?: SRApiSong | SRApiSong[];
    };
  };
}

/**
 * Rate limiter state
 */
export interface RateLimiterState {
  requests: number[];
  windowMs: number;
  maxRequests: number;
}
