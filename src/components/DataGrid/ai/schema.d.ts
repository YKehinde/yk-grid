import { z } from 'zod';
export declare const AiCommandSchema: z.ZodObject<{
    sorts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        columnId: z.ZodString;
        direction: z.ZodEnum<{
            asc: "asc";
            desc: "desc";
        }>;
    }, z.core.$strip>>>;
    filters: z.ZodOptional<z.ZodArray<z.ZodObject<{
        columnId: z.ZodString;
        operator: z.ZodEnum<{
            eq: "eq";
            contains: "contains";
            gt: "gt";
            gte: "gte";
            lt: "lt";
            lte: "lte";
            between: "between";
            in: "in";
        }>;
        value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>]>;
    }, z.core.$strip>>>;
    grouping: z.ZodOptional<z.ZodArray<z.ZodString>>;
    reset: z.ZodOptional<z.ZodBoolean>;
    explanation: z.ZodString;
}, z.core.$strip>;
export type AiCommand = z.infer<typeof AiCommandSchema>;
