export interface SeqEvent {
  Id: string;
  TimeStamp: string;
  Level: 'Verbose' | 'Debug' | 'Information' | 'Warning' | 'Error' | 'Fatal';
  MessageTemplate: string;
  RenderedMessage: string;
  Properties: Record<string, unknown>;
  Exception?: string;
}

export interface SeqSearchResult {
  Events: SeqEvent[];
  Statistics: {
    ElapsedMilliseconds: number;
    ScannedEventCount: number;
  };
}

export interface SeqSignal {
  Id: string;
  Title: string;
  Description?: string;
  Filters: Array<{
    Filter?: string;
    FilterNonStrict?: string;
    Description?: string;
  }>;
}

export interface SeqConfig {
  url: string;
  apiKey?: string;
  defaultLimit?: number;
  timeout?: number;
}

export interface SearchOptions {
  filter?: string;
  count?: number;
  startAt?: string;
  afterId?: string;
  signal?: string;
  render?: boolean;
  fromDateUtc?: string;
  toDateUtc?: string;
}