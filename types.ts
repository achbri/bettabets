
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum SubscriptionType {
  FREE = 'FREE',
  VIP = 'VIP',
  VVIP = 'VVIP'
}

export enum PredictionCategory {
  FREE = 'FREE',
  VIP = 'VIP',
  VVIP = 'VVIP',
  SUREST = 'SUREST'
}

export enum PredictionResult {
  PENDING = 'PENDING',
  WIN = 'WIN',
  LOSS = 'LOSS'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  subscription: SubscriptionType;
  expiry_date: string | null;
  country?: string;
  is_blocked?: boolean;
  profile_pic?: string; // Base64 or URL
  created_at?: string;
}

export interface Prediction {
  id: string;
  league: string;
  match: string;
  tip: string;
  odds: string;
  kickoffTime: string;
  category: PredictionCategory;
  result: PredictionResult;
  date: string;
  score?: string; // Final match result
  analysis?: string; // AI generated analysis
  homeLogo?: string;
  awayLogo?: string;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  username: string;
  plan: string;
  amount: string;
  proofUrl: string; // Base64 data of the proof screenshot
  status: PaymentStatus;
  date: string;
  method: 'MOMO' | 'BTC' | 'USDT' | 'LTC' | 'ETH' | 'SOL';
}

export interface AppConfig {
  id?: number;
  currency: 'XAF' | 'USD';
  exchange_rate: number; // Rate from USD to XAF (e.g. 600)
  logo?: string;
  momoNumber: string;
  momoName: string;
  btcAddress: string;
  usdtAddress: string;
  ltcAddress: string;
  ethAddress: string;
  solAddress: string;
  ticker_speed?: number; // Speed in seconds for a full scroll
  youtube_video_id?: string; // YouTube video ID for the hero section
  popup: {
    active: boolean;
    title: string;
    content: string;
  };
  prices: Record<string, number>;
}

export interface SupportMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  date: string;
  adminReply?: string;
  replyDate?: string;
}

export interface Testimonial {
  id: string;
  user_id: string;
  username: string;
  profile_pic: string;
  content: string;
  rating: number;
  is_approved: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_percentage: number;
  isActive: boolean;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
