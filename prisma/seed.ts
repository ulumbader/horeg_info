import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding data...");

  const demoEvent1 = await prisma.soundEvent.upsert({
    where: { slug: "demo-event-1" },
    update: {},
    create: {
      slug: "demo-event-1",
      title: "[DEMO] Horeg Kediri",
      summary: "Acara sound horeg demonstrasi",
      description: "Data ini hanya untuk keperluan demo.",
      address: "Jl. Demontrasi No. 1",
      city: "Kediri",
      province: "Jawa Timur",
      latitude: -7.816667,
      longitude: 112.016667,
      sourceDb: 120,
      sourcePlatform: "Instagram",
      sourceUrl: "https://instagram.com/example",
      startAt: new Date(Date.now() + 86400000 * 2), // 2 days from now
      endAt: new Date(Date.now() + 86400000 * 3),
      publicationStatus: "PUBLISHED",
    },
  });

  const demoEvent2 = await prisma.soundEvent.upsert({
    where: { slug: "demo-event-2" },
    update: {},
    create: {
      slug: "demo-event-2",
      title: "[DEMO] Horeg Malang",
      address: "Jl. Contoh No. 2",
      city: "Malang",
      province: "Jawa Timur",
      latitude: -7.983908,
      longitude: 112.621391,
      sourceDb: 110,
      sourcePlatform: "TikTok",
      sourceUrl: "https://tiktok.com/@example",
      startAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
      endAt: new Date(Date.now() - 86400000 * 2),
      publicationStatus: "PUBLISHED",
    },
  });

  console.log({ demoEvent1, demoEvent2 });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
