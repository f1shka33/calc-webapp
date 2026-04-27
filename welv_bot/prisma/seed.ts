import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: "vocal-presets", name: "Vocal Presets", emoji: "🎤", blurb: "Vocals that sound illegal." },
  { slug: "mixer-chains", name: "FL Studio Mixer Chains", emoji: "🎚️", blurb: "Plug-and-play insert chains." },
  { slug: "cover-art", name: "Cover Art Packs", emoji: "🩸", blurb: "Covers that look cursed." },
  { slug: "banners", name: "SoundCloud Banners", emoji: "🖼️", blurb: "Profiles that feel expensive." },
  { slug: "ai-prompts", name: "AI Prompt Packs", emoji: "🧠", blurb: "Prompts that hit different." },
  { slug: "beats", name: "Beats", emoji: "🥁", blurb: "Beats with attitude." },
  { slug: "mixing", name: "Mixing Services", emoji: "🎛️", blurb: "Real human mixing engineers." },
  { slug: "tiktok", name: "TikTok Promo Ideas", emoji: "📱", blurb: "Algorithm assassins." },
  { slug: "branding", name: "Artist Branding Kits", emoji: "👑", blurb: "Become unforgettable." },
  { slug: "custom", name: "Custom Services", emoji: "✶", blurb: "Made for you, only you." }
];

type Seed = {
  slug: string;
  title: string;
  category: string;
  shortDesc: string;
  description: string;
  priceUsd: number;
  format: string;
  license?: string;
  compatibility?: string;
  includes: string[];
  tags: string[];
  featured?: boolean;
  popularity?: number;
  rating?: number;
  ratingCount?: number;
  imageUrl?: string;
};

const PRODUCTS: Seed[] = [
  {
    slug: "demonic-vocal-chain-pack",
    title: "Demonic Vocal Chain Pack",
    category: "vocal-presets",
    shortDesc: "Vocals that sound illegal. Ready to drop.",
    description:
      "A weaponized stack of vocal presets engineered for underground rap, dark trap, and SoundCloud demons. Built around aggressive saturation, surgical de-essing, and stadium reverb tails. Drop your vocal in, choose a chain, and sound like you signed yesterday.",
    priceUsd: 29,
    format: "FST + FXP",
    compatibility: "FL Studio 20+, Waves, FabFilter, Antares, Valhalla",
    includes: [
      "12 vocal chains (Trap / Drill / Sad-Lux / Hyper / Voicemail)",
      "Pre-tuned Antares Auto-Tune presets",
      "FabFilter Pro-Q3 EQ profiles",
      "Valhalla VintageVerb spaces",
      "Quick-start PDF"
    ],
    tags: ["vocals", "preset", "trap", "drill"],
    featured: true,
    popularity: 96,
    rating: 4.9,
    ratingCount: 184,
    imageUrl: "/images/products/demonic-vocal-chain.svg"
  },
  {
    slug: "dark-luxury-soundcloud-banner-kit",
    title: "Dark Luxury SoundCloud Banner Kit",
    category: "banners",
    shortDesc: "Profiles that look like a sold-out tour.",
    description:
      "20 banner templates carved out of black marble and red neon. Photoshop + Figma sources included. Replace your name, export, dominate the For You feed.",
    priceUsd: 19,
    format: "PSD + Figma",
    compatibility: "Photoshop 2021+, Figma",
    includes: [
      "20 banner templates",
      "Editable PSD + Figma sources",
      "8 noise/grain overlays",
      "Smart-object photo slots"
    ],
    tags: ["banners", "soundcloud", "design"],
    popularity: 73,
    rating: 4.8,
    ratingCount: 92,
    imageUrl: "/images/products/dark-banner-kit.svg"
  },
  {
    slug: "trash-rap-cover-art-prompt-pack",
    title: "Trash Rap Cover Art Prompt Pack",
    category: "ai-prompts",
    shortDesc: "Covers that look like your track escaped a cursed hard drive.",
    description:
      "150 hand-tuned prompts for Midjourney, DALL·E and Flux that produce cursed, expensive, underground covers. Each prompt comes with negative-prompt and seed recommendations.",
    priceUsd: 14,
    format: "PDF + TXT",
    compatibility: "Midjourney v6, DALL·E 3, Flux, Stable Diffusion",
    includes: ["150 prompts", "Negative-prompt cheatsheet", "Seed recipes", "Style modifiers"],
    tags: ["ai", "prompt", "cover"],
    popularity: 88,
    featured: true,
    rating: 4.95,
    ratingCount: 211,
    imageUrl: "/images/products/cover-prompts.svg"
  },
  {
    slug: "fl-studio-aggressive-vocal-mixer-chain",
    title: "FL Studio Aggressive Vocal Mixer Chain",
    category: "mixer-chains",
    shortDesc: "Drop it on your vocal track. Become a problem.",
    description:
      "Ready-to-load FL Studio mixer state with 9 stacked plugins, sidechain routing, parallel grit bus, and color-coded inserts. Designed for SoundCloud rap and modern drill.",
    priceUsd: 24,
    format: "FST",
    compatibility: "FL Studio 20.9+",
    includes: [
      "Pre-routed mixer (.fst)",
      "Parallel saturation bus",
      "Sidechain duck for vocals",
      "Color-coded inserts"
    ],
    tags: ["fl studio", "mixer", "vocals"],
    popularity: 81,
    rating: 4.85,
    ratingCount: 147,
    imageUrl: "/images/products/fl-mixer-chain.svg"
  },
  {
    slug: "tiktok-chaos-promo-pack",
    title: "TikTok Chaos Promo Pack",
    category: "tiktok",
    shortDesc: "60 viral hooks. 0 self-respect. 100% reach.",
    description:
      "A pack of 60 promo hook scripts, 30 caption frameworks, and a 7-day posting plan engineered to abuse the FYP algorithm. Built for unsigned artists, by an artist who actually went viral.",
    priceUsd: 17,
    format: "PDF + Notion",
    includes: ["60 hook scripts", "30 caption frameworks", "7-day posting plan", "Sound-trend tracker"],
    tags: ["tiktok", "promo", "marketing"],
    popularity: 79,
    rating: 4.8,
    ratingCount: 132,
    imageUrl: "/images/products/tiktok-chaos.svg"
  },
  {
    slug: "underground-artist-branding-kit",
    title: "Underground Artist Branding Kit",
    category: "branding",
    shortDesc: "Logo, type, palette. Look expensive instantly.",
    description:
      "A complete identity system for the underground: logo lockups, type pairings, color palettes, social templates, and merch mockups. Replace placeholders, export, become unavoidable.",
    priceUsd: 39,
    format: "Figma + PSD",
    compatibility: "Figma, Photoshop",
    includes: ["Logo lockups", "Type pairings", "Palette system", "Social templates", "Merch mockups"],
    tags: ["branding", "identity", "design"],
    featured: true,
    popularity: 90,
    rating: 4.9,
    ratingCount: 168,
    imageUrl: "/images/products/branding-kit.svg"
  },
  {
    slug: "sad-luxury-vocal-preset",
    title: "Sad Luxury Vocal Preset",
    category: "vocal-presets",
    shortDesc: "Cry over $$$ on the same chain.",
    description:
      "A single, surgical preset for sad-luxury vocals. Lush plate reverb, gentle de-ess, vintage tape compression, and a soft saturation tail.",
    priceUsd: 9,
    format: "FXP",
    compatibility: "FL Studio, Ableton, Logic, Reaper",
    includes: ["Single channel preset", "Tape compression chain", "Plate reverb send", "Notes PDF"],
    tags: ["vocals", "preset", "sad"],
    popularity: 64,
    rating: 4.7,
    ratingCount: 58,
    imageUrl: "/images/products/sad-luxury.svg"
  },
  {
    slug: "red-hell-cover-pack",
    title: "Red Hell Cover Pack",
    category: "cover-art",
    shortDesc: "10 covers that look 100% demonic.",
    description:
      "10 ready-to-ship cover art layouts in PSD with editable typography. Drop your name, export, drop the single by Friday.",
    priceUsd: 22,
    format: "PSD",
    compatibility: "Photoshop 2021+",
    includes: ["10 PSD layouts", "Editable type", "Texture overlays", "Smart-object photo slot"],
    tags: ["covers", "art", "psd"],
    popularity: 71,
    rating: 4.85,
    ratingCount: 102,
    imageUrl: "/images/products/red-hell.svg"
  },
  {
    slug: "soundcloud-starter-kit",
    title: "SoundCloud Starter Kit",
    category: "branding",
    shortDesc: "Banner + cover + bio + 1st single plan.",
    description:
      "Everything you need to launch a SoundCloud profile that doesn't look like 2014. Banner template, single cover template, bio framework, first-single rollout plan.",
    priceUsd: 25,
    format: "PSD + PDF",
    includes: ["Banner template", "Cover template", "Bio framework", "Rollout plan"],
    tags: ["soundcloud", "starter", "rollout"],
    popularity: 68,
    rating: 4.75,
    ratingCount: 76,
    imageUrl: "/images/products/sc-starter.svg"
  },
  {
    slug: "full-artist-rebirth-bundle",
    title: "Full Artist Rebirth Bundle",
    category: "custom",
    shortDesc: "The whole arsenal. Become a different person.",
    description:
      "The full welv_bot arsenal in a single drop: vocal chains, mixer state, cover pack, banner kit, prompt pack, TikTok plan, and branding kit. Buy once, become someone else.",
    priceUsd: 129,
    format: "Bundle",
    includes: [
      "Demonic Vocal Chain Pack",
      "FL Studio Aggressive Vocal Mixer Chain",
      "Red Hell Cover Pack",
      "Dark Luxury SoundCloud Banner Kit",
      "Trash Rap Cover Art Prompt Pack",
      "TikTok Chaos Promo Pack",
      "Underground Artist Branding Kit"
    ],
    tags: ["bundle", "everything", "rebirth"],
    featured: true,
    popularity: 99,
    rating: 5.0,
    ratingCount: 312,
    imageUrl: "/images/products/rebirth-bundle.svg"
  }
];

function rubFromUsd(usd: number) {
  const rate = Number(process.env.USD_TO_RUB ?? 95);
  return Math.round(usd * rate);
}

async function main() {
  console.log("→ seeding categories");
  for (const [i, c] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, blurb: c.blurb, emoji: c.emoji, sort: i },
      create: { ...c, sort: i }
    });
  }

  const cats = await prisma.category.findMany();
  const bySlug = new Map(cats.map((c) => [c.slug, c]));

  console.log("→ seeding products");
  for (const p of PRODUCTS) {
    const cat = bySlug.get(p.category);
    if (!cat) throw new Error(`Missing category: ${p.category}`);
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        shortDesc: p.shortDesc,
        description: p.description,
        priceUsdCents: p.priceUsd * 100,
        priceRubKop: rubFromUsd(p.priceUsd) * 100,
        format: p.format,
        license: p.license ?? "Personal use, single artist",
        compatibility: p.compatibility ?? null,
        includes: p.includes.join("\n"),
        tags: p.tags.join(","),
        imageUrl: p.imageUrl ?? null,
        featured: p.featured ?? false,
        popularity: p.popularity ?? 0,
        rating: p.rating ?? 5,
        ratingCount: p.ratingCount ?? 0,
        categoryId: cat.id
      },
      create: {
        slug: p.slug,
        title: p.title,
        shortDesc: p.shortDesc,
        description: p.description,
        priceUsdCents: p.priceUsd * 100,
        priceRubKop: rubFromUsd(p.priceUsd) * 100,
        format: p.format,
        license: p.license ?? "Personal use, single artist",
        compatibility: p.compatibility ?? null,
        includes: p.includes.join("\n"),
        tags: p.tags.join(","),
        imageUrl: p.imageUrl ?? null,
        featured: p.featured ?? false,
        popularity: p.popularity ?? 0,
        rating: p.rating ?? 5,
        ratingCount: p.ratingCount ?? 0,
        categoryId: cat.id
      }
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@welv.bot";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
  console.log(`→ ensuring admin user (${adminEmail})`);
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN, passwordHash },
    create: {
      email: adminEmail,
      name: "welv_bot admin",
      passwordHash,
      role: Role.ADMIN
    }
  });

  console.log("✓ seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
