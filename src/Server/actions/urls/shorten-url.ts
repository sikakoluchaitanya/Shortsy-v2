"use server";

import { ApiResponse } from '@/lib/types';
import { ensureHttps, isValidUrl } from '@/lib/utils';
import { z } from 'zod';
import { nanoid} from 'nanoid';
import { db } from '@/Server/DB';
import { urls } from '@/Server/DB/schema';
import { revalidatePath } from 'next/cache';
import { auth } from '@/Server/auth';

const shortenUrlSchema = z.object({
    url: z.string().refine(isValidUrl, {
        message: "Please enter a valid URL"
    }),
    customCode: z
        .string()
        .min(6, { message: "Custom code must be at least 6 characters long",})
        .max(50, { message: "Custom code must be at most 50 characters long",})
        .regex(/^[a-zA-Z0-9_-]+$/,"Custom code must contain only letters, numbers, dashes, and underscores")
        .optional()
        .nullable()
        .transform((val) => (val === null || val === "" ? undefined : val))
})

export async function shortenUrl(formData: FormData):Promise<ApiResponse<{shortUrl: string}>> {
    try{
        const session = await auth();

        if (!session || !session.user?.id) {
            return {
                success: false,
                error: "User not authenticated",
            };
        }

        
        const userId = session?.user.id || null;

        const url = formData.get("url") as string;
        const customCode = formData.get("customCode") as string;
        
        const validatedUrl = shortenUrlSchema.safeParse({
            url,
            customCode: customCode ? customCode : undefined,
        });

        if(!validatedUrl.success) {
            return {
                success: false,
                error: validatedUrl.error.flatten().fieldErrors.url?.[0] || "Invalid URL",
            };
        }

        const originalUrl = ensureHttps(validatedUrl.data.url);
        const shortCode = validatedUrl.data.customCode || nanoid(10);

        const existingUrl = await db.query.urls.findFirst({
            where: (urls, {eq}) => eq(urls.shortCode, shortCode),
        })

        if(existingUrl){
            if(validatedUrl.data.customCode) {
                return {
                    success: false,
                    error: "Custom code already exists",
                }
            }
            return shortenUrl(formData);
        }

        await db.insert(urls).values({
            originalUrl,
            shortCode,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: userId || "anonymous",
        })

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const shortUrl = `${baseUrl}/r/${shortCode}` // change the var cause can not be same

        revalidatePath("/");

        return {
            success: true,
            data: { shortUrl }
        }

    } catch (error) {
        console.error("Failed to shorten URL:", error);
        return {
            success: false,
            error: "Failed to shorten URL",
        };
    }
}