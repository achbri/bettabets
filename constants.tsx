
import { SubscriptionType, PredictionCategory, PredictionResult, AppConfig, Prediction } from './types';

export const DEFAULT_APP_CONFIG: AppConfig = {
  currency: 'XAF',
  exchange_rate: 600,
  logo: 'https://i.ibb.co/b833KVf/logo-no-bg.png',
  momoNumber: '+237 600 000 000',
  momoName: 'BETTABETS XAF SERVICES',
  btcAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  usdtAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  ltcAddress: 'LURvbeP1fJpXfA8m1L8o9B9m1A1v1B1C1D',
  ethAddress: '0x1234567890abcdef1234567890abcdef12345678',
  solAddress: 'So11111111111111111111111111111111111111112',
  ticker_speed: 40,
  youtube_video_id: 'qXf6n3m03sA',
  popup: {
    active: false,
    title: 'XAF Special Promo!',
    content: 'Get a massive discount on VIP plans today!'
  },
  prices: {
    'vip-7': 5000,
    'vip-14': 9000,
    'vip-30': 15000,
    'vvip-30': 35000
  }
};

export const PLANS_TEMPLATE = [
  { id: 'vip-7', name: 'VIP Daily 2+ (1 Week)', type: SubscriptionType.VIP, durationDays: 7 },
  { id: 'vip-14', name: 'VIP Daily 2+ (2 Weeks)', type: SubscriptionType.VIP, durationDays: 14 },
  { id: 'vip-30', name: 'VIP Daily 2+ (Monthly)', type: SubscriptionType.VIP, durationDays: 30 },
  { id: 'vvip-30', name: 'Special VVIP+ (Monthly)', type: SubscriptionType.VVIP, durationDays: 30 },
];

/**
 * Historical verified winners from Sunday, February 8, 2026.
 * Updated with real-world scores provided for maximum platform integrity.
 */
export const INITIAL_PREDICTIONS: Prediction[] = [
  {
    id: 'verif-2026-01',
    league: 'Serie A',
    match: 'Sassuolo Vs Inter M.',
    tip: 'Away Wins',
    odds: '1.45',
    kickoffTime: '15:00',
    category: PredictionCategory.VVIP,
    result: PredictionResult.WIN,
    date: '2026-02-08',
    score: '0-5'
  },
  {
    id: 'verif-2026-02',
    league: 'Bundesliga',
    match: 'Bayern Munchen Vs 1899 Hoffenheim',
    tip: 'Home Wins & Over 2.5',
    odds: '1.38',
    kickoffTime: '14:30',
    category: PredictionCategory.VVIP,
    result: PredictionResult.WIN,
    date: '2026-02-08',
    score: '5-1'
  },
  {
    id: 'verif-2026-03',
    league: 'Super Lig',
    match: 'Rizespor Vs Galatasaray',
    tip: 'Away Wins',
    odds: '1.55',
    kickoffTime: '19:00',
    category: PredictionCategory.VIP,
    result: PredictionResult.WIN,
    date: '2026-02-08',
    score: '0-3'
  },
  {
    id: 'verif-2026-04',
    league: 'La Liga',
    match: 'Valencia Vs Real Madrid',
    tip: 'Away Wins',
    odds: '1.68',
    kickoffTime: '20:00',
    category: PredictionCategory.VIP,
    result: PredictionResult.WIN,
    date: '2026-02-08',
    score: '0-2'
  },
  {
    id: 'verif-2026-05',
    league: 'Bundesliga',
    match: 'FC Koln Vs RB Leipzig',
    tip: 'Away Wins',
    odds: '1.75',
    kickoffTime: '15:30',
    category: PredictionCategory.FREE,
    result: PredictionResult.WIN,
    date: '2026-02-08',
    score: '1-2'
  },
  {
    id: 'verif-2026-06',
    league: 'Super Lig',
    match: 'Besiktas Vs Alanyaspor',
    tip: 'Over 1.5 Goals',
    odds: '1.22',
    kickoffTime: '16:00',
    category: PredictionCategory.FREE,
    result: PredictionResult.WIN,
    date: '2026-02-08',
    score: '2-2'
  },
  {
    id: 'verif-2026-07',
    league: 'Liga Portugal',
    match: 'Benfica Vs Alverca',
    tip: 'Home Wins',
    odds: '1.20',
    kickoffTime: '20:30',
    category: PredictionCategory.FREE,
    result: PredictionResult.WIN,
    date: '2026-02-08',
    score: '2-1'
  }
];
