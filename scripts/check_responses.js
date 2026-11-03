const { PrismaClient } = require("./generated/prisma/client");
const prisma = new PrismaClient();
async function check() {
  const count = await prisma.response.count();
  console.log("Existing responses count:", count);
  const sample = await prisma.response.findMany({ take: 5 });
  console.log("Sample responses:", sample);
  await prisma.$disconnect();
}
check().catch(console.error);
