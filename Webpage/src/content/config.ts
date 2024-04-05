import { defineCollection, z } from "astro:content";
const helpcenter = defineCollection({
  schema: z.object({
    category: z.string(),
     icon: z.object({
        url: z.string(),
        alt: z.string()
      }),
  }),
});
const integrations = defineCollection({
  schema: z.object({
    integration: z.string(),
    tagline: z.string(),
    builtby: z.string(),
    website: z.string(),
    category: z.string(),
    contact: z.string(),
    email: z.string(),
    appURL: z.string(),
    logo: z.object({
        url: z.string(),
        alt: z.string()
      }),
  }),
});
const jobs = defineCollection({
  schema: z.object({
    company: z.string(),
    location: z.string(),
    type: z.string(),
    position: z.string(),
    applyURL: z.string(),
    referURL: z.string(),
  }),
});
const customers = defineCollection({
  schema: z.object({
    customer: z.string(),
    person: z.string(),
    position: z.string(),
    website: z.string(),
    fundDate: z.date(),
    country: z.string(),
    logo: z.object({
        url: z.string(),
        alt: z.string()
      }),
  }),
});
const method = defineCollection({
  schema: z.object({
    page: z.string(),
  }),
});
const changelog = defineCollection({
  schema: z.object({
    page: z.string(),
    description: z.string().optional(),
    pubDate: z.date()
  }),
});
const infopages = defineCollection({
  schema: z.object({
    subtitle: z.string().optional(),
    page: z.string(),
    pubDate: z.date().optional(),
  }),
});
const postsCollection = defineCollection({
    schema: z.object({
      title: z.string(),
      pubDate: z.date(),
      description: z.string(),
      author: z.string(),
      image: z.object({
        url: z.string(),
        alt: z.string()
      }),
      tags: z.array(z.string())
    })
 });
export const collections = {
  helpcenter: helpcenter,
  integrations: integrations,
  jobs: jobs,
  customers: customers,
  method: method,
  changelog: changelog,
  infopages: infopages,
  posts: postsCollection,
};
