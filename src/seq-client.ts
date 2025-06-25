import axios, { AxiosInstance } from 'axios';
import { SeqConfig, SeqEvent, SeqSearchResult, SeqSignal, SearchOptions } from './types.js';

interface InternalSeqConfig {
  url: string;
  apiKey?: string;
  defaultLimit: number;
  timeout: number;
}

export class SeqClient {
  private client: AxiosInstance;
  private config: InternalSeqConfig;

  constructor(config: SeqConfig) {
    this.config = {
      url: config.url.replace(/\/$/, ''),
      apiKey: config.apiKey,
      defaultLimit: config.defaultLimit || 100,
      timeout: config.timeout || 30000
    };

    this.client = axios.create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/json',
        ...(this.config.apiKey && { 'X-Seq-ApiKey': this.config.apiKey })
      }
    });
  }

  async searchEvents(options: SearchOptions = {}): Promise<SeqSearchResult> {
    const params: Record<string, string | number | boolean> = {
      count: options.count || this.config.defaultLimit,
      render: options.render !== false
    };

    if (options.filter) params.filter = options.filter;
    if (options.startAt) params.startAt = options.startAt;
    if (options.afterId) params.afterId = options.afterId;
    if (options.signal) params.signal = options.signal;
    if (options.fromDateUtc) params.fromDateUtc = options.fromDateUtc;
    if (options.toDateUtc) params.toDateUtc = options.toDateUtc;

    const response = await this.client.get<SeqSearchResult>('/api/events', { params });
    return response.data;
  }

  async getEvent(id: string): Promise<SeqEvent> {
    const response = await this.client.get<SeqEvent>(`/api/events/${id}`);
    return response.data;
  }

  async getSignals(): Promise<SeqSignal[]> {
    const response = await this.client.get<SeqSignal[]>('/api/signals');
    return response.data;
  }

  async getSignal(id: string): Promise<SeqSignal> {
    const response = await this.client.get<SeqSignal>(`/api/signals/${id}`);
    return response.data;
  }

  async query(seqQuery: string, options: Omit<SearchOptions, 'filter'> = {}): Promise<SeqSearchResult> {
    return this.searchEvents({ ...options, filter: seqQuery });
  }

  async getHealthStatus(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; message?: string }> {
    try {
      await this.client.get('/api/health');
      return { status: 'healthy' };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data ? 
          (error.response.data as { message?: string }).message || error.message : 
          error.message;
        return { 
          status: 'unhealthy', 
          message 
        };
      }
      return { status: 'unhealthy', message: 'Unknown error' };
    }
  }
}