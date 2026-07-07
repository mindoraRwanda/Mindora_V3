import 'dotenv/config';
import mongoose from 'mongoose';
import { CommunityGroup, Post } from './models/index.js';

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/mindora_community';

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data so running the script twice doesn't duplicate everything
  await CommunityGroup.deleteMany({});
  await Post.deleteMany({});
  console.log('Cleared existing data');

  // Create 3 community groups
  const groups = await CommunityGroup.insertMany([
    {
      name: 'Anxiety Support Circle',
      description:
        'A safe space for people managing anxiety in their daily lives. Share your experiences and coping strategies.',
      category: 'ANXIETY',
      isAnonymous: false,
      memberCount: 0,
    },
    {
      name: 'Grief & Loss',
      description:
        'For those navigating the difficult journey of grief. You are not alone in this.',
      category: 'GRIEF',
      isAnonymous: true,
      memberCount: 0,
    },
    {
      name: 'Stress Management',
      description:
        'Practical tools and peer support for managing everyday stress and burnout.',
      category: 'STRESS',
      isAnonymous: false,
      memberCount: 0,
    },
  ]);

  console.log(`Created ${groups.length} community groups`);

  // Create 5 posts — 3 non-anonymous, 2 anonymous
  // For anonymous posts we still need an encryptedAuthorId
  // Using placeholder encrypted values since real encryption requires the full service running
  const posts = await Post.insertMany([
    {
      communityId: groups[0]._id,
      encryptedAuthorId: 'plaintext-seed-user-1',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'I have been using the 4-7-8 breathing technique and it has genuinely helped with my panic attacks.',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Breathe in for 4, hold for 7, out for 8.',
              },
            ],
          },
        ],
      },
      isAnonymous: false,
      commentCount: 0,
    },
    {
      communityId: groups[0]._id,
      encryptedAuthorId: 'plaintext-seed-user-2',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Does anyone else find that exercise helps?',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'I started walking 20 minutes a day and noticed a difference within a week.',
              },
            ],
          },
        ],
      },
      isAnonymous: false,
      commentCount: 0,
    },
    {
      communityId: groups[1]._id,
      encryptedAuthorId: 'encrypted-anon-user-abc123',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'It has been six months and some days still feel impossible.',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'I am learning that grief has no timeline.',
              },
            ],
          },
        ],
      },
      isAnonymous: true,
      commentCount: 0,
    },
    {
      communityId: groups[1]._id,
      encryptedAuthorId: 'encrypted-anon-user-def456',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'I lost my mother last year. Coming here helps me feel less alone.',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                marks: [{ type: 'italic' }],
                text: 'Thank you all.',
              },
            ],
          },
        ],
      },
      isAnonymous: true,
      commentCount: 0,
    },
    {
      communityId: groups[2]._id,
      encryptedAuthorId: 'plaintext-seed-user-3',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Setting a hard stop time for work at 6pm changed my life.',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                marks: [{ type: 'bold' }],
                text: 'Boundaries are not selfish, they are necessary.',
              },
            ],
          },
        ],
      },
      isAnonymous: false,
      commentCount: 0,
    },
  ]);

  console.log(`Created ${posts.length} posts (2 anonymous)`);
  console.log('Seeding complete');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
