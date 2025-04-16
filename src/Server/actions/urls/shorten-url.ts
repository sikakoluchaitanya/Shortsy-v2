"use server";

import { ApiResponse } from '@/lib/types';
import { ensureHttps, isValidUrl } from '@/lib/utils';
import { z } from 'zod';
import { nanoid} from 'nanoid';
import { db } from '@/Server/DB';
import { urls } from '@/Server/DB/schema';
import { revalidatePath } from 'next/cache';
import { auth } from '@/Server/auth';
import { checkUrlSafety } from './check-url-safety';

const shortenUrlSchema = z.object({
    url: z.string()
        .min(1, { message: "URL is required" })
        .refine(isValidUrl, {
            message: "Please enter a valid URL"
        })
        .refine(url => url.length <= 2048, {
            message: "URL exceeds maximum length of 2048 characters"
        }),
    customCode: z
        .string()
        .min(6, { message: "Custom code must be at least 6 characters" })
        .max(50, { message: "Custom code cannot exceed 50 characters" })
        .regex(/^[a-zA-Z0-9_-]+$/, {
            message: "Only letters, numbers, dashes and underscores allowed"
        })
        .optional()
        .nullable()
        .transform((val) => (val === null || val === "" ? undefined : val))
})

export async function shortenUrl(formData: FormData):Promise<
    ApiResponse<{
        shortUrl: string;
        flagged: boolean;
        flagReason?: string | null;
        message?: string; 
    }>> {
    try {
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
            const firstError = 
                validatedUrl.error.flatten().fieldErrors.url?.[0] || 
                validatedUrl.error.flatten().fieldErrors.customCode?.[0] || 
                "Invalid input";
                
            return {
                success: false,
                error: firstError,
            };
        }

        const originalUrl = ensureHttps(validatedUrl.data.url);

        const safetyCheck = await checkUrlSafety(originalUrl);
        let flagged = false;
        let flagReason = null;

        if(safetyCheck.success && safetyCheck.data) {
            flagged = safetyCheck.data.flagged;
            flagReason = safetyCheck.data.reason;

            if(
                safetyCheck.data.category === "malicious" &&
                safetyCheck.data.confidence > 0.7 &&
                session?.user?.role !== "admin"
            ) {
                return {
                    success: false,
                    error: "This URL has been detected as potentially harmful",
                }
            }
        }

        // Generate or use custom short code
        const shortCode = validatedUrl.data.customCode || nanoid(10);
        
        // Check if the short code already exists
        const existingUrl = await db.query.urls.findFirst({
            where: (urls, {eq}) => eq(urls.shortCode, shortCode),
        })

        if(existingUrl){
            if(validatedUrl.data.customCode) {
                return {
                    success: false,
                    error: "This custom code is already in use",
                }
            }
            // If system-generated code collides, try again with a new one
            return shortenUrl(formData);
        }

        // Create new short URL in database
        await db.insert(urls).values({
            originalUrl,
            shortCode,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: userId || "anonymous",
            flagged,
            flagReason,
        })

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const shortUrl = `${baseUrl}/r/${shortCode}`

        revalidatePath("/");

        return {
            success: true,
            data: { 
                shortUrl,
                flagged,
                flagReason,
                message: flagged 
                    ? "This URL has been flagged for review by our safety system. It may be limited until approved." 
                    : undefined,
            }
        }

    } catch (error) {
        console.error("Failed to shorten URL:", error);
        return {
            success: false,
            error: "Unable to create short URL. Please try again.",
        };
    }
}