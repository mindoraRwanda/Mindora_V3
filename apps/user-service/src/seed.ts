import { prisma } from './lib/prisma.js';

// Served by this service's own /api/v1/users/photos static route (public,
// no JWT — see infrastructure/kong/kong.yml's user-photos route) from
// apps/user-service/public/therapist-photos/. Only the 8 most-recently-seeded
// accepting-patients therapists have one, so the default (createdAt desc,
// isAcceptingPatients: true) therapist-list view shows photos first.
const PHOTOS_BASE_URL =
  process.env.PHOTOS_BASE_URL ?? 'http://localhost:8000/api/v1/users/photos';

type SeedTherapist = {
  id: string;
  userName: string;
  email: string;
  bio: string;
  specialisation: string;
  languages: string[];
  languagePreference: string;
  timezone: string;
  isAcceptingPatients: boolean;
  photoUrl?: string;
};

// Fixed UUIDs shared with apps/auth-service/src/seed.ts — this is what lets
// appointment-service's isTherapist() check (GET /internal/auth/users/:id)
// resolve these seeded therapists as real THERAPIST-role users, not just
// profile rows that only this service knows about.
const SEED_THERAPISTS: SeedTherapist[] = [
  {
    id: 'f8681be2-67ca-4054-9217-d01c4ee347c6',
    userName: 'Dr. Aline Uwase',
    email: 'aline.uwase@therapist.mindora.local',
    bio: 'I help clients work through anxiety and racing thoughts using practical, evidence-based CBT techniques. Sessions are warm, structured, and always at your pace.',
    specialisation: 'Cognitive Behavioral Therapy',
    languages: ['en', 'rw', 'fr'],
    languagePreference: 'rw',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
  },
  {
    id: '8c65c883-bce3-48ab-84b2-f3ef50a44bee',
    userName: 'Dr. Jean-Baptiste Nkurunziza',
    email: 'jean.nkurunziza@therapist.mindora.local',
    bio: 'Fifteen years supporting survivors of trauma and PTSD. My approach blends somatic awareness with trauma-informed talk therapy — no rushing, no judgment.',
    specialisation: 'Trauma & PTSD',
    languages: ['fr', 'rw', 'en'],
    languagePreference: 'fr',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
  },
  {
    id: '57e73d74-0c08-4062-bc20-822449478f65',
    userName: 'Dr. Grace Mutoni',
    email: 'grace.mutoni@therapist.mindora.local',
    bio: 'Couples and marriage counseling grounded in the Gottman Method. I help partners rebuild communication before small cracks become permanent distance.',
    specialisation: 'Couples Therapy',
    languages: ['en', 'rw'],
    languagePreference: 'en',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
  },
  {
    id: '3a5405fd-b431-4937-a54f-4fbc1089e8e0',
    userName: 'Dr. Emmanuel Habimana',
    email: 'emmanuel.habimana@therapist.mindora.local',
    bio: 'Specialising in depression and low mood, particularly for young professionals navigating burnout. Practical tools, honest conversations.',
    specialisation: 'Depression',
    languages: ['en', 'rw', 'sw'],
    languagePreference: 'en',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
  },
  {
    id: 'aedf6bab-99a0-48ea-99b5-562cafd27297',
    userName: 'Dr. Sarah Cohen',
    email: 'sarah.cohen@therapist.mindora.local',
    bio: 'Grief and bereavement counselor. I hold space for loss in all its forms — a death, a divorce, a life that looks different than planned.',
    specialisation: 'Grief & Bereavement',
    languages: ['en'],
    languagePreference: 'en',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: false,
  },
  {
    id: '6718ac71-7382-4a17-ab1d-03a485635632',
    userName: 'Dr. Patrick Nshimiyimana',
    email: 'patrick.nshimiyimana@therapist.mindora.local',
    bio: 'Addiction recovery specialist, twelve-step informed but not twelve-step exclusive. Whatever path fits you is the right one.',
    specialisation: 'Addiction Recovery',
    languages: ['rw', 'fr', 'en'],
    languagePreference: 'rw',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
  },
  {
    id: '3eb1452a-76c2-43d3-9f13-00c3dd62661e',
    userName: 'Dr. Divine Ingabire',
    email: 'divine.ingabire@therapist.mindora.local',
    bio: 'Working with children and teens on anxiety, school stress, and family conflict. Sessions are collaborative — with parents looped in when it helps.',
    specialisation: 'Child & Adolescent Psychology',
    languages: ['en', 'rw'],
    languagePreference: 'en',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
  },
  {
    id: '92012861-d53b-40e8-a407-9b3272d5f8a3',
    userName: 'Dr. Marcus Chen',
    email: 'marcus.chen@therapist.mindora.local',
    bio: 'ADHD assessment and coaching for adults who were never diagnosed as kids. Practical systems, not just talk.',
    specialisation: 'ADHD',
    languages: ['en'],
    languagePreference: 'en',
    timezone: 'Africa/Nairobi',
    isAcceptingPatients: true,
  },
  {
    id: '21b03638-e76d-4309-bacb-49b26da80f1f',
    userName: 'Dr. Claudine Uwamahoro',
    email: 'claudine.uwamahoro@therapist.mindora.local',
    bio: 'LGBTQ+ affirming therapist. A space to talk about identity, relationships, and mental health without having to explain yourself first.',
    specialisation: 'LGBTQ+ Affirming Therapy',
    languages: ['en', 'fr', 'rw'],
    languagePreference: 'fr',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
  },
  {
    id: '96ab54b9-35e2-4311-8b5c-833ea51e7257',
    userName: 'Dr. David Okonkwo',
    email: 'david.okonkwo@therapist.mindora.local',
    bio: 'Family systems therapy — when one person struggles, the whole household feels it. I work with families to rebuild trust and communication.',
    specialisation: 'Family Therapy',
    languages: ['en'],
    languagePreference: 'en',
    timezone: 'Africa/Lagos',
    isAcceptingPatients: true,
  },
  {
    id: '58a487c0-a89c-4d83-9c93-b1ea2b9a6890',
    userName: 'Dr. Immaculée Mukamana',
    email: 'immaculee.mukamana@therapist.mindora.local',
    bio: 'Stress management for people juggling too much — work, caregiving, school. Short, actionable sessions that fit into a full life.',
    specialisation: 'Stress Management',
    languages: ['rw', 'en'],
    languagePreference: 'rw',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
  },
  {
    id: '439d0ca9-4695-41e6-8e5b-046ab7a112d4',
    userName: 'Dr. Robert Bizimana',
    email: 'robert.bizimana@therapist.mindora.local',
    bio: 'Eating disorder recovery, weight-neutral and non-judgmental. Food and body image work at whatever pace feels safe.',
    specialisation: 'Eating Disorders',
    languages: ['en', 'fr'],
    languagePreference: 'en',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: false,
  },
  {
    id: '4f68c743-2869-43e1-8816-38870c604891',
    userName: 'Dr. Fatima Al-Rashid',
    email: 'fatima.alrashid@therapist.mindora.local',
    bio: 'Bipolar disorder management alongside psychiatric care — therapy that complements medication, not replaces it.',
    specialisation: 'Bipolar Disorder',
    languages: ['en', 'ar', 'fr'],
    languagePreference: 'ar',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
  },
  {
    id: '09a93d13-d308-4419-8e86-2fd191469aee',
    userName: 'Dr. Eric Ndayishimiye',
    email: 'eric.ndayishimiye@therapist.mindora.local',
    bio: 'OCD specialist using exposure and response prevention (ERP). Intrusive thoughts are common — you are not the thought.',
    specialisation: 'OCD',
    languages: ['rw', 'fr', 'en'],
    languagePreference: 'rw',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
  },
  {
    id: 'f3586946-370c-4415-a1eb-8958380992e7',
    userName: 'Dr. Vestine Uwimana',
    email: 'vestine.uwimana@therapist.mindora.local',
    bio: 'Anger management with a focus on the feelings underneath the anger. Calm, direct, practical.',
    specialisation: 'Anger Management',
    languages: ['en', 'rw'],
    languagePreference: 'en',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
  },
  {
    id: '1b23d39f-052d-42f8-b4ab-257aafa1f32a',
    userName: 'Dr. Thomas Müller',
    email: 'thomas.muller@therapist.mindora.local',
    bio: 'Supporting expats and diaspora clients through major life transitions — relocation, career changes, cultural adjustment.',
    specialisation: 'Life Transitions',
    languages: ['en', 'de', 'fr'],
    languagePreference: 'de',
    timezone: 'Europe/Berlin',
    isAcceptingPatients: true,
  },
  {
    id: '0bd86357-439f-43fd-b62b-66dfc0b5aeaf',
    userName: 'Dr. Chantal Niyonsaba',
    email: 'chantal.niyonsaba@therapist.mindora.local',
    bio: 'Career counseling and workplace burnout recovery. When the job is the problem, we figure out what changes and what needs support.',
    specialisation: 'Career Counseling',
    languages: ['fr', 'rw', 'en'],
    languagePreference: 'fr',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
  },
  {
    id: 'd5498556-8538-41e4-9c50-cc13708a6cdd',
    userName: 'Dr. Samuel Gasana',
    email: 'samuel.gasana@therapist.mindora.local',
    bio: 'Mindfulness-based therapy drawing on both clinical psychology and contemplative practice. Slowing down as a skill, not a luxury.',
    specialisation: 'Mindfulness-Based Therapy',
    languages: ['en', 'rw'],
    languagePreference: 'rw',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
  },
  {
    id: '012338cf-6dd0-4bd7-813c-c40232a90299',
    userName: 'Dr. Aisha Mwangi',
    email: 'aisha.mwangi@therapist.mindora.local',
    bio: 'Postpartum mental health specialist. The transition to parenthood is enormous — you deserve support through it, not just after it.',
    specialisation: 'Postpartum Mental Health',
    languages: ['en', 'sw'],
    languagePreference: 'sw',
    timezone: 'Africa/Nairobi',
    isAcceptingPatients: true,
  },
  {
    id: '54cb5179-e86a-4526-89e1-9fc9c34a5383',
    userName: 'Dr. Innocent Twagirayezu',
    email: 'innocent.twagirayezu@therapist.mindora.local',
    bio: 'Sleep disorders and the anxiety that often comes with them. CBT-I informed, practical, no lecture about "sleep hygiene" you have not already heard.',
    specialisation: 'Sleep Disorders',
    languages: ['rw', 'en'],
    languagePreference: 'rw',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
  },
  {
    id: 'e2ea3823-e8c5-4f84-b825-d09a9bab709b',
    userName: 'Dr. Beatrice Uwizeyimana',
    email: 'beatrice.uwizeyimana@therapist.mindora.local',
    bio: 'Trauma-informed care for survivors of violence and abuse. Safety and pacing come first, always.',
    specialisation: 'Trauma-Informed Care',
    languages: ['rw', 'fr'],
    languagePreference: 'rw',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: false,
  },
  {
    id: '881c54eb-f445-4842-a8a0-e1d05d677d1d',
    userName: 'Dr. James Kariuki',
    email: 'james.kariuki@therapist.mindora.local',
    bio: 'Marriage counseling for couples in long-term relationships facing communication breakdown or infidelity recovery.',
    specialisation: 'Marriage Counseling',
    languages: ['en', 'sw'],
    languagePreference: 'en',
    timezone: 'Africa/Nairobi',
    isAcceptingPatients: true,
    photoUrl: `${PHOTOS_BASE_URL}/m4.jpg`,
  },
  {
    id: 'b6eecf67-e409-4663-a987-fb53c7154f3b',
    userName: 'Dr. Solange Nyirahabimana',
    email: 'solange.nyirahabimana@therapist.mindora.local',
    bio: 'Adolescent mental health, with a focus on identity, peer pressure, and the pressure of exams and expectations.',
    specialisation: 'Adolescent Mental Health',
    languages: ['rw', 'fr', 'en'],
    languagePreference: 'rw',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
    photoUrl: `${PHOTOS_BASE_URL}/w4.jpg`,
  },
  {
    id: '25b30b61-c7b0-4855-b5a7-5310ddf42eba',
    userName: 'Dr. Olivier Rukundo',
    email: 'olivier.rukundo@therapist.mindora.local',
    bio: 'Workplace burnout and chronic overwork. I help clients rebuild boundaries before the exhaustion becomes permanent.',
    specialisation: 'Workplace Burnout',
    languages: ['fr', 'en', 'rw'],
    languagePreference: 'fr',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
    photoUrl: `${PHOTOS_BASE_URL}/m3.jpg`,
  },
  {
    id: '0e1ae864-561c-4e32-84b3-8ffebcb62ca3',
    userName: 'Dr. Miriam Nakato',
    email: 'miriam.nakato@therapist.mindora.local',
    bio: 'Grief counseling with a cultural and spiritual lens — for clients who want mourning practices honored, not overridden.',
    specialisation: 'Grief Counseling',
    languages: ['en', 'sw', 'rw'],
    languagePreference: 'sw',
    timezone: 'Africa/Kampala',
    isAcceptingPatients: true,
    photoUrl: `${PHOTOS_BASE_URL}/w3.jpg`,
  },
  {
    id: '9151d463-4a9c-4bd1-a96a-185f95267a3c',
    userName: 'Dr. Vincent Hakizimana',
    email: 'vincent.hakizimana@therapist.mindora.local',
    bio: 'Social anxiety and the fear of being judged. Gradual exposure work in a therapy relationship that never itself feels judgmental.',
    specialisation: 'Social Anxiety',
    languages: ['rw', 'en', 'fr'],
    languagePreference: 'rw',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
    photoUrl: `${PHOTOS_BASE_URL}/m2.jpg`,
  },
  {
    id: '78bfd662-f7e6-4549-a1df-1a42a15c50ab',
    userName: 'Dr. Diane Umutoni',
    email: 'diane.umutoni@therapist.mindora.local',
    bio: 'Substance abuse counseling, harm-reduction informed. Recovery is not one-size-fits-all, and neither is our approach.',
    specialisation: 'Substance Abuse',
    languages: ['en', 'rw', 'fr'],
    languagePreference: 'en',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
    photoUrl: `${PHOTOS_BASE_URL}/w2.jpg`,
  },
  {
    id: '427604f7-223f-4b2c-8ee6-4d6eac97a88a',
    userName: 'Dr. Peter Odhiambo',
    email: 'peter.odhiambo@therapist.mindora.local',
    bio: 'Domestic violence recovery for survivors rebuilding safety and independence. Trauma-informed, patient-led pacing.',
    specialisation: 'Domestic Violence Recovery',
    languages: ['en', 'sw'],
    languagePreference: 'en',
    timezone: 'Africa/Nairobi',
    isAcceptingPatients: false,
  },
  {
    id: '4ee08225-1bd2-4b63-8e66-4fd538ca64e5',
    userName: 'Dr. Josephine Ingabire',
    email: 'josephine.ingabire@therapist.mindora.local',
    bio: 'Geriatric mental health — depression, isolation, and adjustment in later life, for clients and their families alike.',
    specialisation: 'Geriatric Mental Health',
    languages: ['rw', 'fr', 'en'],
    languagePreference: 'rw',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
    photoUrl: `${PHOTOS_BASE_URL}/w1.jpg`,
  },
  {
    id: '1e3bbd07-c951-48d0-9169-9465916c4c2f',
    userName: 'Dr. Anthony Kwizera',
    email: 'anthony.kwizera@therapist.mindora.local',
    bio: 'General anxiety and panic disorder, blending CBT with breathwork and grounding techniques for in-the-moment relief.',
    specialisation: 'Anxiety Disorders',
    languages: ['en', 'rw'],
    languagePreference: 'en',
    timezone: 'Africa/Kigali',
    isAcceptingPatients: true,
    photoUrl: `${PHOTOS_BASE_URL}/m1.jpg`,
  },
];

async function main() {
  for (const t of SEED_THERAPISTS) {
    await prisma.therapistProfile.upsert({
      where: { userId: t.id },
      // Only photoUrl is synced on rerun — everything else is left alone so
      // a reseed doesn't clobber hand-edited dev data. undefined here (for
      // the 22 therapists with no photo) means "leave unchanged," per
      // Prisma's update semantics.
      update: { photoUrl: t.photoUrl },
      create: {
        userId: t.id,
        userName: t.userName,
        bio: t.bio,
        specialisation: t.specialisation,
        languages: t.languages,
        languagePreference: t.languagePreference,
        timezone: t.timezone,
        isAcceptingPatients: t.isAcceptingPatients,
        photoUrl: t.photoUrl,
        role: 'THERAPIST',
        email: t.email,
      },
    });
  }

  console.log(`Seeded ${SEED_THERAPISTS.length} therapist profiles`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
