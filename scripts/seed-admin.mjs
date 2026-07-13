import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const email = process.argv[2] || 'admin@kodahouse.com';
const password = process.argv[3] || 'KodaHouse2024!';
const nombre = process.argv[4] || 'Admin';

const prisma = new PrismaClient();
const hash = await bcrypt.hash(password, 10);

const user = await prisma.usuario.upsert({
  where: { email },
  update: { passwordHash: hash, nombre },
  create: { email, passwordHash: hash, nombre, rol: 'ADMIN' },
});

console.log(`OK ${user.email} (${user.rol})`);
await prisma.$disconnect();