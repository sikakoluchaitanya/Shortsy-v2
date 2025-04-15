"use server";

import { ApiResponse } from "@/lib/types"
import { auth } from "@/Server/auth";
import { db, eq } from "@/Server/DB";
import { urls } from "@/Server/DB/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod"

const updateUrlSchema = z.object({
    id: z.coerce.number(),
    customCode: z.
        string()
        .min(6, "Custom code is required")
        .max(50, "Custom code must be less than 50 characters")
        .regex(/^[a-zA-Z0-9_-]+$/, "Custom code must only contain letters, numbers, dashes, and underscores"),
})

export async function updateUrl(formData: FormData): Promise<ApiResponse<{shortUrl:string}>> {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        if(!userId) {
            return {
                success: false,
                error: "Unauthorized, please log in"
            };
        }

        const validatedFields = updateUrlSchema.safeParse({
            id: formData.get("id"),
            customCode: formData.get("customCode"),
        });

        if(!validatedFields.success) {
            return {
                success: false,
                error: validatedFields.error.flatten().fieldErrors.id?.[0] || "Invalid URL ID",
            };
        }

        const {id, customCode} = validatedFields.data;

        const existingUrl = await db.query.urls.findFirst({
            where: (urls, {eq, and}) => 
                and(eq(urls.id, id), eq(urls.userId, userId)),
        });

        if(!existingUrl) {
            return {
                success: false,
                error: "URL not found or you do not have permission to update it",
            };
        }

        const codeExists = await db.query.urls.findFirst({
            where: (urls, {eq, and , ne}) => 
                and(eq(urls.shortCode, customCode), ne(urls.id, id)),
        });

        if(codeExists) {
            return {
                success: false,
                error: "Custom code already exists",
            }; 
        }

        await db
            .update(urls)
            .set({
            shortCode: customCode,
            updatedAt: new Date(),
            }).where(eq(urls.id, id));

            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            const shortUrl = `${baseUrl}/${customCode}`;

            revalidatePath("/dashboard");

            return {
                success: true,
                data: {
                    shortUrl,
                },
            };
        
    } catch (error) {
        console.error("Error updating URL:", error);
        return {
            success: false,
            error: "An error occurred while updating the URL",
        };
    }
}