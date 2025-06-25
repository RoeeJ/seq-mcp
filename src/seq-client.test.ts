import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { SeqClient } from './seq-client.js';

vi.mock('axios');

describe('SeqClient', () => {
  it('should construct with proper config', () => {
    const client = new SeqClient({
      url: 'http://localhost:5341/',
      apiKey: 'test-key'
    });
    expect(client).toBeDefined();
  });

  it('should search events with proper parameters', async () => {
    const mockCreate = vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue({
        data: {
          Events: [],
          Statistics: { ElapsedMilliseconds: 10, ScannedEventCount: 0 }
        }
      })
    });
    (axios.create as any) = mockCreate;

    const client = new SeqClient({ url: 'http://localhost:5341' });
    const result = await client.searchEvents({
      filter: "Level = 'Error'",
      count: 50
    });

    expect(result.Events).toEqual([]);
    expect(result.Statistics.ElapsedMilliseconds).toBe(10);
  });
});