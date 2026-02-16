/**
 * Script to fetch households for all applicants from Ravenna API
 * 
 * Usage:
 *   ts-node src/scripts/test-ravenna-households.ts [--dry-run] [--api-key=<key>] [--input=<file>] [--output=<file>]
 * 
 * Environment variables:
 *   RAVENNA_API_KEY - Your Ravenna API key
 * 
 * Example:
 *   ts-node src/scripts/test-ravenna-households.ts
 */

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const BASE_URL = "https://www.ravenna-admit.com";
const DEFAULT_INPUT_FILE = "ravenna-api-results.json";
const DEFAULT_OUTPUT_FILE = "ravenna-households-results.json";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

interface Applicant {
  id: number;
  [key: string]: unknown;
}

interface ScriptArgs {
  dryRun: boolean;
  apiKey: string | null;
  inputFile: string;
  outputFile: string;
}

const parseArgs = (): ScriptArgs => {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const apiKey = "TqqY05I6hiEc2izlES3LWrM6LS4HE2vq373pt8gwT5m6YPP5LWI9scewX1muA3UIcsjG1j";

  const inputArg = args.find((arg) => arg.startsWith("--input="));
  const inputFile = inputArg
    ? inputArg.split("=")[1]
    : DEFAULT_INPUT_FILE;

  const outputArg = args.find((arg) => arg.startsWith("--output="));
  const outputFile = outputArg
    ? outputArg.split("=")[1]
    : DEFAULT_OUTPUT_FILE;

  return { dryRun, apiKey, inputFile, outputFile };
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

const loadApplicants = async (inputFile: string): Promise<Applicant[]> => {
  const inputPath = join(process.cwd(), inputFile);
  const fileContent = await readFile(inputPath, "utf-8");
  const jsonData = JSON.parse(fileContent);

  if (!jsonData.applicants?.data || !Array.isArray(jsonData.applicants.data)) {
    throw new Error(`Invalid input file structure. Expected .applicants.data to be an array.`);
  }

  return jsonData.applicants.data;
};

const fetchHouseholdsForApplicant = async (
  applicantId: number,
  apiKey: string | null,
  dryRun: boolean,
): Promise<ApiResponse> => {
  const endpoint = `/api/v1/applicants/${applicantId}/households`;
  return makeRequest(endpoint, apiKey, dryRun);
};

const processAllApplicants = async (
  applicants: Applicant[],
  apiKey: string | null,
  dryRun: boolean,
): Promise<Array<{ applicantId: number; households: ApiResponse }>> => {
  const results: Array<{ applicantId: number; households: ApiResponse }> = [];
  const total = applicants.length;

  for (let i = 0; i < applicants.length; i++) {
    const applicant = applicants[i];
    const applicantId = applicant.id;

    if (!applicantId) {
      console.warn(`⚠️  Skipping applicant at index ${i}: missing id`);
      continue;
    }

    console.log(`[${i + 1}/${total}] Fetching households for applicant ${applicantId}...`);

    const householdsResult = await fetchHouseholdsForApplicant(
      applicantId,
      apiKey,
      dryRun,
    );

    if (!householdsResult.success) {
      console.error(`❌ Failed to fetch households for applicant ${applicantId}: ${householdsResult.error}`);
    } else {
      console.log(`✓ Successfully fetched households for applicant ${applicantId}`);
    }

    results.push({
      applicantId,
      households: householdsResult,
    });

    // Small delay to avoid rate limiting (if not in dry-run)
    if (!dryRun && i < applicants.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
};

const saveResultsToFile = async (
  results: {
    timestamp: string;
    baseUrl: string;
    totalApplicants: number;
    results: Array<{ applicantId: number; households: ApiResponse }>;
  },
  outputFile: string,
): Promise<void> => {
  const outputPath = join(process.cwd(), outputFile);
  const jsonContent = JSON.stringify(results, null, 2);

  await writeFile(outputPath, jsonContent, "utf-8");
  console.log(`\n💾 Results saved to: ${outputPath}`);
};

const main = async (): Promise<void> => {
  const { dryRun, apiKey, inputFile, outputFile } = parseArgs();

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
    console.log("\n🚀 Fetching households for all applicants\n");
    console.log(`   Base URL: ${BASE_URL}`);
    console.log(`   API Key: ${apiKey.substring(0, 8)}...`);
  }

  console.log(`\n📂 Loading applicants from: ${inputFile}`);

  let applicants: Applicant[];
  try {
    applicants = await loadApplicants(inputFile);
  } catch (error) {
    console.error(`\n❌ Error loading applicants: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  if (applicants.length === 0) {
    console.error("\n❌ No applicants found in input file");
    process.exit(1);
  }

  console.log(`✓ Found ${applicants.length} applicant(s)\n`);

  const results = await processAllApplicants(applicants, apiKey, dryRun);

  const output = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalApplicants: applicants.length,
    results,
  };

  await saveResultsToFile(output, outputFile);

  const successCount = results.filter((r) => r.households.success).length;
  const failureCount = results.length - successCount;

  console.log(`\n✅ Processing completed`);
  console.log(`   Total: ${results.length}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${failureCount}\n`);
};

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
