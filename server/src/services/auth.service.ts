import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role, User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { HttpError } from '../utils/http-error';

export type PublicUser = Omit<User, 'passwordHash'>;

const toPublic = ({ passwordHash: _p, ...u }: User): PublicUser => u;

function sign(user: User) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
}

export const authService = {
  async register(data: { email: string; password: string; fullName: string }) {
    const email = data.email.toLowerCase();
    if (await prisma.user.findUnique({ where: { email } })) throw new HttpError(409, 'Cet email est déjà utilisé.');
    const user = await prisma.user.create({
      data: { email, fullName: data.fullName, role: Role.VIEWER, passwordHash: await bcrypt.hash(data.password, 10) },
    });
    return { token: sign(user), user: toPublic(user) };
  },

  async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash)))
      throw new HttpError(401, 'Email ou mot de passe incorrect.');
    return { token: sign(user), user: toPublic(user) };
  },

  async me(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new HttpError(404, 'Utilisateur introuvable.');
    return toPublic(user);
  },
};
