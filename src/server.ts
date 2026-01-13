#!/usr/bin/env node

/**
 * SR P3 MCP Server
 * Provides access to Sveriges Radio P3 channel music playlists
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import {
  getCurrentPlaylist,
  GetCurrentPlaylistSchema,
} from './tools/current-playlist.js';
import {
  searchPlaylistByDate,
  SearchPlaylistSchema,
} from './tools/search-playlist.js';

/**
 * Tool definitions for MCP
 */
const TOOLS: Tool[] = [
  {
    name: 'get_p3_current_playlist',
    description:
      'Fetch the currently playing song on Sveriges Radio P3 (channel 565). ' +
      'Returns the current song, previous song, and next song with details including ' +
      'artist, title, album, start/stop timestamps in UTC.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'search_p3_playlist_by_date',
    description:
      'Search Sveriges Radio P3 playlist history for a specific date or date range. ' +
      'Returns an array of songs that played during the specified time period. ' +
      'Dates must be within the last 90 days and cannot be in the future.',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description:
            'ISO 8601 date string (e.g., "2024-12-15") or date range (e.g., "2024-12-01 to 2024-12-31")',
        },
        artist_filter: {
          type: 'string',
          description:
            'Optional: Filter results by artist name (case-insensitive substring match)',
        },
        limit: {
          type: 'number',
          description:
            'Optional: Maximum number of songs to return (default: 25, max: 100)',
          default: 25,
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['date'],
    },
  },
];

/**
 * Create and configure the MCP server
 */
async function main() {
  // Create server instance
  const server = new Server(
    {
      name: 'sr-p3-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  /**
   * Handler for listing available tools
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS,
    };
  });

  /**
   * Handler for tool execution
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'get_p3_current_playlist': {
          // Validate input (should be empty object)
          const validatedInput = GetCurrentPlaylistSchema.parse(args || {});
          const result = await getCurrentPlaylist(validatedInput);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'search_p3_playlist_by_date': {
          // Validate input with Zod
          const validatedInput = SearchPlaylistSchema.parse(args || {});
          const result = await searchPlaylistByDate(validatedInput);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      // Handle validation errors from Zod
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: `Input validation failed: ${errorMessages}`,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      // Handle other errors
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: errorMessage,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  });

  /**
   * Start the server with stdio transport
   */
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (not stdout, which is used for MCP protocol)
  console.error('SR P3 MCP Server running on stdio');
  console.error('Server name: sr-p3-mcp-server');
  console.error('Version: 1.0.0');
  console.error('Available tools: get_p3_current_playlist, search_p3_playlist_by_date');
}

// Run the server
main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
