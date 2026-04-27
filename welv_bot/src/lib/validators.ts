import { z } from "zod";

export const SignUpSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80).optional(),
  password: z.string().min(8).max(120)
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const ProductSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, dashes only"),
  title: z.string().min(1).max(120),
  shortDesc: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  priceUsd: z.coerce.number().min(0).max(100000),
  priceRub: z.coerce.number().min(0).max(10000000),
  format: z.string().min(1).max(60),
  license: z.string().max(200).optional(),
  compatibility: z.string().max(200).optional(),
  includes: z.string().max(2000),
  tags: z.string().max(200),
  categoryId: z.string().min(1),
  imageUrl: z.string().max(500).optional().or(z.literal("")),
  fileUrl: z.string().max(500).optional().or(z.literal("")),
  featured: z.coerce.boolean().optional()
});

export const CategorySchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(80),
  blurb: z.string().max(200).optional(),
  emoji: z.string().max(4).optional()
});

export const CustomOrderSchema = z.object({
  email: z.string().email(),
  artistName: z.string().min(1).max(80),
  trackName: z.string().max(120).optional(),
  type: z.string().min(1).max(60),
  genre: z.string().max(60).optional(),
  mood: z.string().max(120).optional(),
  references: z.string().max(2000).optional(),
  budget: z.string().max(60).optional(),
  deadline: z.string().max(60).optional(),
  plugins: z.string().max(500).optional(),
  uploadUrl: z.string().max(500).optional(),
  comments: z.string().max(2000).optional()
});

export const ReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().min(1).max(2000)
});
