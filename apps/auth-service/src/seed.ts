import { prisma } from './lib/prisma.js';
import { hashPassword } from './lib/password.js';

// Fixed UUIDs shared with apps/user-service/src/seed.ts's therapist list —
// this is what lets appointment-service's isTherapist() check (which calls
// out to GET /internal/auth/users/:id here) actually resolve these seeded
// therapists as real THERAPIST-role users, not just profile rows that only
// user-service knows about.
const SEED_THERAPISTS = [
  { id: 'f8681be2-67ca-4054-9217-d01c4ee347c6', email: 'aline.uwase@therapist.mindora.local' },
  { id: '8c65c883-bce3-48ab-84b2-f3ef50a44bee', email: 'jean.nkurunziza@therapist.mindora.local' },
  { id: '57e73d74-0c08-4062-bc20-822449478f65', email: 'grace.mutoni@therapist.mindora.local' },
  { id: '3a5405fd-b431-4937-a54f-4fbc1089e8e0', email: 'emmanuel.habimana@therapist.mindora.local' },
  { id: 'aedf6bab-99a0-48ea-99b5-562cafd27297', email: 'sarah.cohen@therapist.mindora.local' },
  { id: '6718ac71-7382-4a17-ab1d-03a485635632', email: 'patrick.nshimiyimana@therapist.mindora.local' },
  { id: '3eb1452a-76c2-43d3-9f13-00c3dd62661e', email: 'divine.ingabire@therapist.mindora.local' },
  { id: '92012861-d53b-40e8-a407-9b3272d5f8a3', email: 'marcus.chen@therapist.mindora.local' },
  { id: '21b03638-e76d-4309-bacb-49b26da80f1f', email: 'claudine.uwamahoro@therapist.mindora.local' },
  { id: '96ab54b9-35e2-4311-8b5c-833ea51e7257', email: 'david.okonkwo@therapist.mindora.local' },
  { id: '58a487c0-a89c-4d83-9c93-b1ea2b9a6890', email: 'immaculee.mukamana@therapist.mindora.local' },
  { id: '439d0ca9-4695-41e6-8e5b-046ab7a112d4', email: 'robert.bizimana@therapist.mindora.local' },
  { id: '4f68c743-2869-43e1-8816-38870c604891', email: 'fatima.alrashid@therapist.mindora.local' },
  { id: '09a93d13-d308-4419-8e86-2fd191469aee', email: 'eric.ndayishimiye@therapist.mindora.local' },
  { id: 'f3586946-370c-4415-a1eb-8958380992e7', email: 'vestine.uwimana@therapist.mindora.local' },
  { id: '1b23d39f-052d-42f8-b4ab-257aafa1f32a', email: 'thomas.muller@therapist.mindora.local' },
  { id: '0bd86357-439f-43fd-b62b-66dfc0b5aeaf', email: 'chantal.niyonsaba@therapist.mindora.local' },
  { id: 'd5498556-8538-41e4-9c50-cc13708a6cdd', email: 'samuel.gasana@therapist.mindora.local' },
  { id: '012338cf-6dd0-4bd7-813c-c40232a90299', email: 'aisha.mwangi@therapist.mindora.local' },
  { id: '54cb5179-e86a-4526-89e1-9fc9c34a5383', email: 'innocent.twagirayezu@therapist.mindora.local' },
  { id: 'e2ea3823-e8c5-4f84-b825-d09a9bab709b', email: 'beatrice.uwizeyimana@therapist.mindora.local' },
  { id: '881c54eb-f445-4842-a8a0-e1d05d677d1d', email: 'james.kariuki@therapist.mindora.local' },
  { id: 'b6eecf67-e409-4663-a987-fb53c7154f3b', email: 'solange.nyirahabimana@therapist.mindora.local' },
  { id: '25b30b61-c7b0-4855-b5a7-5310ddf42eba', email: 'olivier.rukundo@therapist.mindora.local' },
  { id: '0e1ae864-561c-4e32-84b3-8ffebcb62ca3', email: 'miriam.nakato@therapist.mindora.local' },
  { id: '9151d463-4a9c-4bd1-a96a-185f95267a3c', email: 'vincent.hakizimana@therapist.mindora.local' },
  { id: '78bfd662-f7e6-4549-a1df-1a42a15c50ab', email: 'diane.umutoni@therapist.mindora.local' },
  { id: '427604f7-223f-4b2c-8ee6-4d6eac97a88a', email: 'peter.odhiambo@therapist.mindora.local' },
  { id: '4ee08225-1bd2-4b63-8e66-4fd538ca64e5', email: 'josephine.ingabire@therapist.mindora.local' },
  { id: '1e3bbd07-c951-48d0-9169-9465916c4c2f', email: 'anthony.kwizera@therapist.mindora.local' },
];

async function main() {
  // Not a real login credential — these accounts exist only so
  // appointment-service's cross-service THERAPIST-role check resolves.
  const passwordHash = await hashPassword('Seeded-Therapist-Not-A-Real-Login-1!');

  for (const { id, email } of SEED_THERAPISTS) {
    await prisma.user.upsert({
      where: { id },
      update: {},
      create: {
        id,
        email,
        passwordHash,
        role: 'THERAPIST',
        isActive: true,
      },
    });
  }

  console.log(`Seeded ${SEED_THERAPISTS.length} therapist auth users`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
