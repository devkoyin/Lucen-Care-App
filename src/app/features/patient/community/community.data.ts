export interface CommunityPost {
  id: string;
  author: string;
  authorInitial: string;
  authorColor: string;
  authorBadge?: 'verified-professional' | 'verified-benefactor';
  authorSpecialty?: string;
  groupId: string;
  groupLabel: string;
  groupColor: string;
  timeAgo: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  liked: boolean;
  tags: string[];
}

export interface CommunityGroup {
  id: string;
  name: string;
  icon: string;
  members: number;
  accent: string;
  joined: boolean;
}

export const SEED_GROUPS: CommunityGroup[] = [
  { id: 'diabetes',     name: 'Diabetes Support',  icon: '🩺', members: 1240, accent: '#D97706', joined: true  },
  { id: 'heart',        name: 'Heart Health',       icon: '❤️', members: 876,  accent: '#DC2626', joined: true  },
  { id: 'hypertension', name: 'Hypertension Hub',   icon: '💊', members: 654,  accent: '#7C3AED', joined: false },
  { id: 'wellness',     name: 'General Wellness',   icon: '🌿', members: 2100, accent: '#059669', joined: false },
  { id: 'nutrition',    name: 'Nutrition & Diet',   icon: '🥗', members: 980,  accent: '#0D9488', joined: false },
  { id: 'mental',       name: 'Mental Wellness',    icon: '🧠', members: 540,  accent: '#4F46E5', joined: false },
];

export const SEED_POSTS: CommunityPost[] = [
  {
    id: 'c1',
    author: 'Chioma A.', authorInitial: 'C', authorColor: '#059669',
    groupId: 'diabetes', groupLabel: 'Diabetes Support', groupColor: '#D97706',
    timeAgo: '2 hours ago',
    title: 'Anyone else managing Metformin stomach issues?',
    content: "I've been on Metformin 500mg for about 3 months and still get occasional nausea. My doctor said it should settle, but wondering if anyone has tips? I currently take it with breakfast but it still bothers me sometimes.",
    likes: 24, comments: 18, liked: false,
    tags: ['Metformin', 'Diabetes', 'SideEffects'],
  },
  {
    id: 'c1b',
    author: 'Dr. Yemi Adekunle', authorInitial: 'Y', authorColor: '#16A34A',
    authorBadge: 'verified-professional', authorSpecialty: 'Endocrinology',
    groupId: 'diabetes', groupLabel: 'Diabetes Support', groupColor: '#D97706',
    timeAgo: '6 hours ago',
    title: 'Clinical note: when persistent Metformin GI side effects are worth a dose review',
    content: "As an endocrinologist, I often see patients give up on Metformin too early because of GI discomfort. A few practical thresholds for when this is worth raising with your care team rather than just pushing through it.",
    likes: 64, comments: 12, liked: false,
    tags: ['Metformin', 'ClinicalAdvice', 'Diabetes'],
  },
  {
    id: 'c2',
    author: 'Emeka O.', authorInitial: 'E', authorColor: '#2563EB',
    groupId: 'heart', groupLabel: 'Heart Health', groupColor: '#DC2626',
    timeAgo: '5 hours ago',
    title: 'Blood pressure diary — what I learned after 6 months',
    content: "Keeping a BP log has genuinely changed how I manage my hypertension. I started logging morning and evening readings and my cardiologist was impressed with the data at my last follow-up. Here's what worked for me and what didn't.",
    likes: 57, comments: 31, liked: true,
    tags: ['BloodPressure', 'Hypertension', 'Tracking'],
  },
  {
    id: 'c3',
    author: 'Fatima K.', authorInitial: 'F', authorColor: '#7C3AED',
    groupId: 'wellness', groupLabel: 'General Wellness', groupColor: '#059669',
    timeAgo: '1 day ago',
    title: 'Staying consistent with medications — my system',
    content: "After forgetting doses for years I finally have a routine that works. I pair my 8pm medications with making tea — 60-day streak and counting. Happy to share the full routine if it helps anyone here.",
    likes: 89, comments: 44, liked: false,
    tags: ['MedicationAdherence', 'Habits', 'Wellness'],
  },
  {
    id: 'c4',
    author: 'Adaeze M.', authorInitial: 'A', authorColor: '#DB2777',
    groupId: 'nutrition', groupLabel: 'Nutrition & Diet', groupColor: '#0D9488',
    timeAgo: '2 days ago',
    title: 'Foods that actually helped lower my LDL cholesterol',
    content: "My Atorvastatin is doing its job but I wanted to support it with diet changes. Over 4 months, adding oats, flaxseeds and fatty fish helped bring my LDL down another 8 points. Sharing my rough weekly meal plan below.",
    likes: 43, comments: 27, liked: false,
    tags: ['Cholesterol', 'Nutrition', 'HeartHealth'],
  },
  {
    id: 'c5',
    author: 'Bisi L.', authorInitial: 'B', authorColor: '#D97706',
    groupId: 'hypertension', groupLabel: 'Hypertension Hub', groupColor: '#7C3AED',
    timeAgo: '3 days ago',
    title: 'How do you deal with white coat syndrome?',
    content: "My readings at the clinic are always higher than at home. Has anyone had success getting their doctor to consider home readings? I'm worried my medication might get increased unnecessarily based on clinic numbers alone.",
    likes: 31, comments: 22, liked: false,
    tags: ['WhiteCoatSyndrome', 'Anxiety', 'BloodPressure'],
  },
  {
    id: 'c6',
    author: 'Tunde B.', authorInitial: 'T', authorColor: '#0D9488',
    groupId: 'diabetes', groupLabel: 'Diabetes Support', groupColor: '#D97706',
    timeAgo: '4 days ago',
    title: 'HbA1c dropped from 8.2 to 6.9 — here is what changed',
    content: "Six months ago my endocrinologist was concerned about my HbA1c. I made three changes: tightened my meal timing, started a 20-minute evening walk, and stopped skipping my Metformin evening dose. The results surprised me.",
    likes: 112, comments: 63, liked: false,
    tags: ['HbA1c', 'Diabetes', 'LifestyleChange'],
  },
  {
    id: 'c1c',
    author: 'Adunola F.', authorInitial: 'A', authorColor: '#D97706',
    authorBadge: 'verified-benefactor' as const,
    groupId: 'wellness', groupLabel: 'General Wellness', groupColor: '#059669',
    timeAgo: '6 hours ago',
    title: 'How I found a way to contribute as someone who cares deeply about patient communities',
    content: "I'm not a medical professional but I believe in what this community does. After becoming a Verified Benefactor I've been able to engage more meaningfully — sharing resources, supporting discussions, and knowing my presence here actually matters to patients navigating hard days.",
    likes: 44, comments: 17, liked: false,
    tags: ['Support', 'Community', 'Benefactor'],
  },
  {
    id: 'c7',
    author: 'Ngozi E.', authorInitial: 'N', authorColor: '#4F46E5',
    groupId: 'mental', groupLabel: 'Mental Wellness', groupColor: '#4F46E5',
    timeAgo: '5 days ago',
    title: 'Managing health anxiety when living with a chronic condition',
    content: "Being diagnosed with both hypertension and diabetes triggered real anxiety for me. I've been working with a therapist and wanted to share some techniques that help me avoid spiralling when I see an unusual reading.",
    likes: 76, comments: 51, liked: false,
    tags: ['HealthAnxiety', 'MentalHealth', 'ChronicCondition'],
  },
];

export const TRENDING = [
  { tag: 'Metformin',           count: 38 },
  { tag: 'BloodPressure',       count: 54 },
  { tag: 'MedicationAdherence', count: 29 },
  { tag: 'HbA1c',               count: 22 },
  { tag: 'HeartHealth',         count: 47 },
  { tag: 'HealthyEating',       count: 33 },
];
