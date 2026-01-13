# SR P3 MCP Server

A Model Context Protocol (MCP) server that provides access to Sveriges Radio's P3 channel music playlists. This server enables AI assistants to fetch current and historical playlist data from P3, Sweden's popular music radio station.

## Features

- **Real-time Current Playlist**: Get the currently playing song, previous song, and next song on P3
- **Historical Playlist Search**: Search P3's playlist history by date or date range (last 90 days)
- **Artist Filtering**: Filter historical results by artist name
- **Rate Limiting**: Built-in rate limiting (10 requests/minute) to respect SR's infrastructure
- **Input Validation**: Robust input validation using Zod schemas
- **Error Handling**: User-friendly error messages with graceful degradation

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Setup

1. Clone this repository:
```bash
git clone https://github.com/tomellen/mcpsrtest.git
cd mcpsrtest
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

## Usage

### Configuring with Claude Desktop

To use this server with Claude Desktop, you need to add it to your Claude Desktop configuration:

1. Build the server (see Installation above)
2. Find your Claude Desktop config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

3. Add the server to your config:
```json
{
  "mcpServers": {
    "sr-p3": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcpsrtest/dist/server.js"
      ]
    }
  }
}
```

4. Restart Claude Desktop

See [CONFIGURATION.md](CONFIGURATION.md) for detailed setup instructions, including platform-specific examples.

### Running Locally

Start the server:
```bash
npm start
```

The server runs on stdio transport, suitable for local deployment (including Raspberry Pi).

### Development Mode

For development with auto-rebuild:
```bash
npm run watch
```

In another terminal:
```bash
npm run dev
```

## MCP Tools

### 1. `get_p3_current_playlist`

Fetch the currently playing song on SR P3.

**Parameters:** None

**Returns:**
- Current song with artist, title, album, timestamps
- Previous song
- Next song

**Example Response:**
```json
{
  "songs": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "albumName": "Album Name",
      "startTimeUTC": "2024-12-15T10:30:00Z",
      "stopTimeUTC": "2024-12-15T10:33:45Z",
      "duration": 225
    }
  ],
  "metadata": {
    "channel": "P3",
    "channelId": 164,
    "timestamp": "2024-12-15T10:32:00Z",
    "query": {
      "type": "current"
    }
  }
}
```

### 2. `search_p3_playlist_by_date`

Search P3 playlist history for a specific date or date range.

**Parameters:**
- `date` (required): ISO 8601 date string or date range
  - Single date: `"2024-12-15"`
  - Date range: `"2024-12-01 to 2024-12-31"`
- `artist_filter` (optional): Filter by artist name (case-insensitive)
- `limit` (optional): Max songs to return (default: 25, max: 100)

**Validation:**
- Date must be within last 90 days
- Future dates are rejected
- Date format must be ISO 8601

**Example Request:**
```json
{
  "date": "2024-12-15",
  "artist_filter": "Taylor Swift",
  "limit": 10
}
```

**Example Response:**
```json
{
  "songs": [
    {
      "id": "song-0",
      "title": "Anti-Hero",
      "artist": "Taylor Swift",
      "albumName": "Midnights",
      "startTimeUTC": "2024-12-15T08:15:00Z",
      "stopTimeUTC": "2024-12-15T08:18:30Z",
      "duration": 210
    }
  ],
  "metadata": {
    "channel": "P3",
    "channelId": 164,
    "timestamp": "2024-12-15T10:00:00Z",
    "query": {
      "type": "date-range",
      "startDate": "2024-12-15T00:00:00Z",
      "endDate": "2024-12-15T23:59:59Z",
      "artistFilter": "Taylor Swift",
      "limit": 10
    }
  }
}
```

## Technical Details

### P3 Channel ID

The P3 channel ID is hardcoded as `164` in the server. This is Sveriges Radio's official channel identifier for P3.

### API Integration

This server uses Sveriges Radio's Open API:
- Base URL: `https://api.sr.se/api/v2/playlists/`
- No authentication required
- All requests are read-only
- Responses are in JSON format

### Rate Limiting

The server implements rate limiting to respect SR's infrastructure:
- Maximum 10 requests per minute
- Tracked per server instance
- Returns helpful error messages when limit is exceeded

### Error Handling

All errors are converted to user-friendly messages:
- Network timeouts: "Request timed out. Please try again."
- API unavailable: "Service may be temporarily unavailable."
- Invalid dates: Clear explanation of valid date range
- Rate limit: "Please wait X seconds before trying again."

### Security

- All user inputs validated with Zod schemas
- No API keys or secrets required
- Date inputs sanitized and validated
- No raw API URLs exposed in errors
- Request logging to stderr (not stdout)

## Project Structure

```
SRMCP/
├── src/
│   ├── server.ts              # Main MCP server
│   ├── api-client.ts          # SR API client with rate limiting
│   ├── types.ts               # TypeScript interfaces
│   └── tools/
│       ├── current-playlist.ts    # get_p3_current_playlist tool
│       └── search-playlist.ts     # search_p3_playlist_by_date tool
├── dist/                      # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Building

```bash
npm run build
```

### Type Checking

TypeScript is configured with strict mode enabled. All code is fully typed.

### Logging

Server logs are written to stderr (not stdout, which is reserved for MCP protocol). This allows for debugging without interfering with the MCP communication.

## Deployment

### Raspberry Pi

This server is designed for Raspberry Pi deployment:

1. Ensure Node.js 18+ is installed
2. Clone and build the project
3. Run with `npm start`
4. Configure your MCP client to connect via stdio

### Docker (Optional)

A Dockerfile can be added for containerized deployment if needed.

## Testing

Basic functionality test:
```bash
npm test
```

This runs the server and verifies it starts without errors.

## API Reference

For more information about Sveriges Radio's Open API:
- [SR Open API Documentation](https://sverigesradio.se/api)

## License

MIT

## Contributing

Contributions are welcome! Please ensure:
- All inputs are validated
- Error messages are user-friendly
- Code follows TypeScript best practices
- Tests pass before submitting PRs

## Support

For issues or questions:
- GitHub Issues: [github.com/tomellen/mcpsrtest/issues](https://github.com/tomellen/mcpsrtest/issues)

## Acknowledgments

Built with:
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - MCP SDK
- [Zod](https://github.com/colinhacks/zod) - Input validation
- [Axios](https://github.com/axios/axios) - HTTP client
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) - XML parsing

Data provided by Sveriges Radio's Open API.
