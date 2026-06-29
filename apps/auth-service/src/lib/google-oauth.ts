import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '@mindora/database';
import { randomBytes } from 'node:crypto';
import { config, isGoogleOAuthConfigured } from '../config.js';
import { hashPassword } from './password.js';

export function configureGoogleOAuth(): void {
  if (!isGoogleOAuthConfigured()) {
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            done(new Error('Google account has no email'));
            return;
          }

          const googleId = profile.id;
          let user = await prisma.user.findFirst({
            where: {
              OR: [{ googleId }, { email }],
            },
          });

          if (!user) {
            const passwordHash = await hashPassword(
              randomBytes(32).toString('base64url')
            );
            user = await prisma.user.create({
              data: {
                email,
                googleId,
                passwordHash,
                role: 'PATIENT',
              },
            });
          } else if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId },
            });
          }

          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
}
