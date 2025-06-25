# SEQ MCP Server

An MCP (Model Context Protocol) server that enables LLMs to query and analyze logs from SEQ structured logging server.

## Features

- **Search Events**: Query logs with powerful SEQ filter syntax
- **Get Event Details**: Retrieve complete information about specific log events  
- **Analyze Logs**: Statistical analysis of log patterns over time periods
- **List Signals**: Access saved searches/signals configured in SEQ
- **Health Check**: Monitor SEQ server status

## Prerequisites

- Node.js 18+
- Access to a SEQ server instance
- SEQ API key (optional but recommended for secure instances)

## Installation

### Option 1: Using Docker (Recommended)

```bash
# Using GitHub Container Registry
docker pull ghcr.io/roeej/seq-mcp:latest

# Or using Docker Hub
docker pull roeej/seq-mcp:latest
```

### Option 2: From Source

```bash
git clone https://github.com/RoeeJ/seq-mcp.git
cd seq-mcp
npm install
npm run build
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SEQ_URL` | URL of your SEQ server | `http://localhost:5341` | Yes |
| `SEQ_API_KEY` | API key for authentication | - | No* |
| `SEQ_DEFAULT_LIMIT` | Default number of events to return | `100` | No |
| `SEQ_TIMEOUT` | Request timeout in milliseconds | `30000` | No |

*Required if your SEQ instance has authentication enabled

### Setup Instructions

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your SEQ server details:
```env
SEQ_URL=http://your-seq-server:5341
SEQ_API_KEY=your-api-key-here
```

## Usage with Claude Desktop

### macOS

1. Open Claude Desktop settings
2. Navigate to "Developer" → "Edit Config"
3. Add the SEQ server configuration:

```json
{
  "mcpServers": {
    "seq": {
      "command": "node",
      "args": ["/absolute/path/to/seq-mcp/dist/index.js"],
      "env": {
        "SEQ_URL": "http://localhost:5341",
        "SEQ_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Windows

1. Open Claude Desktop settings
2. Navigate to "Developer" → "Edit Config"
3. Add the SEQ server configuration:

```json
{
  "mcpServers": {
    "seq": {
      "command": "node.exe",
      "args": ["C:\\path\\to\\seq-mcp\\dist\\index.js"],
      "env": {
        "SEQ_URL": "http://localhost:5341",
        "SEQ_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Usage with Claude Code

### Option 1: Using .env file

1. Create a `.env` file in your project root:
```env
SEQ_URL=http://localhost:5341
SEQ_API_KEY=your-api-key-here
```

2. Add to your Claude Code MCP configuration:

```json
{
  "seq": {
    "command": "node",
    "args": ["/path/to/seq-mcp/dist/index.js"]
  }
}
```

### Option 2: Using environment variables directly

```json
{
  "seq": {
    "command": "node",
    "args": ["/path/to/seq-mcp/dist/index.js"],
    "env": {
      "SEQ_URL": "http://localhost:5341",
      "SEQ_API_KEY": "your-api-key-here",
      "SEQ_DEFAULT_LIMIT": "200",
      "SEQ_TIMEOUT": "60000"
    }
  }
}
```

### Option 3: Using system environment variables

Set environment variables in your shell:

```bash
# macOS/Linux - add to ~/.bashrc or ~/.zshrc
export SEQ_URL="http://localhost:5341"
export SEQ_API_KEY="your-api-key-here"

# Windows PowerShell
$env:SEQ_URL = "http://localhost:5341"
$env:SEQ_API_KEY = "your-api-key-here"
```

Then use a simple configuration:

```json
{
  "seq": {
    "command": "node",
    "args": ["/path/to/seq-mcp/dist/index.js"]
  }
}
```

## Getting API Keys from SEQ

1. Open your SEQ instance in a web browser
2. Navigate to Settings → API Keys
3. Click "Add API Key"
4. Provide a title (e.g., "MCP Server")
5. Set appropriate permissions (typically "Read" is sufficient)
6. Copy the generated API key

## Example Usage in Claude

Once configured, you can query your logs naturally:

```
"Show me all error logs from the last hour"
"Find logs containing 'timeout' errors"
"Analyze the log patterns for my API service"
"What are the most common errors in the last 24 hours?"
"Get details for event ID abc123"
```

## Available Tools

#### search_events
Search for events with filters:
```
- query: SEQ filter syntax (e.g., "Level = 'Error'" or "@Message like '%failed%'")
- count: Number of results (1-1000)
- fromDate/toDate: ISO date strings
- level: Filter by log level
```

#### get_event
Get detailed information about a specific event by ID.

#### analyze_logs
Analyze log patterns:
```
- query: Optional SEQ filter
- timeRange: 1h, 6h, 24h, 7d, or 30d
- groupBy: Property name to group results
```

#### list_signals
List all configured signals (saved searches) in SEQ.

#### check_health
Check SEQ server health status.

## Troubleshooting

### Connection Issues

1. **Verify SEQ is running**: 
   ```bash
   curl http://localhost:5341/api/health
   ```

2. **Check API key permissions**: Ensure your API key has "Read" permissions

3. **Network/Firewall**: Ensure the MCP server can reach your SEQ instance

4. **Timeout errors**: Increase `SEQ_TIMEOUT` for large queries

### Common Errors

- **"Unauthorized"**: Check your API key is correct
- **"Connection refused"**: Verify SEQ_URL and that SEQ is running
- **"Timeout"**: Query may be too complex, try adding more specific filters

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run typecheck
```

## SEQ Query Examples

- `Level = 'Error'` - All error logs
- `@Message like '%timeout%'` - Messages containing "timeout"
- `Application = 'MyApp' and Level in ['Warning', 'Error']` - Warnings and errors from MyApp
- `@Timestamp > Now() - 1h` - Events from last hour
- `StatusCode >= 400` - HTTP errors
- `Environment = 'Production' and ResponseTime > 1000` - Slow production requests
- `UserId = '12345'` - All logs for specific user
- `@Exception is not null` - All logs with exceptions

## Advanced Configuration

### Using with Docker

If SEQ is running in Docker:

```json
{
  "seq": {
    "command": "node",
    "args": ["/path/to/seq-mcp/dist/index.js"],
    "env": {
      "SEQ_URL": "http://host.docker.internal:5341",
      "SEQ_API_KEY": "your-api-key"
    }
  }
}
```

### Using with Remote SEQ

For cloud-hosted SEQ instances:

```json
{
  "seq": {
    "command": "node",
    "args": ["/path/to/seq-mcp/dist/index.js"],
    "env": {
      "SEQ_URL": "https://seq.yourcompany.com",
      "SEQ_API_KEY": "your-api-key",
      "SEQ_TIMEOUT": "60000"
    }
  }
}
```

## Docker Usage

### Running the Container

```bash
# Basic usage
docker run --rm \
  -e SEQ_URL=http://host.docker.internal:5341 \
  -e SEQ_API_KEY=your-api-key \
  ghcr.io/roeej/seq-mcp:latest

# With all environment variables
docker run --rm \
  -e SEQ_URL=http://your-seq-server:5341 \
  -e SEQ_API_KEY=your-api-key \
  -e SEQ_DEFAULT_LIMIT=200 \
  -e SEQ_TIMEOUT=60000 \
  ghcr.io/roeej/seq-mcp:latest
```

### Using with Claude Desktop (Docker)

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "seq": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "SEQ_URL=http://host.docker.internal:5341",
        "-e", "SEQ_API_KEY=your-api-key",
        "ghcr.io/roeej/seq-mcp:latest"
      ]
    }
  }
}
```

### Using with Claude Code (Docker)

```json
{
  "seq": {
    "command": "docker",
    "args": [
      "run",
      "--rm",
      "-i",
      "-e", "SEQ_URL=http://your-seq-server:5341",
      "-e", "SEQ_API_KEY=your-api-key",
      "ghcr.io/roeej/seq-mcp:latest"
    ]
  }
}
```

### Docker Compose Example

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  seq-mcp:
    image: ghcr.io/roeej/seq-mcp:latest
    environment:
      - SEQ_URL=http://seq:5341
      - SEQ_API_KEY=${SEQ_API_KEY}
    networks:
      - seq-network

  seq:
    image: datalust/seq:latest
    ports:
      - "5341:5341"
    environment:
      - ACCEPT_EULA=Y
    networks:
      - seq-network

networks:
  seq-network:
    driver: bridge
```

## Architecture

- **MCP Server**: Handles tool definitions and request routing
- **SEQ Client**: Manages API communication with SEQ
- **Type Safety**: Full TypeScript with Zod validation
- **Error Handling**: Graceful degradation and meaningful error messages

## Security

- API keys are never logged or exposed
- All requests are validated before execution
- Timeout protection for long-running queries
- Read-only operations (no log modification)
- Supports both HTTP and HTTPS connections

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

- **CI**: Runs on every push and PR to ensure code quality
  - Linting with ESLint
  - Type checking with TypeScript
  - Unit tests with Vitest
  - Multi-version Node.js testing (18.x, 20.x)
  
- **Docker Publishing**:
  - Automatically builds and publishes to GitHub Container Registry on main branch
  - Publishes to Docker Hub on version tags
  - Multi-platform builds (linux/amd64, linux/arm64)
  - Semantic versioning tags

### Creating a Release

1. Tag your release:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. The GitHub Action will automatically:
   - Build multi-platform Docker images
   - Push to `ghcr.io/roeej/seq-mcp:1.0.0`
   - Push to `dockerhub/roeej/seq-mcp:1.0.0` (requires secrets setup)

### Required GitHub Secrets

For Docker Hub publishing (optional):
- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token

Note: GitHub Container Registry (ghcr.io) publishing works automatically with the repository's GITHUB_TOKEN, no additional setup required.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT