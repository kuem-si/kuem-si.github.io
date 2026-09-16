import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const caseStudies = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/case-studies" }),
  schema: z.object({
    title: z.string(),
    customer: z.string().optional(),
    category: z.string(),
    country: z.string().optional(),
    industry: z.string(),
    challenge: z.string(),
    solution: z.string(),
    technologies: z.array(z.string()),
    results: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(true),
    publicationApproval: z.boolean().default(false),
  }),
});
const insights = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/insights" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    categories: z.array(z.string()),
    draft: z.boolean().default(true),
    seo: z.object({ description: z.string() }),
  }),
});
export const collections = { "case-studies": caseStudies, insights };
