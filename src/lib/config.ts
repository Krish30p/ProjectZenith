import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_CESIUM_ION_TOKEN: z.string().optional().default(""),
  NASA_API_KEY: z.string().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_CESIUM_ION_TOKEN: process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN,
  NASA_API_KEY: process.env.NASA_API_KEY,
});
