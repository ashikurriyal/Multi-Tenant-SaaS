import bcrypt from 'bcrypt';
import passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import config from '../config';
import AppError from '../errors/AppError';
import { prisma } from './prisma';

// Compared against when the email is unknown, so both failure cases take the same time
const DUMMY_HASH = bcrypt.hashSync('timing-attack-guard', config.bcryptSaltRounds);

passport.use(
  new LocalStrategy({ usernameField: 'email', session: false }, async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
      if (!user || !valid) return done(null, false);

      if (user.status === 'BLOCKED') {
        return done(new AppError(403, 'USER_BLOCKED', 'Your account is blocked'));
      }

      return done(null, {
        id: user.id,
        name: user.name,
        email: user.email,
        platformRole: user.platformRole,
      });
    } catch (err) {
      return done(err);
    }
  }),
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwt.accessSecret,
      algorithms: ['HS256'],
    },
    async (payload: { sub: string }, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { id: true, name: true, email: true, platformRole: true, status: true },
        });
        if (!user || user.status === 'BLOCKED') return done(null, false);

        return done(null, {
          id: user.id,
          name: user.name,
          email: user.email,
          platformRole: user.platformRole,
        });
      } catch (err) {
        return done(err);
      }
    },
  ),
);

export default passport;
