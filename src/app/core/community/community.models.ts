/**
 * Every shape the community API returns, plus the small pure helpers the feature
 * shares. Separate from the services because there are enough of them to earn a
 * file — the same split `core/medications` and `core/consents` already make.
 */

/**
 * Who wrote something, entirely as the server decided.
 *
 * The client MUST NOT build a display name. Patients are pseudonymised server-side
 * ("Amaka O.") and their real name never reaches the browser; professionals and
 * benefactors carry a badge only the server can vouch for, because it depends on an
 * approval status that changes long after the token was issued.
 */
export interface CommunityAuthor {
  userId: string;
  displayName: string;
  initial: string;
  verified: boolean;
  badge?: 'verified-professional' | 'verified-benefactor';
  specialty?: string | null;
}

export type CommunityStatus = 'active' | 'archived';
export type ContentStatus = 'published' | 'hidden';

export interface CommunityGroup {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  accent?: string | null;
  disclaimer?: string | null;
  tags: string[];
  status: CommunityStatus;
  memberCount: number;
  postCount: number;
  /** Whether the signed-in user is currently a member. */
  joined: boolean;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  communityId: string;
  communityName: string;
  communityAccent?: string | null;
  author: CommunityAuthor;
  title?: string | null;
  body: string;
  tags: string[];
  commentCount: number;
  reactionCount: number;
  reactedByMe: boolean;
  createdAt: string;
  lastActivityAt: string;
  status: ContentStatus;
  /** False once a moderator has hidden it. Only its author ever sees such a post. */
  visibleToOthers: boolean;
  hiddenReason?: string | null;
  hiddenAt?: string | null;
}

export interface CommunityComment {
  id: string;
  postId: string;
  /** Set on a reply. Nesting is one level — the server re-parents anything deeper. */
  parentCommentId?: string | null;
  author: CommunityAuthor;
  body: string;
  reactionCount: number;
  reactedByMe: boolean;
  createdAt: string;
  status: ContentStatus;
  visibleToOthers: boolean;
  hiddenReason?: string | null;
}

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'misinformation'
  | 'medical_advice'
  | 'personal_data'
  | 'other';

export type ReportTargetType = 'post' | 'comment';
export type ReportStatus = 'pending' | 'actioned' | 'dismissed';

export interface CommunityReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  communityId: string;
  communityName: string;
  reason: ReportReason;
  details?: string | null;
  status: ReportStatus;
  resolutionNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reporterDisplayName: string;
  /** A snapshot, so the queue stays readable after the content is removed. */
  targetTitle?: string | null;
  targetBody: string;
  targetAuthorDisplayName: string;
  targetAuthorVerified: boolean;
  targetHidden: boolean;
  openReportCount: number;
}

/** The four tiles across the top of the portal. Platform-wide, not per-user. */
export interface CommunityOverview {
  memberCount: number;
  postsThisWeek: number;
  activeDiscussions: number;
  communityCount: number;
}

export interface TrendingTag {
  tag: string;
  count: number;
}

/** GET /community/stats — drives both the professional and benefactor dashboards. */
export interface CommunityStats {
  /** Professional: "Questions answered". */
  questionsAnswered: number;
  /** Benefactor: "Communities joined". */
  communitiesJoined: number;
  /** Both: reactions received. Replaces the fabricated "96% helpful rating". */
  helpfulMarks: number;
  postsWritten: number;
  postsThisMonth: number;
}

export interface ReactionResult {
  reacted: boolean;
  reactionCount: number;
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  misinformation: 'Misleading health information',
  medical_advice: 'Individual medical advice',
  personal_data: 'Shares personal or contact details',
  harassment: 'Harassment or abuse',
  spam: 'Spam or advertising',
  other: 'Something else',
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "2 hours ago" from an ISO timestamp.
 *
 * Lives here rather than in a component because the feed, the group page, the post
 * detail and both dashboards all render it, and a second copy would drift. Replaces
 * the seed data's pre-baked `timeAgo` strings, which never changed.
 */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const diff = Date.now() - then;
  if (diff < MINUTE) return 'Just now';
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return `${m} minute${m === 1 ? '' : 's'} ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  if (diff < 7 * DAY) {
    const d = Math.floor(diff / DAY);
    return `${d} day${d === 1 ? '' : 's'} ago`;
  }
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
