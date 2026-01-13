# Quick Start Guide

Get up and running with the SR P3 MCP Server in 5 minutes.

## Prerequisites

- Node.js 18 or higher
- Claude Desktop (or another MCP client)

## Installation

```bash
# Clone the repository
git clone https://github.com/tomellen/mcpsrtest.git
cd mcpsrtest

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

### For Claude Desktop

1. Open your Claude Desktop config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add this configuration (replace the path):
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

3. Restart Claude Desktop

## Usage Examples

Once configured, you can ask Claude:

### Get Current Playlist
```
"What's currently playing on P3?"
"Show me the current song on Sveriges Radio P3"
```

### Search by Date
```
"What songs played on P3 on December 15th, 2024?"
"Show me P3's playlist from last week"
```

### Search with Artist Filter
```
"Find all Taylor Swift songs that played on P3 in December 2024"
"Show me songs by The Weeknd on P3 from the last 7 days"
```

## Testing

Test the server without Claude Desktop:

```bash
# Run the manual test suite
node test-manual.js
```

Expected output:
```
============================================================
SR P3 MCP Server - Manual Test Suite
============================================================

[Test 1] Testing get_p3_current_playlist...
✓ Current playlist fetched successfully
...
🎉 All tests passed!
```

## Common Issues

### Server not showing in Claude Desktop

1. Check the path is absolute (not relative)
2. Verify the file exists: `ls /your/path/dist/server.js`
3. Restart Claude Desktop completely

### Build errors

```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Rate limit errors

Wait 60 seconds between requests. The server limits to 10 requests per minute to respect Sveriges Radio's infrastructure.

## Next Steps

- Read [README.md](README.md) for detailed documentation
- See [CONFIGURATION.md](CONFIGURATION.md) for advanced setup
- Check [SECURITY.md](SECURITY.md) for security information

## Example Session

```
You: What's playing on P3 right now?

Claude: Let me check the current P3 playlist for you.
[Uses get_p3_current_playlist tool]

Currently playing on Sveriges Radio P3:
- Song: "Anti-Hero"
- Artist: Taylor Swift
- Album: Midnights
- Started at: 10:30 UTC

Previous song:
- "Flowers" by Miley Cyrus

Next up:
- "As It Was" by Harry Styles
```

## Raspberry Pi Quick Setup

```bash
# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and build
cd ~
git clone https://github.com/tomellen/mcpsrtest.git
cd mcpsrtest
npm install
npm run build

# Test
npm start
```

## Support

- Issues: [github.com/tomellen/mcpsrtest/issues](https://github.com/tomellen/mcpsrtest/issues)
- Documentation: See [README.md](README.md)
- Security: See [SECURITY.md](SECURITY.md)

## License

MIT - See [LICENSE](LICENSE) for details.
