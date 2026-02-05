/**
 * Script to test the Ravenna API
 * 
 * Usage:
 *   ts-node src/scripts/test-ravenna-api.ts [--dry-run] [--api-key=<key>] [--output=<file>]
 * 
 * Environment variables:
 *   RAVENNA_API_KEY - Your Ravenna API key
 */

import { writeFile } from "fs/promises";
import { join } from "path";

const BASE_URL = "https://www.ravenna-admit.com";
const DEFAULT_OUTPUT_FILE = "ravenna-api-results.json";

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
}

const parseArgs = (): ScriptArgs => {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const apiKey = "TqqY05I6hiEc2izlES3LWrM6LS4HE2vq373pt8gwT5m6YPP5LWI9scewX1muA3UIcsjG1j"
  const outputArg = args.find((arg) => arg.startsWith("--output="));
  const outputFile = outputArg
    ? outputArg.split("=")[1]
    : DEFAULT_OUTPUT_FILE;

  return { dryRun, apiKey, outputFile };
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

const testMetaEndpoint = async (
  apiKey: string | null,
  dryRun: boolean,
): Promise<ApiResponse> => {
  console.log("\n=== Testing Meta Endpoint (/api/v1/meta) ===\n");

  const result = await makeRequest("/api/v1/meta", apiKey, dryRun);

  if (!result.success) {
    console.error("❌ Meta endpoint test failed:");
    console.error(`   Error: ${result.error}`);
    if (result.status) {
      console.error(`   Status: ${result.status}`);
    }
    return result;
  }

  console.log("✓ Meta endpoint test successful");
  if (dryRun) {
    console.log("   [DRY RUN] Would fetch API documentation");
  } else {
    console.log(`   Status: ${result.status}`);
    console.log("   Response:", JSON.stringify(result.data, null, 2));
  }

  return result;
};

const testApplicantsEndpoint = async (
  apiKey: string | null,
  dryRun: boolean,
): Promise<ApiResponse> => {
  console.log("\n=== Testing Applicants Endpoint (/api/v1/applicants) ===\n");

  const result = await makeRequest("/api/v1/applicants", apiKey, dryRun);

  if (!result.success) {
    console.error("❌ Applicants endpoint test failed:");
    console.error(`   Error: ${result.error}`);
    if (result.status) {
      console.error(`   Status: ${result.status}`);
    }
    return result;
  }

  console.log("✓ Applicants endpoint test successful");
  if (dryRun) {
    console.log("   [DRY RUN] Would fetch all applicants");
  } else {
    console.log(`   Status: ${result.status}`);
    if (Array.isArray(result.data)) {
      console.log(`   Found ${result.data.length} applicant(s)`);
      if (result.data.length > 0) {
        console.log("   First applicant:", JSON.stringify(result.data[0], null, 2));
      }
    } else {
      console.log("   Response:", JSON.stringify(result.data, null, 2));
    }
  }

  return result;
};

const saveResultsToFile = async (
  results: {
    timestamp: string;
    baseUrl: string;
    meta: ApiResponse;
    applicants: ApiResponse;
  },
  outputFile: string,
): Promise<void> => {
  const outputPath = join(process.cwd(), outputFile);
  const jsonContent = JSON.stringify(results, null, 2);

  await writeFile(outputPath, jsonContent, "utf-8");
  console.log(`\n💾 Results saved to: ${outputPath}`);
};

const main = async (): Promise<void> => {
  const { dryRun, apiKey, outputFile } = parseArgs();

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
    console.log("\n🚀 Testing Ravenna API\n");
    console.log(`   Base URL: ${BASE_URL}`);
    console.log(`   API Key: ${apiKey.substring(0, 8)}...`);
  }

  const metaResult = await testMetaEndpoint(apiKey, dryRun);
  const applicantsResult = await testApplicantsEndpoint(apiKey, dryRun);

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    meta: metaResult,
    applicants: applicantsResult,
  };

  await saveResultsToFile(results, outputFile);

  console.log("\n✅ All tests completed\n");
};

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
