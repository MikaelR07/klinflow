import { z } from "zod";
const ProfileSchema = z.object({
  id: z.string().uuid(),
  serviceProfile: z.record(z.string(), z.any()).nullable().optional(),
});
console.log(ProfileSchema.safeParse({ id: "123e4567-e89b-12d3-a456-426614174000", serviceProfile: { minWeight: 50, maxWeight: 100 } }));
