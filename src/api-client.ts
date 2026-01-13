/**
 * Sveriges Radio API Client
 * Handles all HTTP requests to the SR Open API with rate limiting
 */

import axios, { AxiosInstance } from 'axios';
import { XMLParser } from 'fast-xml-parser';
import type {
  SRApiRightNowResponse,
  SRApiPlaylistResponse,
  RateLimiterState,
} from './types.js';

// P3 Channel ID - hardcoded as per requirements
export const P3_CHANNEL_ID = 565;

// API Configuration
const SR_API_BASE_URL = 'http://api.sr.se/api/v2/playlists';
const API_TIMEOUT_MS = 10000; // 10 seconds
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

/**
 * Rate limiter to respect SR's infrastructure
 */
class RateLimiter {
  private state: RateLimiterState;

  constructor(maxRequests: number = RATE_LIMIT_MAX_REQUESTS, windowMs: number = RATE_LIMIT_WINDOW_MS) {
    this.state = {
      requests: [],
      windowMs,
      maxRequests,
    };
  }

  /**
   * Check if a request can be made, and record it if so
   * @returns true if request is allowed, false if rate limit exceeded
   */
  public allowRequest(): boolean {
    const now = Date.now();
    // Remove requests outside the current window
    this.state.requests = this.state.requests.filter(
      (timestamp) => now - timestamp < this.state.windowMs
    );

    if (this.state.requests.length >= this.state.maxRequests) {
      return false;
    }

    this.state.requests.push(now);
    return true;
  }

  /**
   * Get time until next request is allowed (in seconds)
   */
  public getWaitTime(): number {
    if (this.state.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.state.requests);
    const timeUntilExpiry = this.state.windowMs - (Date.now() - oldestRequest);
    return Math.max(0, Math.ceil(timeUntilExpiry / 1000));
  }
}

/**
 * SR API Client with rate limiting and error handling
 */
export class SRApiClient {
  private axiosInstance: AxiosInstance;
  private xmlParser: XMLParser;
  private rateLimiter: RateLimiter;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: SR_API_BASE_URL,
      timeout: API_TIMEOUT_MS,
      headers: {
        'User-Agent': 'SR-P3-MCP-Server/1.0',
      },
    });

    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
    });

    this.rateLimiter = new RateLimiter();

    // Log all requests (server-side logging)
    this.axiosInstance.interceptors.request.use((config) => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] SR API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.params) {
        console.error(`[${timestamp}] Parameters:`, JSON.stringify(config.params));
      }
      return config;
    });
  }

  /**
   * Check rate limit before making a request
   * @throws Error if rate limit is exceeded
   */
  private checkRateLimit(): void {
    if (!this.rateLimiter.allowRequest()) {
      const waitTime = this.rateLimiter.getWaitTime();
      throw new Error(
        `Rate limit exceeded. Please wait ${waitTime} seconds before trying again. ` +
        `(Limit: ${RATE_LIMIT_MAX_REQUESTS} requests per minute)`
      );
    }
  }

  /**
   * Make an HTTP request to the SR API with error handling
   */
  private async makeRequest<T>(endpoint: string, params: Record<string, any>): Promise<T> {
    this.checkRateLimit();

    try {
      const response = await this.axiosInstance.get(endpoint, { params });

      // Parse XML to JSON
      const parsed = this.xmlParser.parse(response.data);
      return parsed as T;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          throw new Error(
            'Request to Sveriges Radio API timed out. Please try again in a moment.'
          );
        }
        if (error.response) {
          throw new Error(
            `Sveriges Radio API returned an error (status ${error.response.status}). ` +
            'The service may be temporarily unavailable. Please try again later.'
          );
        }
        if (error.request) {
          throw new Error(
            'Unable to reach Sveriges Radio API. Please check your internet connection and try again.'
          );
        }
      }
      throw new Error(
        'An unexpected error occurred while fetching data from Sveriges Radio. Please try again.'
      );
    }
  }

  /**
   * Fetch the currently playing song on P3 (and previous/next songs)
   * @returns Raw API response with current, previous, and next songs
   */
  public async getCurrentPlaylist(): Promise<SRApiRightNowResponse> {
    return this.makeRequest<SRApiRightNowResponse>('/rightnow', {
      channelid: P3_CHANNEL_ID,
      format: 'xml',
    });
  }

  /**
   * Fetch P3 playlist for a specific date range
   * @param startDateTime ISO 8601 datetime string (e.g., "2024-12-15T00:00:00Z")
   * @param endDateTime ISO 8601 datetime string
   * @returns Raw API response with array of songs
   */
  public async getPlaylistByDateRange(
    startDateTime: string,
    endDateTime: string
  ): Promise<SRApiPlaylistResponse> {
    return this.makeRequest<SRApiPlaylistResponse>('/getplaylistbychannelid', {
      id: P3_CHANNEL_ID,
      startdatetime: startDateTime,
      enddatetime: endDateTime,
      format: 'xml',
    });
  }
}

/**
 * Singleton instance of the API client
 */
let apiClientInstance: SRApiClient | null = null;

/**
 * Get the singleton API client instance
 */
export function getApiClient(): SRApiClient {
  if (!apiClientInstance) {
    apiClientInstance = new SRApiClient();
  }
  return apiClientInstance;
}
