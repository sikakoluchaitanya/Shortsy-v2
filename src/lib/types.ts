import {z} from 'zod';

export const urlSchema = z.object({
    url: z.string().url("Please enter a valid URL"),
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