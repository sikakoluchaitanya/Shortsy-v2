"use server";

import { ApiResponse } from "@/lib/types";
import { db, eq } from "@/Server/DB";
import { urls } from "@/Server/DB/schema";

export async function getUrlByShortCode(shortCode: string): Promise< // aasync function that returns a promise of type ApiResponse
  ApiResponse<{
    originalUrl: string;
    flagged?: boolean;
    flagReason?: string | null;
  }>
> {
  try {
    const url = await db.query.urls.findFirst({
      where: (urls, { eq }) => eq(urls.shortCode, shortCode),
    });

    if (!url) {
      return {
        success: false,
        error: "URL not found",
      };
    }

    await db
      .update(urls)
      .set({
        clicks: url.clicks + 1,
        updatedAt: new Date(),
      })
      .where(eq(urls.shortCode, shortCode));

    return {
      success: true,
      data: {
        originalUrl: url.originalUrl,
        flagged: url.flagged || false,
        flagReason: url.flagReason || null,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "An error occurred while fetching the URL",
    };
  }
}