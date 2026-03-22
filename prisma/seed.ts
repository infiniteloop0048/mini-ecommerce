import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const products = [
  {
    name: "Wireless Noise-Cancelling Headphones",
    description:
      "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and foldable design. Perfect for travel, work, and everyday listening.",
    price: 89.99,
    stock: 45,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop",
    category: "Electronics",
  },
  {
    name: "Mechanical Keyboard – TKL RGB",
    description:
      "Tenkeyless mechanical keyboard with Cherry MX Brown switches, per-key RGB backlighting, and a durable aluminium top plate. Compatible with Windows and macOS.",
    price: 74.99,
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=400&fit=crop",
    category: "Electronics",
  },
  {
    name: "Minimalist Leather Wallet",
    description:
      "Slim bifold wallet crafted from full-grain leather. Holds up to 8 cards plus cash. Available in black and brown. Gets better with age.",
    price: 34.99,
    stock: 120,
    imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=400&fit=crop",
    category: "Accessories",
  },
  {
    name: "Stainless Steel Water Bottle – 1L",
    description:
      "Double-wall vacuum insulated bottle that keeps drinks cold for 24 hours or hot for 12 hours. BPA-free, leak-proof lid, and dishwasher-safe.",
    price: 24.99,
    stock: 200,
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=400&fit=crop",
    category: "Kitchen",
  },
  {
    name: "Running Shoes – Men's Ultra Boost",
    description:
      "Lightweight running shoes with responsive foam midsole, breathable mesh upper, and Continental rubber outsole for superior grip. Sizes 7–13.",
    price: 119.99,
    stock: 60,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop",
    category: "Footwear",
  },
  {
    name: "Portable Bluetooth Speaker",
    description:
      "Compact waterproof speaker (IPX7) with 360° sound, 12-hour playtime, and built-in microphone for hands-free calls. Pairs instantly via Bluetooth 5.0.",
    price: 49.99,
    stock: 75,
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=400&fit=crop",
    category: "Electronics",
  },
];

async function main() {
  console.log("Seeding database...");

  await prisma.product.deleteMany();

  for (const product of products) {
    const created = await prisma.product.create({ data: product });
    console.log(`  ✔ Created: ${created.name}`);
  }

  console.log(`\nDone — ${products.length} products seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
