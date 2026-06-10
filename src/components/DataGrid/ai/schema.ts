import { z } from 'zod'

export const AiCommandSchema = z.object({
  sorts: z
    .array(
      z.object({
        columnId: z.string(),
        direction: z.enum(['asc', 'desc']),
      }),
    )
    .optional(),
  filters: z
    .array(
      z.object({
        columnId: z.string(),
        operator: z.enum(['eq', 'contains', 'gt', 'gte', 'lt', 'lte', 'between', 'in']),
        value: z.union([
          z.string(),
          z.number(),
          z.array(z.union([z.string(), z.number()])),
        ]),
      }),
    )
    .optional(),
  grouping: z.array(z.string()).optional(),
  reset: z.boolean().optional(),
  explanation: z.string(),
})

export type AiCommand = z.infer<typeof AiCommandSchema>
