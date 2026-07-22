import { z } from 'zod';
import { baseEventSchema, type BaseEvent } from './base.js';

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

export const communityReportedEventSchema = baseEventSchema.extend({
  reportId: z.string(),
  contentId: z.string(),
  contentType: z.enum(['POST', 'COMMENT']),
  reportedBy: z.string(),
  reason: z.string(),
  status: z.enum(['PENDING', 'REVIEWED', 'DISMISSED']),
});

export const communityReplyEventSchema = baseEventSchema.extend({
  replyId: z.string(),
  postId: z.string(),
  postAuthorId: z.string(),
  replyAuthorId: z.string(),
  excerpt: z.string(),
});

/** Matches any event published to the mindora.community exchange. */
export const communityDomainEventSchema = z.union([
  communityReportedEventSchema,
  communityReplyEventSchema,
]);
