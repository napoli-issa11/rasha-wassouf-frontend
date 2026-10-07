export interface StudioStatistic {
  id: number | string;
  key: string;
  value: number;
  symbol: string;
  label: string;
  sort_order?: number;
}

export type StatisticUpdateData = Partial<Omit<StudioStatistic, 'id' | 'key'>>;
