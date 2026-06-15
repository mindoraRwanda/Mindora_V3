import 'dotenv/config'
import mongoose from 'mongoose'
import { CommunityGroup, Post } from './models'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindora_community'

const seed = async () => {
  await mongoose.connect(MONGO_URI)
  console.log('Connected to MongoDB')

  // Clear existing data so running the script twice doesn't duplicate everything
  await CommunityGroup.deleteMany({})
  await Post.deleteMany({})
  console.log('Cleared existing data')

  // Create 3 community groups
  const groups = await CommunityGroup.insertMany([
    {
      name: 'Anxiety Support Circle',
      description: 'A safe space for people managing anxiety in their daily lives. Share your experiences and coping strategies.',
      category: 'ANXIETY',
      isAnonymous: false,
      memberCount: 0
    },
    {
      name: 'Grief & Loss',
      description: 'For those navigating the difficult journey of grief. You are not alone in this.',
      category: 'GRIEF',
      isAnonymous: true,
      memberCount: 0
    },
    {
      name: 'Stress Management',
      description: 'Practical tools and peer support for managing everyday stress and burnout.',
      category: 'STRESS',
      isAnonymous: false,
      memberCount: 0
    }
  ])

  console.log(`Created ${groups.length} community groups`)

  // Create 5 posts — 3 non-anonymous, 2 anonymous
  // For anonymous posts we still need an encryptedAuthorId
  // Using placeholder encrypted values since real encryption requires the full service running
  const posts = await Post.insertMany([
    {
      communityId: groups[0]._id,
      encryptedAuthorId: 'plaintext-seed-user-1',
      content: 'I have been using the 4-7-8 breathing technique and it has genuinely helped with my panic attacks. Breathe in for 4, hold for 7, out for 8.',
      isAnonymous: false,
      commentCount: 0
    },
    {
      communityId: groups[0]._id,
      encryptedAuthorId: 'plaintext-seed-user-2',
      content: 'Does anyone else find that exercise helps? I started walking 20 minutes a day and noticed a difference within a week.',
      isAnonymous: false,
      commentCount: 0
    },
    {
      communityId: groups[1]._id,
      encryptedAuthorId: 'encrypted-anon-user-abc123',
      content: 'It has been six months and some days still feel impossible. I am learning that grief has no timeline.',
      isAnonymous: true,
      commentCount: 0
    },
    {
      communityId: groups[1]._id,
      encryptedAuthorId: 'encrypted-anon-user-def456',
      content: 'I lost my mother last year. Coming here helps me feel less alone. Thank you all.',
      isAnonymous: true,
      commentCount: 0
    },
    {
      communityId: groups[2]._id,
      encryptedAuthorId: 'plaintext-seed-user-3',
      content: 'Setting a hard stop time for work at 6pm changed my life. Boundaries are not selfish, they are necessary.',
      isAnonymous: false,
      commentCount: 0
    }
  ])

  console.log(`Created ${posts.length} posts (2 anonymous)`)
  console.log('Seeding complete')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((error) => {
  console.error('Seeding failed:', error)
  process.exit(1)
})