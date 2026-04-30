// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const password = await bcrypt.hash("password123", 12);

  // Create users
  const alice = await prisma.user.upsert({
    where: { email: "alice@bookswap.com" },
    update: {},
    create: {
      name: "Alice Sharma",
      email: "alice@bookswap.com",
      password,
      phone: "9876543210",
      city: "Mumbai",
      state: "Maharashtra",
      bio: "Avid reader. Lover of literary fiction and sci-fi.",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@bookswap.com" },
    update: {},
    create: {
      name: "Bob Verma",
      email: "bob@bookswap.com",
      password,
      phone: "9123456789",
      city: "Delhi",
      state: "Delhi",
      bio: "Engineering student. Selling old textbooks!",
    },
  });

  // Create listings
  await prisma.listing.createMany({
    data: [
      {
        title: "The Alchemist",
        author: "Paulo Coelho",
        description: "A great read. Minor scuffs on the cover.",
        genre: "FICTION",
        condition: "GOOD",
        price: 80,
        listingType: "SELL",
        images: [],
        city: "Mumbai",
        state: "Maharashtra",
        sellerId: alice.id,
      },
      {
        title: "Data Structures and Algorithms",
        author: "Narasimha Karumanchi",
        description: "Used for one semester. No highlighting.",
        genre: "TEXTBOOK",
        condition: "LIKE_NEW",
        price: 250,
        listingType: "SELL_OR_SWAP",
        images: [],
        city: "Delhi",
        state: "Delhi",
        sellerId: bob.id,
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        description: "Life-changing book. Available to rent or sell.",
        genre: "SELF_HELP",
        condition: "LIKE_NEW",
        price: 150,
        rentPerDay: 15,
        listingType: "RENT_OR_SELL",
        images: [],
        city: "Mumbai",
        state: "Maharashtra",
        sellerId: alice.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed complete!");
  console.log("   alice@bookswap.com  / password123");
  console.log("   bob@bookswap.com    / password123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
