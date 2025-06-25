#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { SeqClient } from './seq-client.js';
import { SeqConfig } from './types.js';
import * as dotenv from 'dotenv';

dotenv.config();

const searchEventsSchema = z.object({
  query: z.string().optional().describe('SEQ query filter (e.g., "Level = \'Error\'" or "@Message like \'%failed%\'")'),
  count: z.number().min(1).max(1000).default(100).describe('Number of events to return'),
  fromDate: z.string().optional().describe('Start date in ISO format'),
  toDate: z.string().optional().describe('End date in ISO format'),
  level: z.enum(['Verbose', 'Debug', 'Information', 'Warning', 'Error', 'Fatal']).optional().describe('Filter by log level')
});

const getEventSchema = z.object({
  eventId: z.string().describe('The ID of the event to retrieve')
});

const analyzeLogsSchema = z.object({
  query: z.string().optional().describe('SEQ query filter'),
  timeRange: z.enum(['1h', '6h', '24h', '7d', '30d']).default('24h').describe('Time range to analyze'),
  groupBy: z.string().optional().describe('Property to group results by')
});

class SeqMcpServer {
  private server: Server;
  private seqClient: SeqClient;

  constructor() {
    this.server = new Server(
      {
        name: 'seq-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    const config: SeqConfig = {
      url: process.env.SEQ_URL || 'http://localhost:5341',
      apiKey: process.env.SEQ_API_KEY,
      defaultLimit: parseInt(process.env.SEQ_DEFAULT_LIMIT || '100'),
      timeout: parseInt(process.env.SEQ_TIMEOUT || '30000')
    };

    this.seqClient = new SeqClient(config);
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: [
        {
          name: 'search_events',
          description: 'Search for events in SEQ logs with powerful filtering',
          inputSchema: {
            type: 'object',
            properties: searchEventsSchema.shape,
            required: []
          }
        },
        {
          name: 'get_event',
          description: 'Get detailed information about a specific log event',
          inputSchema: {
            type: 'object',
            properties: getEventSchema.shape,
            required: ['eventId']
          }
        },
        {
          name: 'analyze_logs',
          description: 'Analyze log patterns and statistics over a time period',
          inputSchema: {
            type: 'object',
            properties: analyzeLogsSchema.shape,
            required: []
          }
        },
        {
          name: 'list_signals',
          description: 'List all configured signals (saved searches) in SEQ',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'check_health',
          description: 'Check the health status of the SEQ server',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'search_events':
            return await this.searchEvents(args);
          case 'get_event':
            return await this.getEvent(args);
          case 'analyze_logs':
            return await this.analyzeLogs(args);
          case 'list_signals':
            return await this.listSignals();
          case 'check_health':
            return await this.checkHealth();
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`
          );
        }
        throw error;
      }
    });
  }

  private async searchEvents(args: unknown) {
    const params = searchEventsSchema.parse(args);
    
    let filter = params.query || '';
    if (params.level) {
      const levelFilter = `Level = '${params.level}'`;
      filter = filter ? `${filter} and ${levelFilter}` : levelFilter;
    }

    const result = await this.seqClient.searchEvents({
      filter,
      count: params.count,
      fromDateUtc: params.fromDate,
      toDateUtc: params.toDate
    });

    const formattedEvents = result.Events.map(event => ({
      id: event.Id,
      timestamp: event.TimeStamp,
      level: event.Level,
      message: event.RenderedMessage,
      properties: event.Properties,
      ...(event.Exception && { exception: event.Exception })
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            events: formattedEvents,
            count: formattedEvents.length,
            statistics: result.Statistics
          }, null, 2)
        }
      ]
    };
  }

  private async getEvent(args: unknown) {
    const params = getEventSchema.parse(args);
    const event = await this.seqClient.getEvent(params.eventId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: event.Id,
            timestamp: event.TimeStamp,
            level: event.Level,
            messageTemplate: event.MessageTemplate,
            message: event.RenderedMessage,
            properties: event.Properties,
            exception: event.Exception
          }, null, 2)
        }
      ]
    };
  }

  private async analyzeLogs(args: unknown) {
    const params = analyzeLogsSchema.parse(args);
    
    const now = new Date();
    const timeRanges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const fromDate = new Date(now.getTime() - timeRanges[params.timeRange]);
    
    const result = await this.seqClient.searchEvents({
      filter: params.query,
      count: 1000,
      fromDateUtc: fromDate.toISOString(),
      toDateUtc: now.toISOString()
    });

    const levelCounts: Record<string, number> = {};
    const errorMessages: Record<string, number> = {};
    const propertyGroups: Record<string, Record<string, number>> = {};

    result.Events.forEach(event => {
      levelCounts[event.Level] = (levelCounts[event.Level] || 0) + 1;
      
      if (event.Level === 'Error' || event.Level === 'Fatal') {
        const msg = event.MessageTemplate.substring(0, 100);
        errorMessages[msg] = (errorMessages[msg] || 0) + 1;
      }

      if (params.groupBy && event.Properties[params.groupBy]) {
        const value = String(event.Properties[params.groupBy]);
        if (!propertyGroups[params.groupBy]) {
          propertyGroups[params.groupBy] = {};
        }
        propertyGroups[params.groupBy][value] = (propertyGroups[params.groupBy][value] || 0) + 1;
      }
    });

    const topErrors = Object.entries(errorMessages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([msg, count]) => ({ message: msg, count }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            timeRange: params.timeRange,
            totalEvents: result.Events.length,
            levelDistribution: levelCounts,
            topErrors,
            ...(params.groupBy && { groupedBy: { [params.groupBy]: propertyGroups[params.groupBy] } }),
            statistics: result.Statistics
          }, null, 2)
        }
      ]
    };
  }

  private async listSignals() {
    const signals = await this.seqClient.getSignals();
    
    const formattedSignals = signals.map(signal => ({
      id: signal.Id,
      title: signal.Title,
      description: signal.Description,
      filterCount: signal.Filters.length
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            signals: formattedSignals,
            count: formattedSignals.length
          }, null, 2)
        }
      ]
    };
  }

  private async checkHealth() {
    const health = await this.seqClient.getHealthStatus();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: health.status,
            message: health.message || 'SEQ server is operational',
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SEQ MCP server running on stdio');
  }
}

const server = new SeqMcpServer();
server.run().catch(console.error);