export interface ProPost {
  id: string;
  title: string;
  community: string;
  communityColor: string;
  tag: string;
  timeAgo: string;
  likes: number;
  comments: number;
}

export interface PatientThread {
  id: string;
  title: string;
  community: string;
  communityColor: string;
  tag: string;
  urgent: boolean;
  replies: number;
  timeAgo: string;
}

export interface ExpertiseArea {
  name: string;
  icon: string;
  postCount: number;
  endorsements: number;
}

export interface ProActivityStat {
  icon: string;
  label: string;
  value: string | number;
  trend?: string;
  accent?: boolean;
}

export const PRO_STATS: ProActivityStat[] = [
  { icon: '💬', label: 'Posts this month',      value: 14,  trend: '+4 vs last month' },
  { icon: '🤝', label: 'Communities active',    value: 3 },
  { icon: '✅', label: 'Questions answered',    value: 47,  trend: '+11 this month' },
  { icon: '🔔', label: 'Unanswered mentions',   value: 5,   accent: true },
];

export const SEED_PRO_POSTS: ProPost[] = [
  {
    id: 'pp1',
    title: 'Managing Metformin GI side effects — practical tips from clinic',
    community: 'Diabetes Support',
    communityColor: '#D97706',
    tag: 'Clinical Tip',
    timeAgo: '2 hours ago',
    likes: 38,
    comments: 12,
  },
  {
    id: 'pp2',
    title: 'Why home blood pressure readings matter as much as clinic readings',
    community: 'Hypertension Hub',
    communityColor: '#7C3AED',
    tag: 'Patient Education',
    timeAgo: '1 day ago',
    likes: 71,
    comments: 24,
  },
  {
    id: 'pp3',
    title: 'HbA1c targets — what the numbers actually mean for daily life',
    community: 'Diabetes Support',
    communityColor: '#D97706',
    tag: 'Explained',
    timeAgo: '3 days ago',
    likes: 95,
    comments: 41,
  },
  {
    id: 'pp4',
    title: 'Statins and muscle pain: separating myth from clinical risk',
    community: 'Heart Health',
    communityColor: '#DC2626',
    tag: 'Myth-busting',
    timeAgo: '5 days ago',
    likes: 58,
    comments: 19,
  },
  {
    id: 'pp5',
    title: 'When to escalate from GP to cardiologist — a practical guide',
    community: 'Heart Health',
    communityColor: '#DC2626',
    tag: 'Clinical Tip',
    timeAgo: '1 week ago',
    likes: 44,
    comments: 9,
  },
];

export const SEED_PATIENT_THREADS: PatientThread[] = [
  {
    id: 'pt1',
    title: 'Is it safe to take ibuprofen with lisinopril long term?',
    community: 'Hypertension Hub',
    communityColor: '#7C3AED',
    tag: 'Drug Interaction',
    urgent: true,
    replies: 6,
    timeAgo: '45 min ago',
  },
  {
    id: 'pt2',
    title: 'My cardiologist recommended I stop Atorvastatin — second opinion?',
    community: 'Heart Health',
    communityColor: '#DC2626',
    tag: 'Cardiology',
    urgent: true,
    replies: 3,
    timeAgo: '2 hours ago',
  },
  {
    id: 'pt3',
    title: 'Feeling very dizzy after starting Amlodipine — is this normal?',
    community: 'Hypertension Hub',
    communityColor: '#7C3AED',
    tag: 'Side Effects',
    urgent: true,
    replies: 2,
    timeAgo: '3 hours ago',
  },
  {
    id: 'pt4',
    title: 'What foods spike blood sugar the most unexpectedly?',
    community: 'Diabetes Support',
    communityColor: '#D97706',
    tag: 'Nutrition',
    urgent: false,
    replies: 22,
    timeAgo: '6 hours ago',
  },
  {
    id: 'pt5',
    title: 'Managing fatigue with heart failure — tips that actually help',
    community: 'Heart Health',
    communityColor: '#DC2626',
    tag: 'Symptom Management',
    urgent: false,
    replies: 17,
    timeAgo: '1 day ago',
  },
  {
    id: 'pt6',
    title: 'Can I drink alcohol occasionally while on Metformin?',
    community: 'Diabetes Support',
    communityColor: '#D97706',
    tag: 'Lifestyle',
    urgent: false,
    replies: 9,
    timeAgo: '2 days ago',
  },
];

export const SEED_EXPERTISE_AREAS: ExpertiseArea[] = [
  { name: 'Cardiology',          icon: '❤️',  postCount: 18, endorsements: 94  },
  { name: 'Hypertension',        icon: '🩺',  postCount: 22, endorsements: 111 },
  { name: 'Diabetes Management', icon: '🩸',  postCount: 31, endorsements: 156 },
  { name: 'Pharmacology',        icon: '💊',  postCount: 14, endorsements: 73  },
  { name: 'Preventive Care',     icon: '🛡️', postCount: 9,  endorsements: 48  },
];

export const PRO_IMPACT = {
  patientsReached: '2,400+',
  questionsAnswered: 47,
  avgResponseTime: '3.2 hrs',
  helpfulRating: '96%',
};
