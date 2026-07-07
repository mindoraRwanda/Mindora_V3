import jwt from 'jsonwebtoken'

const ROLES = ['ADMIN', 'PATIENT', 'THERAPIST'] as const
type Role = typeof ROLES[number]

const arg = process.argv[2]?.toUpperCase() as Role | undefined
const role: Role = ROLES.includes(arg as Role) ? (arg as Role) : 'ADMIN'

const profiles: Record<Role, { sub: string; email: string }> = {
  ADMIN:     { sub: 'test-admin-001',     email: 'admin@mindora.com'     },
  PATIENT:   { sub: 'test-patient-001',   email: 'patient@mindora.com'   },
  THERAPIST: { sub: 'test-therapist-001', email: 'therapist@mindora.com' },
}

const token = jwt.sign(
  { ...profiles[role], role },
  process.env.JWT_SECRET ?? 'mindora-dev-jwt-secret-change-in-production',
  { expiresIn: '7d', issuer: 'mindora-auth', jwtid: `${role.toLowerCase()}-jti-001` }
)

console.log(`Bearer ${token}`)
