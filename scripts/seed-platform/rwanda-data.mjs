// Synthetic Rwanda-appropriate data pools for the platform seed. Every name
// here is a common Rwandan given/family name chosen for plausibility, not a
// specific real person — same convention as using "John Smith" for English
// test fixtures. Do not add real individuals' names to this file.

export const FIRST_NAMES_FEMALE = [
  'Aline', 'Grace', 'Divine', 'Clarisse', 'Josiane', 'Solange', 'Vestine',
  'Ange', 'Clemence', 'Uwase', 'Mutoni', 'Keza', 'Bella', 'Chantal',
  'Immaculee', 'Jacqueline', 'Bonheur', 'Esperance', 'Yvonne', 'Diane',
  'Providence', 'Consolee', 'Beatrice', 'Odette', 'Marie', 'Agnes',
  'Gisele', 'Nadia', 'Sandrine', 'Rosine',
];

export const FIRST_NAMES_MALE = [
  'Jean', 'Emmanuel', 'Eric', 'Patrick', 'Fabrice', 'Olivier', 'Innocent',
  'Alain', 'Bernard', 'Claude', 'Desire', 'Elie', 'Felix', 'Gilbert',
  'Herve', 'Ismael', 'Justin', 'Kevin', 'Leon', 'Moise', 'Noel', 'Oscar',
  'Pacifique', 'Robert', 'Samuel', 'Theogene', 'Valens', 'Willy',
  'Xavier', 'Yves',
];

export const LAST_NAMES = [
  'Uwase', 'Nkurunziza', 'Mutoni', 'Habimana', 'Mukamana', 'Niyonsenga',
  'Ndayisenga', 'Uwimana', 'Bizimana', 'Nzeyimana', 'Mugisha', 'Ishimwe',
  'Kayitesi', 'Nsengimana', 'Twagirayezu', 'Ruzindana', 'Gasana',
  'Munyaneza', 'Nyirahabimana', 'Hakizimana', 'Byiringiro', 'Iradukunda',
  'Karangwa', 'Mahoro', 'Niyibizi', 'Rukundo', 'Tuyishime', 'Uwizeyimana',
  'Cyusa', 'Dusabimana',
];

// Weighted toward Kigali per the spec ("can have a larger concentration,
// but the platform should represent users across Rwanda") without making
// every user a Kigali resident.
export const LOCATIONS = {
  Gasabo: 18, // Kigali district
  Kicukiro: 12, // Kigali district
  Nyarugenge: 10, // Kigali district
  'Eastern Province': 15,
  'Northern Province': 15,
  'Southern Province': 15,
  'Western Province': 15,
};

export const LANGUAGE_WEIGHTS = { rw: 60, en: 30, fr: 10 };

export const SPECIALISATIONS = [
  'Anxiety', 'Depression', 'Stress Management', 'Grief',
  'Relationship Counselling', 'Family Counselling', 'Trauma Support',
  'Youth Counselling', 'Addiction Support', 'General Counselling',
];

export const QUALIFICATIONS = [
  'BA Psychology', 'BSc Clinical Psychology', 'MSc Clinical Psychology',
  'MA Counselling Psychology', 'Diploma in Counselling',
  'Postgraduate Diploma in Psychotherapy', 'PhD Clinical Psychology',
];

export const CERTIFICATIONS = [
  'Certified CBT Practitioner', 'Certified Trauma Practitioner',
  'Certified Family Therapist', 'Certified Addiction Counsellor',
  'Mental Health First Aid Certified',
];

export const LICENSE_ISSUING_BODIES = [
  'Rwanda Allied Health Professions Council',
  'Rwanda Medical and Dental Council',
];

const BIO_TEMPLATES = [
  (spec) => `I help clients work through ${spec.toLowerCase()} using practical, evidence-based techniques. Sessions are warm, structured, and always at your pace.`,
  (spec) => `My practice focuses on ${spec.toLowerCase()}, drawing on both clinical training and lived understanding of the challenges clients in Rwanda face.`,
  (spec) => `I specialise in ${spec.toLowerCase()}, offering a calm, judgement-free space for clients to be heard and supported.`,
  (spec) => `With years of experience in ${spec.toLowerCase()}, I aim to make therapy feel approachable, practical, and genuinely helpful.`,
];

export function buildBio(rng, specialisations) {
  const primary = specialisations[0] ?? 'General Counselling';
  return rng.pick(BIO_TEMPLATES)(primary);
}

export function randomPhoneNumber(rng) {
  // Rwanda mobile numbers: +250 7XX XXX XXX
  const prefix = rng.pick(['78', '72', '73', '79']);
  const rest = String(rng.int(1000000, 9999999));
  return `+2507${prefix.slice(1)}${rest}`;
}

export function randomLicenseNumber(rng) {
  return `RW-PSY-${String(rng.int(10000, 99999))}`;
}

export function pickLanguages(rng) {
  // Every applicant/therapist speaks Kinyarwanda plus 0-2 others, matching
  // "Kinyarwanda should be strongly represented" - never generate an
  // all-English or all-French speaker with no Kinyarwanda at all.
  const languages = ['rw'];
  if (rng.chance(0.55)) languages.push('en');
  if (rng.chance(0.2)) languages.push('fr');
  return languages;
}
