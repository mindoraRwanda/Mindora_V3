import type { BaseEvent } from './base.js';

export interface CommunityReportedEvent extends BaseEvent {
  reportId: string;
  contentId: string;
  contentType: 'POST' | 'COMMENT';
  reportedBy: string;
  reason: string;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED';
}

export interface CommunityReplyEvent extends BaseEvent {
  replyId: string;
  postId: string;
  postAuthorId: string;
  replyAuthorId: string;
  excerpt: string;
}
