# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Features

This MCP server implements several security best practices:

### Input Validation

- **Zod Schemas**: All user inputs are validated using Zod with strict type checking
- **Date Validation**: Rejects future dates and dates older than 90 days
- **Range Validation**: Limit parameter constrained to 1-100
- **Format Validation**: Date strings must be ISO 8601 format

### Rate Limiting

- **10 requests per minute** maximum to respect Sveriges Radio's infrastructure
- Per-instance tracking (resets when server restarts)
- User-friendly error messages when limit is exceeded

### Error Handling

- **No raw API URLs** exposed in error messages
- **No system paths** included in user-facing errors
- **No stack traces** sent to clients
- All errors converted to user-friendly messages

### API Security

- **No authentication required** (Sveriges Radio Open API is public)
- **No API keys** or secrets stored
- **Read-only operations** only (GET requests)
- **No user data** collected or stored
- **No sensitive data** in request logs

### Logging

- All requests logged to **stderr** (not stdout)
- Logs include timestamps and parameters
- No sensitive data logged
- Stdout reserved for MCP protocol only

## Security Checklist

The following security measures have been implemented:

- [x] All user inputs validated with Zod
- [x] No hardcoded secrets or API keys
- [x] Error messages are user-friendly, not technical
- [x] Rate limiting implemented (10 req/min)
- [x] Date inputs reject future dates
- [x] Timeout handling prevents hanging requests (10s timeout)
- [x] No raw API response data exposed to Claude
- [x] Server logs don't contain sensitive data
- [x] TypeScript strict mode enabled
- [x] No eval() or other dangerous functions used
- [x] Dependencies regularly updated
- [x] No arbitrary code execution vulnerabilities

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by:

1. **Do NOT** open a public GitHub issue
2. Email the maintainers at the repository (see GitHub profile)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work to address the issue promptly.

## Known Limitations

### Public API

This server uses Sveriges Radio's public API, which:
- Requires no authentication
- Is publicly accessible to anyone
- May rate-limit or block requests if abused
- May change without notice

### Rate Limiting

- Rate limiting is per-instance (not global)
- Running multiple server instances bypasses the limit
- This is intentional for legitimate multi-instance deployments

### Data Privacy

- No user data is collected
- No analytics or tracking
- All requests go directly to Sveriges Radio's API
- No intermediate storage or caching

## Best Practices for Deployment

### Raspberry Pi / Local Deployment

1. **Keep Node.js updated**: Use Node.js 18 LTS or later
2. **Run as non-root user**: Never run as root/administrator
3. **Monitor logs**: Check stderr for unusual activity
4. **Update dependencies**: Run `npm audit` regularly
5. **Use process manager**: Consider PM2 or systemd for production

### Network Security

1. **Firewall**: No inbound ports needed (stdio transport)
2. **Outbound**: Server only needs HTTP access to `api.sr.se`
3. **No exposed ports**: Server doesn't listen on any network ports

### Example systemd service (Linux)

```ini
[Unit]
Description=SR P3 MCP Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/mcpsrtest
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

## Dependencies

This project uses the following dependencies:

- `@modelcontextprotocol/sdk` - MCP SDK (official)
- `axios` - HTTP client (widely used, well-maintained)
- `fast-xml-parser` - XML parsing (popular, actively maintained)
- `zod` - Input validation (type-safe, popular)

Run `npm audit` regularly to check for known vulnerabilities:

```bash
npm audit
npm audit fix  # Apply automatic fixes
```

## Responsible Disclosure

We appreciate security researchers who:
- Report vulnerabilities privately first
- Give us reasonable time to fix issues
- Don't exploit vulnerabilities maliciously
- Help make this project more secure

## Security Updates

Security updates will be:
- Released as patch versions (e.g., 1.0.1, 1.0.2)
- Documented in GitHub releases
- Announced in the repository

Subscribe to GitHub releases to stay informed.

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [MCP Security Guidelines](https://modelcontextprotocol.io/docs/security)

## License

See [LICENSE](LICENSE) for terms of use.
