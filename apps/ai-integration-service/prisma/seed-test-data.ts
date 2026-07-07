import '../src/env.js';
import { prisma } from '../src/database.js';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const rows = [
  // user-001: 4 interactions (highest volume — should appear first in topUsers)
  {
    user_id: 'user-001',
    session_id: 'sess-01',
    user_message: 'Hello',
    ai_response: 'Hi there',
    crisis_level: 0,
    input_flagged: false,
    output_flagged: false,
    tokens_used: 150,
    response_ms: 300,
    created_at: daysAgo(0),
  },
  {
    user_id: 'user-001',
    session_id: 'sess-02',
    user_message: 'I feel sad',
    ai_response: 'I hear you',
    crisis_level: 1,
    input_flagged: true,
    output_flagged: false,
    tokens_used: 200,
    response_ms: 450,
    created_at: daysAgo(1),
  },
  {
    user_id: 'user-001',
    session_id: 'sess-03',
    user_message: 'I want to die',
    ai_response: 'Crisis resp',
    crisis_level: 5,
    input_flagged: true,
    output_flagged: false,
    tokens_used: 350,
    response_ms: 800,
    created_at: daysAgo(1),
  },
  {
    user_id: 'user-001',
    session_id: 'sess-10',
    user_message: 'How are you',
    ai_response: 'Good',
    crisis_level: 0,
    input_flagged: false,
    output_flagged: false,
    tokens_used: 175,
    response_ms: 420,
    created_at: daysAgo(6),
  },

  // user-002: 3 interactions
  {
    user_id: 'user-002',
    session_id: 'sess-04',
    user_message: 'Help me',
    ai_response: 'Sure',
    crisis_level: 0,
    input_flagged: false,
    output_flagged: false,
    tokens_used: 120,
    response_ms: 250,
    created_at: daysAgo(2),
  },
  {
    user_id: 'user-002',
    session_id: 'sess-05',
    user_message: 'I want it to end',
    ai_response: 'I care',
    crisis_level: 3,
    input_flagged: true,
    output_flagged: false,
    tokens_used: 400,
    response_ms: 1200,
    created_at: daysAgo(3),
  },
  {
    user_id: 'user-002',
    session_id: 'sess-06',
    user_message: "I'm going to end it",
    ai_response: 'Crisis resp',
    crisis_level: 5,
    input_flagged: true,
    output_flagged: false,
    tokens_used: 300,
    response_ms: 900,
    created_at: daysAgo(3),
  },

  // user-003: 3 interactions
  {
    user_id: 'user-003',
    session_id: 'sess-07',
    user_message: 'Good morning',
    ai_response: 'Morning!',
    crisis_level: 0,
    input_flagged: false,
    output_flagged: false,
    tokens_used: 180,
    response_ms: 380,
    created_at: daysAgo(4),
  },
  {
    user_id: 'user-003',
    session_id: 'sess-08',
    user_message: 'I want to hurt myself',
    ai_response: 'Concern',
    crisis_level: 4,
    input_flagged: true,
    output_flagged: false,
    tokens_used: 500,
    response_ms: 2000,
    created_at: daysAgo(5),
  },
  {
    user_id: 'user-003',
    session_id: 'sess-09',
    user_message: 'Feeling anxious',
    ai_response: 'Understood',
    crisis_level: 1,
    input_flagged: true,
    output_flagged: false,
    tokens_used: 250,
    response_ms: 600,
    created_at: daysAgo(6),
  },
];

// Expected totals for reference when verifying via Postman / curl:
// totalInteractions : 10
// totalTokensUsed   : 2625
// totalCrisisEvents : 2  (rows with crisis_level = 5)
// avgResponseMs     : 730
// topUsers order    : user-001 (4), user-002 (3), user-003 (3)

await prisma.aiInteraction.createMany({ data: rows });
console.log(`✓ Inserted ${rows.length} test rows into ai_interactions`);
await prisma.$disconnect();
