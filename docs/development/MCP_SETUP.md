# MCP (Model Context Protocol) Setup for HIVE

This document describes the MCP servers configured for Claude Code in the HIVE project.

## Configured MCP Servers

### 1. Playwright MCP
**Purpose**: Browser automation and testing  
**Package**: `@playwright/mcp@latest`  
**Configuration**: 
- Environment variable: `HIVE_BASE_URL=http://localhost:3000`
- Used for E2E testing and browser automation

### 2. Context7 MCP
**Purpose**: Access to up-to-date, version-specific documentation and code examples  
**Package**: `@upstash/context7-mcp`  
**Configuration**: Standard npx execution

## Configuration Location

The MCP configuration is stored at:
```
~/.cursor/mcp.json
```

## Current Configuration

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {
        "HIVE_BASE_URL": "http://localhost:3000"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

## Usage

### Using Context7 in Prompts

When working with Claude Code, you can request it to use Context7 for documentation:

```
Please use context7 to get the latest documentation before writing the code.
```

### Verifying MCP Servers

To verify MCP servers are available, check the MCP resources in Claude Code:
- The servers should appear in the available MCP resources list
- You can use `list_mcp_resources` to see available resources

## Troubleshooting

### MCP Server Not Available

1. **Restart Cursor**: MCP configuration changes require a Cursor restart
2. **Check Package Availability**: Verify the package exists:
   ```bash
   npx -y @upstash/context7-mcp --help
   ```
3. **Check Configuration Syntax**: Ensure `~/.cursor/mcp.json` is valid JSON

### Context7 Not Working

- Verify the package name: `@upstash/context7-mcp`
- Check if there's an alternative package or if the name has changed
- Ensure npx can access npm registry

## Adding New MCP Servers

To add a new MCP server, edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["package-name"],
      "env": {
        "ENV_VAR": "value"
      }
    }
  }
}
```

Then restart Cursor for changes to take effect.

## References

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Playwright MCP](https://github.com/playwright-community/playwright-mcp)
- [Context7 MCP](https://github.com/upstash/context7-mcp)











