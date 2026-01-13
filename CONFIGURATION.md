# Configuration Guide

This guide explains how to configure the SR P3 MCP Server with various MCP clients.

## Table of Contents

1. [Claude Desktop](#claude-desktop)
2. [Generic MCP Client](#generic-mcp-client)
3. [Environment Variables](#environment-variables)
4. [Troubleshooting](#troubleshooting)

## Claude Desktop

To use this server with Claude Desktop:

1. **Build the server** (if you haven't already):
   ```bash
   cd /path/to/mcpsrtest
   npm install
   npm run build
   ```

2. **Find your Claude Desktop config file**:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

3. **Edit the config file** and add the server:
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

   **Important**: Replace `/absolute/path/to/mcpsrtest` with the actual full path to your project directory.

4. **Restart Claude Desktop** to load the server.

5. **Verify the server is connected**:
   - Look for the MCP icon in Claude Desktop
   - The sr-p3 server should appear in the list of connected servers
   - You can test it by asking Claude: "What's currently playing on P3?"

### macOS Example

```json
{
  "mcpServers": {
    "sr-p3": {
      "command": "node",
      "args": [
        "/Users/yourusername/projects/mcpsrtest/dist/server.js"
      ]
    }
  }
}
```

### Windows Example

```json
{
  "mcpServers": {
    "sr-p3": {
      "command": "node",
      "args": [
        "C:\\Users\\YourUsername\\projects\\mcpsrtest\\dist\\server.js"
      ]
    }
  }
}
```

### Linux/Raspberry Pi Example

```json
{
  "mcpServers": {
    "sr-p3": {
      "command": "node",
      "args": [
        "/home/pi/mcpsrtest/dist/server.js"
      ]
    }
  }
}
```

## Generic MCP Client

For other MCP clients that support stdio transport:

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['/path/to/mcpsrtest/dist/server.js'],
});

const client = new Client(
  {
    name: 'my-client',
    version: '1.0.0',
  },
  {
    capabilities: {},
  }
);

await client.connect(transport);
```

## Environment Variables

The server currently doesn't require any environment variables, but you can optionally create a `.env` file for future configuration:

```bash
# Optional: Custom rate limit (requests per minute)
RATE_LIMIT_RPM=10

# Optional: API timeout in milliseconds
API_TIMEOUT_MS=10000
```

## Raspberry Pi Setup

For Raspberry Pi deployment:

1. **Install Node.js 18+**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone and build**:
   ```bash
   cd ~
   git clone https://github.com/tomellen/mcpsrtest.git
   cd mcpsrtest
   npm install
   npm run build
   ```

3. **Test the server**:
   ```bash
   npm start
   ```

4. **Configure your MCP client** to use the server (see examples above).

## Troubleshooting

### Server won't start

**Problem**: Server fails to start with "Cannot find module" error

**Solution**: Make sure you've run `npm install` and `npm run build` in the project directory.

```bash
cd /path/to/mcpsrtest
npm install
npm run build
```

### Claude Desktop doesn't show the server

**Problem**: The sr-p3 server doesn't appear in Claude Desktop's MCP list

**Solution**:
1. Check that the path in your config is absolute (not relative)
2. Verify the config file syntax is valid JSON
3. Restart Claude Desktop completely (quit and reopen)
4. Check Claude Desktop logs for error messages

### Rate limit errors

**Problem**: Getting "Rate limit exceeded" errors

**Solution**: The server limits requests to 10 per minute. Wait 60 seconds and try again. This is to respect Sveriges Radio's infrastructure.

### No songs returned

**Problem**: Queries return empty results

**Solution**:
1. Verify the date is within the last 90 days
2. Make sure the date is not in the future
3. Sveriges Radio's API may not have data for all time periods
4. Check your internet connection

### API timeout errors

**Problem**: "Request timed out" errors

**Solution**:
1. Check your internet connection
2. Sveriges Radio's API may be temporarily unavailable
3. Try again in a few moments
4. The default timeout is 10 seconds, which should be sufficient

### Validation errors

**Problem**: "Input validation failed" errors

**Solution**:
1. Ensure date format is ISO 8601 (e.g., "2024-12-15")
2. For date ranges, use format: "2024-12-01 to 2024-12-31"
3. Limit must be between 1 and 100
4. Check that all required parameters are provided

## Getting Help

If you encounter issues:

1. Check the server logs (stderr output)
2. Review this troubleshooting guide
3. Open an issue on [GitHub](https://github.com/tomellen/mcpsrtest/issues)

## Advanced Configuration

### Custom Port (Future Enhancement)

Currently, the server uses stdio transport only. If you need HTTP transport in the future, this will be added as an optional configuration.

### Multiple Servers

You can run multiple instances of the server by adding multiple entries to your MCP client config:

```json
{
  "mcpServers": {
    "sr-p3-main": {
      "command": "node",
      "args": ["/path/to/mcpsrtest/dist/server.js"]
    },
    "sr-p3-backup": {
      "command": "node",
      "args": ["/path/to/mcpsrtest-backup/dist/server.js"]
    }
  }
}
```

### Logging

Server logs are written to stderr. To capture logs:

```bash
node dist/server.js 2> server.log
```

This will save all server logs to `server.log` while keeping stdout available for MCP protocol communication.
