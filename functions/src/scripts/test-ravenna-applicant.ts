/**
 * Script to test the Ravenna API - Single Applicant endpoint
 * 
 * Usage:
 *   ts-node src/scripts/test-ravenna-applicant.ts <applicant-id> [--dry-run] [--api-key=<key>] [--output=<file>]
 * 
 * Environment variables:
 *   RAVENNA_API_KEY - Your Ravenna API key
 * 
 * Example:
 *   ts-node src/scripts/test-ravenna-applicant.ts 2503715
 */

import { writeFile } from "fs/promises";
import { join } from "path";

const BASE_URL = "https://www.ravenna-admit.com";
const DEFAULT_OUTPUT_FILE = "ravenna-applicant-result.json";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

interface ScriptArgs {
  dryRun: boolean;
  apiKey: string | null;
  outputFile: string;
  applicantId: string | null;
}

const parseArgs = (): ScriptArgs => {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const apiKey = "TqqY05I6hiEc2izlES3LWrM6LS4HE2vq373pt8gwT5m6YPP5LWI9scewX1muA3UIcsjG1j"

  const outputArg = args.find((arg) => arg.startsWith("--output="));
  const outputFile = outputArg
    ? outputArg.split("=")[1]
    : DEFAULT_OUTPUT_FILE;

  // Find applicant ID (first non-flag argument)
  const applicantId = "2918076"

  return { dryRun, apiKey, outputFile, applicantId };
};

const makeRequest = async (
  endpoint: string,
  apiKey: string | null,
  dryRun: boolean,
): Promise<ApiResponse> => {
  if (dryRun) {
    return {
      success: true,
      data: { dryRun: true, endpoint, wouldCall: true },
    };
  }

  if (!apiKey) {
    return {
      success: false,
      error: "API key is required. Set RAVENNA_API_KEY env var or use --api-key=<key>",
    };
  }

  const url = `${BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    Authorization: `${apiKey}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const status = response.status;
    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        status,
        error: `HTTP ${status}: ${errorText}`,
      };
    }

    const data = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    return {
      success: true,
      status,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const testApplicantEndpoint = async (
  applicantId: string,
  apiKey: string | null,
  dryRun: boolean,
): Promise<ApiResponse> => {
  console.log(`\n=== Testing Applicant Endpoint (/api/v1/applicants/${applicantId}) ===\n`);

  const result = await makeRequest(`/api/v1/applicants/${applicantId}`, apiKey, dryRun);

  if (!result.success) {
    console.error("❌ Applicant endpoint test failed:");
    console.error(`   Error: ${result.error}`);
    if (result.status) {
      console.error(`   Status: ${result.status}`);
    }
    return result;
  }

  console.log("✓ Applicant endpoint test successful");
  if (dryRun) {
    console.log(`   [DRY RUN] Would fetch applicant with ID: ${applicantId}`);
  } else {
    console.log(`   Status: ${result.status}`);
    console.log("   Response:", JSON.stringify(result.data, null, 2));
  }

  return result;
};

const saveResultsToFile = async (
  results: {
    timestamp: string;
    baseUrl: string;
    applicantId: string;
    applicant: ApiResponse;
  },
  outputFile: string,
): Promise<void> => {
  const outputPath = join(process.cwd(), outputFile);
  const jsonContent = JSON.stringify(results, null, 2);

  await writeFile(outputPath, jsonContent, "utf-8");
  console.log(`\n💾 Results saved to: ${outputPath}`);
};

const main = async (): Promise<void> => {
  const { dryRun, apiKey, outputFile, applicantId } = parseArgs();

  if (!applicantId) {
    console.error(
      "\n❌ Error: Applicant ID is required\n" +
        "   Usage: ts-node src/scripts/test-ravenna-applicant.ts <applicant-id> [options]\n" +
        "   Example: ts-node src/scripts/test-ravenna-applicant.ts 2503715\n",
    );
    process.exit(1);
  }

  if (dryRun) {
    console.log("\n🔍 DRY RUN MODE - No actual API calls will be made\n");
  } else {
    if (!apiKey) {
      console.error(
        "\n❌ Error: API key is required\n" +
          "   Set RAVENNA_API_KEY environment variable or use --api-key=<key>\n" +
          "   Or use --dry-run to test without making actual requests\n",
      );
      process.exit(1);
    }
    console.log("\n🚀 Testing Ravenna API - Single Applicant\n");
    console.log(`   Base URL: ${BASE_URL}`);
    console.log(`   Applicant ID: ${applicantId}`);
    console.log(`   API Key: ${apiKey.substring(0, 8)}...`);
  }

  const applicantResult = await testApplicantEndpoint(applicantId, apiKey, dryRun);

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    applicantId,
    applicant: applicantResult,
  };

  await saveResultsToFile(results, outputFile);

  console.log("\n✅ Test completed\n");
};

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
