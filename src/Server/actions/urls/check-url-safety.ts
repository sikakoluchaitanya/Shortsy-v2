"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiResponse } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export type UrlSafetyCheck = {
  isSafe: boolean;
  flagged: boolean;
  reason: string | null;
  category: "safe" | "suspicious" | "malicious" | "inappropriate" | "unknown";
  confidence: number;
};

export async function checkUrlSafety(
  url: string,
): Promise<ApiResponse<UrlSafetyCheck>> {
  try {
    // Validate URL format first
    try {
      new URL(url);
    } catch (error) {
      return {
        success: false,
        error: "Invalid URL format",
      };
    }

    // Skip API check if no API key (with logging)
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.warn("URL safety check skipped: Missing Gemini API key");
      return {
        success: true,
        data: {
          isSafe: true,
          flagged: false,
          reason: null,
          category: "unknown",
          confidence: 0,
        },
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Added timeout for API response
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("URL safety check timeout")), 5000);
    });

    const resultPromise = model.generateContent(`
        Task: Analyze the URL "${url}" for potential security threats and safety concerns.

        Evaluation criteria:
        - Phishing: Check if the URL mimics legitimate websites to steal credentials
        - Malware: Determine if the URL is known to distribute malicious software
        - Scam/Fraud: Assess if the URL is associated with fraudulent activities
        - Content safety: Evaluate if the URL contains inappropriate or harmful content
        - Domain reputation: Consider domain age, registration details, and known history
        - Technical indicators: Analyze URL structure for suspicious patterns (excessive subdomains, unusual TLDs)
        
        Specific checks:
        1. Is it a known phishing website?
        2. Does it contain malicious content or links?
        3. Is it a suspicious or inappropriate website?
        4. Is the domain suspicious or newly registered?
        5. Does it have characteristics of malware distribution sites?
        6. Is it associated with scams or fraudulent activities?
        7. Does it contain adware or spyware?
        8. Does it use deceptive URL techniques?
        
        Response format: Return only a valid JSON object with the following structure:
        {
            "isSafe": boolean,         // true if the URL appears safe to visit
            "flagged": boolean,        // true if any security concerns were detected
            "reason": string | null,   // brief explanation of security concerns if flagged
            "category": "safe" | "suspicious" | "malicious" | "inappropriate" | "unknown",
            "confidence": number       // confidence score between 0 and 1
        }

        Only respond with a valid JSON object, no additional text.
    `);

    try {
      // Race the API call with the timeout
      const result = await Promise.race([resultPromise, timeoutPromise]);
      const response = result.response;
      const text = response.text();

      // Improved JSON parsing with error handling
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }

      const jsonResponse = JSON.parse(jsonMatch[0]) as UrlSafetyCheck;

      // Validate the response structure
      if (typeof jsonResponse.isSafe !== 'boolean' || 
          typeof jsonResponse.flagged !== 'boolean' ||
          !['safe', 'suspicious', 'malicious', 'inappropriate', 'unknown'].includes(jsonResponse.category)) {
        throw new Error("Invalid response format");
      }

      return {
        success: true,
        data: jsonResponse,
      };
    } catch (parseError) {
      console.error("Failed to parse safety check response:", parseError);
      // Fallback to safe with warning if API response is invalid
      return {
        success: true,
        data: {
          isSafe: true,
          flagged: true,
          reason: "Unable to verify URL safety - please proceed with caution",
          category: "unknown",
          confidence: 0.5,
        },
      };
    }
  } catch (error) {
    console.error("URL safety check error:", error);
    // Return a usable fallback response if the API call fails completely
    return {
      success: true,
      data: {
        isSafe: true,
        flagged: false,
        reason: null,
        category: "unknown",
        confidence: 0,
      },
    };
  }
}