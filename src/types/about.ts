export interface AboutStatistic {
  id?: number | string;
  value: string | number;
  symbol?: string;
  label: string;
}

export interface AboutPillar {
  id?: number | string;
  icon: string;
  title: string;
  description: string;
}

export interface AboutContent {
  main_image: string;
  main_title: string;
  main_description: string;
  secondary_description: string;
  quote_text: string;
  quote_author?: string;
  badge_number?: string;
  badge_label?: string;
  statistics: AboutStatistic[];
  pillars: AboutPillar[];
}
