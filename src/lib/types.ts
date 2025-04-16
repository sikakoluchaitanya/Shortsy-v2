import {z} from 'zod';

export const urlSchema = z.object({
    url: z.string().url("Please enter a valid URL"),
    customCode: z
        .string()
        .min(6, "Custom code is required")
        .max(50, "Custom code must be less than 50 characters")
        .regex(/^[a-zA-Z0-9_-]+$/, "Custom code must only contain letters, numbers, dashes, and underscores")
        .optional()
        .or(z.literal(""))
        .nullable()
        .transform((val) => (val === null || val === ""? undefined : val)),
})

export type UrlFormData = z.infer<typeof urlSchema>;

export type ApiResponse<T> = {
    success: boolean;
    error?: string;
    data?: T;
}

export type Url = {
    id: number;
    originalUrl: string;
    shortUrl: string;
    createdAt: string;
    updatedAt: string;
    clicks: number;
}