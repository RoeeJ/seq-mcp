/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { SeqClient } from './seq-client.js';

vi.mock('axios');

describe('SeqClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should construct with proper config', () => {
    const mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };
    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any);

    const client = new SeqClient({
      url: 'http://localhost:5341/',
      apiKey: 'test-key'
    });
    expect(client).toBeDefined();
  });

  it('should search events with proper parameters', async () => {
    const mockGet = vi.fn().mockResolvedValue({
      data: {
        Events: [],
        Statistics: { ElapsedMilliseconds: 10, ScannedEventCount: 0 }
      }
    });
    
    const mockAxiosInstance = {
      get: mockGet,
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };
    
    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any);

    const client = new SeqClient({ url: 'http://localhost:5341' });
    const result = await client.searchEvents({
      filter: "Level = 'Error'",
      count: 50
    });

    expect(result.Events).toEqual([]);
    expect(result.Statistics.ElapsedMilliseconds).toBe(10);
  });
});