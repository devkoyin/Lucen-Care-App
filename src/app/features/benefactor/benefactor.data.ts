export interface BenContribution {
  id: string;
  program: string;
  org: string;
  orgColor: string;
  category: string;
  amount: number;
  date: string;
  patientsReached: number;
  status: 'Active' | 'Completed';
}

export interface BenThread {
  id: string;
  title: string;
  community: string;
  communityColor: string;
  replies: number;
  timeAgo: string;
}

export interface BenPost {
  id: string;
  title: string;
  community: string;
  communityColor: string;
  timeAgo: string;
  likes: number;
  comments: number;
}

export interface BenActivityStat {
  icon: string;
  label: string;
  value: string | number;
  trend?: string;
  accent?: boolean;
}

export const BEN_STATS: BenActivityStat[] = [
  { icon: '🤝', label: 'Communities joined',  value: 3 },
  { icon: '💬', label: 'Posts this month',     value: 8,    trend: '+3 vs last month' },
  { icon: '❤️', label: 'Likes received',       value: 94,   trend: '+12 this week' },
  { icon: '🔔', label: 'Unread replies',       value: 4,    accent: true },
];

export const SEED_CONTRIBUTIONS: BenContribution[] = [
  {
    id: 'bc1',
    program: 'Access to Diabetes Medicines',
    org: 'Access to Medicines Foundation',
    orgColor: '#F59E0B',
    category: 'Medication Access',
    amount: 150000,
    date: 'Jun 2026',
    patientsReached: 38,
    status: 'Active',
  },
  {
    id: 'bc2',
    program: 'Heart Health Initiative Nigeria',
    org: 'Cardiac Care NGO',
    orgColor: '#DC2626',
    category: 'Cardiology',
    amount: 85000,
    date: 'May 2026',
    patientsReached: 21,
    status: 'Active',
  },
  {
    id: 'bc3',
    program: 'Chronic Disease Support Fund',
    org: 'Lucen NGO Partners',
    orgColor: '#7C3AED',
    category: 'General Support',
    amount: 200000,
    date: 'Mar 2026',
    patientsReached: 64,
    status: 'Completed',
  },
  {
    id: 'bc4',
    program: 'Mental Wellness Community Fund',
    org: 'MindBridge Nigeria',
    orgColor: '#4F46E5',
    category: 'Mental Health',
    amount: 60000,
    date: 'Jan 2026',
    patientsReached: 29,
    status: 'Completed',
  },
];

export const SEED_BEN_THREADS: BenThread[] = [
  {
    id: 'bt1',
    title: 'How to support someone managing Type 2 Diabetes day-to-day',
    community: 'Diabetes Support',
    communityColor: '#D97706',
    replies: 14,
    timeAgo: '1 hour ago',
  },
  {
    id: 'bt2',
    title: 'Resources for caregivers of hypertension patients',
    community: 'Hypertension Hub',
    communityColor: '#7C3AED',
    replies: 9,
    timeAgo: '3 hours ago',
  },
  {
    id: 'bt3',
    title: 'Managing medication costs — what support is available?',
    community: 'General Wellness',
    communityColor: '#059669',
    replies: 21,
    timeAgo: '1 day ago',
  },
  {
    id: 'bt4',
    title: 'Encouraging a loved one to track their blood pressure consistently',
    community: 'Heart Health',
    communityColor: '#DC2626',
    replies: 6,
    timeAgo: '2 days ago',
  },
];

export const SEED_BEN_POSTS: BenPost[] = [
  {
    id: 'bp1',
    title: 'How I found a way to contribute as someone who cares deeply about patient communities',
    community: 'General Wellness',
    communityColor: '#059669',
    timeAgo: '6 hours ago',
    likes: 44,
    comments: 17,
  },
  {
    id: 'bp2',
    title: 'Resources for families supporting loved ones with hypertension',
    community: 'Hypertension Hub',
    communityColor: '#7C3AED',
    timeAgo: '3 days ago',
    likes: 28,
    comments: 11,
  },
  {
    id: 'bp3',
    title: 'Finding emotional support networks online — what worked for my family',
    community: 'Mental Wellness',
    communityColor: '#4F46E5',
    timeAgo: '1 week ago',
    likes: 36,
    comments: 23,
  },
];

export const BEN_IMPACT = {
  totalContributed: '₦495,000',
  patientsReached: 152,
  programsSupported: 4,
  communitiesJoined: 3,
};

export const BEN_IMPACT_HIGHLIGHTS = [
  { icon: '🏘️', text: '3 active patient communities you\'re part of' },
  { icon: '👥', text: '152 patients reached through your programme contributions' },
  { icon: '💛', text: 'Your Verified Benefactor badge encourages others to give' },
  { icon: '💰', text: '₦495,000 contributed across 4 health programmes' },
];
