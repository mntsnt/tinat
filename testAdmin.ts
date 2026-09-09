import { prisma } from './lib/prisma';
import { SignJWT } from 'jose';

async function test() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.log("No admin found in DB!");
    process.exit(1);
  }
  
  console.log("Admin ID:", admin.id);
  const secret = process.env.AUTH_SECRET || "default_secret";
  const key = new TextEncoder().encode(secret);
  const token = await new SignJWT({ userId: admin.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
    
  const routes = ['/admin', '/admin/users', '/admin/studies', '/admin/withdrawals', '/admin/logs'];
  
  for (const route of routes) {
    console.log(`\nFetching ${route}...`);
    const res = await fetch(`http://localhost:3000${route}`, {
      headers: { Cookie: `tinat_session=${token}` }
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    if (text.includes("Error") || res.status !== 200) {
      console.log("FOUND ERROR IN HTML!");
      const errorMatch = text.match(/<h2[^>]*>.*?<\/h2>/g);
      console.log(errorMatch);
    } else {
      console.log("No obvious error. HTML length:", text.length);
    }
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
