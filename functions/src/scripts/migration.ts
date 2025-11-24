import "../infrastructure/local-init";

import { APPOINTMENT_STATUS, AppointmentData, OWNER_TYPE } from "../core";
import { repositoryHost } from "../repositories";
import { serviceHost } from "../services";
import * as fs from "fs";
import * as path from "path";

// Initialize repositories
const databaseService = serviceHost.getDatabaseService();
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);
const serviceRepository = repositoryHost.getServiceRepository(databaseService);
const customerRepository =
  repositoryHost.getCustomerRepository(databaseService);
const memberRepository = repositoryHost.getMemberRepository(databaseService);
const userRepository = repositoryHost.getUserRepository(databaseService);
const calendarRepository = repositoryHost.getCalendarRepository(databaseService);

const TARGET_ORGANIZATION_ID = "WYzeYoqP6YoqOVuZJ5Yr";
const SQL_DUMP_PATH = path.join(__dirname, "../../../CRMbackup.sql");

// Service name mapping: SQL name -> Firestore name
const SERVICE_NAME_MAP: Record<string, string> = {
  "Коса и брада": "Hair & Beard Combo",
  "Комплекс": "Complex",
  "Бръснене": "Shave",
  "Подстрижка": "Premium Haircut",
};

interface SQLAppointment {
  id: number;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  client_name: string;
  calendar_id: number;
  service_id: number;
  start_time: string;
  duration: number;
  description: string | null;
  user_id: number;
  client_phonenumber: string | null;
  reminder_sent: boolean;
}

interface SQLService {
  id: number;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  organization_id: number;
  name: string;
  description: string | null;
  price: number;
}

interface SQLCalendar {
  id: number;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  user_id: number;
}

interface SQLUser {
  id: number;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  clerk_id: string | null;
  organization_id: number | null;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

function parseNull(value: string): string | null {
  return value === "\\N" ? null : value;
}

function parseSQLCopySection(
  content: string,
  tableName: string,
  columns: string[],
): string[][] {
  const copyPattern = new RegExp(
    `COPY public\\.${tableName} \\(([^\\)]+)\\) FROM stdin;\\s*\\n([\\s\\S]*?)\\n\\\\\\.`,
  );
  const match = content.match(copyPattern);
  if (!match) {
    return [];
  }

  const rows: string[][] = [];
  const dataLines = match[2].trim().split("\n");

  for (const line of dataLines) {
    if (!line.trim()) continue;
    // Split by tab, but handle escaped tabs and nulls
    const values = line.split("\t");
    rows.push(values);
  }

  return rows;
}

function parseAppointments(content: string): SQLAppointment[] {
  const columns = [
    "id",
    "created_at",
    "updated_at",
    "deleted_at",
    "client_name",
    "calendar_id",
    "service_id",
    "start_time",
    "duration",
    "description",
    "user_id",
    "client_phonenumber",
    "reminder_sent",
  ];
  const rows = parseSQLCopySection(content, "appointments", columns);

  return rows.map((row) => ({
    id: parseInt(row[0], 10),
    created_at: parseNull(row[1]),
    updated_at: parseNull(row[2]),
    deleted_at: parseNull(row[3]),
    client_name: row[4],
    calendar_id: parseInt(row[5], 10),
    service_id: parseInt(row[6], 10),
    start_time: row[7],
    duration: parseInt(row[8], 10),
    description: parseNull(row[9]),
    user_id: parseInt(row[10], 10),
    client_phonenumber: parseNull(row[11]),
    reminder_sent: row[12] === "t",
  }));
}

function parseServices(content: string): SQLService[] {
  const columns = [
    "id",
    "created_at",
    "updated_at",
    "deleted_at",
    "organization_id",
    "name",
    "description",
    "price",
  ];
  const rows = parseSQLCopySection(content, "services", columns);

  return rows.map((row) => ({
    id: parseInt(row[0], 10),
    created_at: parseNull(row[1]),
    updated_at: parseNull(row[2]),
    deleted_at: parseNull(row[3]),
    organization_id: parseInt(row[4], 10),
    name: row[5],
    description: parseNull(row[6]),
    price: parseFloat(row[7]),
  }));
}

function parseCalendars(content: string): SQLCalendar[] {
  const columns = ["id", "created_at", "updated_at", "deleted_at", "user_id"];
  const rows = parseSQLCopySection(content, "calendars", columns);

  return rows.map((row) => ({
    id: parseInt(row[0], 10),
    created_at: parseNull(row[1]),
    updated_at: parseNull(row[2]),
    deleted_at: parseNull(row[3]),
    user_id: parseInt(row[4], 10),
  }));
}

function parseUsers(content: string): SQLUser[] {
  const columns = [
    "id",
    "created_at",
    "updated_at",
    "deleted_at",
    "clerk_id",
    "organization_id",
    "first_name",
    "last_name",
    "email",
    "role",
  ];
  const rows = parseSQLCopySection(content, "users", columns);

  return rows.map((row) => ({
    id: parseInt(row[0], 10),
    created_at: parseNull(row[1]),
    updated_at: parseNull(row[2]),
    deleted_at: parseNull(row[3]),
    clerk_id: parseNull(row[4]),
    organization_id: row[5] === "\\N" ? null : parseInt(row[5], 10),
    first_name: row[6],
    last_name: row[7],
    email: row[8],
    role: row[9],
  }));
}

async function main() {
  const isDryRun = false; 

  console.log("Starting appointment migration...");
  console.log(`Mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Target Organization ID: ${TARGET_ORGANIZATION_ID}`);

  // Read SQL dump
  console.log("\nReading SQL dump...");
  const sqlContent = fs.readFileSync(SQL_DUMP_PATH, "utf-8");

  // Parse SQL data
  console.log("Parsing SQL data...");
  const sqlAppointments = parseAppointments(sqlContent);
  const sqlServices = parseServices(sqlContent);
  const sqlCalendars = parseCalendars(sqlContent);
  const sqlUsers = parseUsers(sqlContent);

  console.log(`Found ${sqlAppointments.length} appointments`);
  console.log(`Found ${sqlServices.length} services`);
  console.log(`Found ${sqlCalendars.length} calendars`);
  console.log(`Found ${sqlUsers.length} users`);

  // Query Firestore for existing data
  console.log("\nQuerying Firestore for existing data...");
  const [firestoreServices, firestoreMembers, firestoreUsers, firestoreCalendars] =
    await Promise.all([
      serviceRepository.getAll({
        organizationId: TARGET_ORGANIZATION_ID,
        pagination: { limit: 1000 },
      }),
      memberRepository.getAll({
        organizationId: TARGET_ORGANIZATION_ID,
        pagination: { limit: 1000 },
      }),
      // Get all users (they're not organization-specific)
      userRepository.getAll({
        pagination: { limit: 1000 },
      }),
      calendarRepository.getAll({
        organizationId: TARGET_ORGANIZATION_ID,
        pagination: { limit: 1000 },
      }),
    ]);

  console.log(`Found ${firestoreServices.length} Firestore services`);
  console.log(`Found ${firestoreMembers.length} Firestore members`);
  console.log(`Found ${firestoreUsers.length} Firestore users`);
  console.log(`Found ${firestoreCalendars.length} Firestore calendars`);

  if (firestoreServices.length === 0) {
    console.log("⚠️  No Firestore services found");
    process.exit(1);
  }

  // Build lookup maps
  console.log("\nBuilding lookup maps...");

  // Service map: SQL service name -> Firestore service
  const serviceMap = new Map<number, string>(); // SQL service_id -> Firestore service_id
  const unmappedServices: Array<{ id: number; name: string }> = [];
  
  for (const sqlService of sqlServices) {
    if (sqlService.deleted_at) continue;
    
    // Try direct name match first
    let firestoreServiceName = sqlService.name;
    
    // Check if there's a mapping for this service name
    if (SERVICE_NAME_MAP[sqlService.name]) {
      firestoreServiceName = SERVICE_NAME_MAP[sqlService.name];
      console.log(
        `  Mapping service name: "${sqlService.name}" -> "${firestoreServiceName}"`,
      );
    }
    
    const firestoreService = firestoreServices.find(
      (s) => s.name === firestoreServiceName,
    );
    
    if (firestoreService) {
      serviceMap.set(sqlService.id, firestoreService.id);
      console.log(
        `  ✓ Mapped service: "${sqlService.name}" (SQL ID: ${sqlService.id}) -> "${firestoreServiceName}" (Firestore ID: ${firestoreService.id})`,
      );
    } else {
      unmappedServices.push({ id: sqlService.id, name: sqlService.name });
    }
  }

  if (unmappedServices.length > 0) {
    console.log(`\n⚠️  Warning: ${unmappedServices.length} services not found in Firestore:`);
    for (const service of unmappedServices) {
      console.log(`  - SQL ID ${service.id}: "${service.name}"`);
    }
    console.log(`\nAvailable Firestore services:`);
    for (const service of firestoreServices) {
      console.log(`  - "${service.name}" (ID: ${service.id})`);
    }
  }

  // Calendar to user map: SQL calendar_id -> SQL user_id
  const calendarToUserMap = new Map<number, number>();
  for (const sqlCalendar of sqlCalendars) {
    if (sqlCalendar.deleted_at) continue;
    calendarToUserMap.set(sqlCalendar.id, sqlCalendar.user_id);
  }

  // User to email map: SQL user_id -> email
  const userToEmailMap = new Map<number, string>();
  for (const sqlUser of sqlUsers) {
    if (sqlUser.deleted_at) continue;
    userToEmailMap.set(sqlUser.id, sqlUser.email);
  }

  // Email to member map: email -> Firestore member ID
  const emailToMemberMap = new Map<string, string>();
  for (const firestoreUser of firestoreUsers) {
    const member = firestoreMembers.find((m) => m.id === firestoreUser.id);
    if (member) {
      emailToMemberMap.set(firestoreUser.email.toLowerCase(), member.id);
    }
  }

  // Member to calendar map: Firestore member_id -> Firestore calendar
  const memberToCalendarMap = new Map<string, string>(); // member_id -> calendar_id
  for (const firestoreCalendar of firestoreCalendars) {
    if (firestoreCalendar.ownerType === OWNER_TYPE.MEMBER) {
      memberToCalendarMap.set(firestoreCalendar.ownerId, firestoreCalendar.id);
    }
  }

  // Customer cache: name+phone -> customer ID
  const customerCache = new Map<string, string>();


  // Migration statistics
  let processed = 0;
  let created = 0;
  let skipped = 0;
  let errors = 0;

  console.log("\nStarting migration...\n");

  // Process appointments
  for (const sqlAppointment of sqlAppointments) {
    processed++;

    try {
      // Skip if deleted
      if (sqlAppointment.deleted_at) {
        console.log(
          `[${processed}/${sqlAppointments.length}] Skipping deleted appointment ${sqlAppointment.id}`,
        );
        skipped++;
        continue;
      }

      // Find service
      const firestoreServiceId = serviceMap.get(sqlAppointment.service_id);
        if (!firestoreServiceId) {
          console.log(
            `[${processed}/${sqlAppointments.length}] ⚠️  Skipping appointment ${sqlAppointment.id}: Service not found (SQL service_id: ${sqlAppointment.service_id})`,
          );
          skipped++;
          continue;
        }

      // Find member via calendar -> user -> email -> member -> calendar
      // Step 1: SQL calendar_id -> SQL user_id
      const sqlUserId = calendarToUserMap.get(sqlAppointment.calendar_id);
      if (!sqlUserId) {
        console.log(
          `[${processed}/${sqlAppointments.length}] ⚠️  Skipping appointment ${sqlAppointment.id}: Calendar not found (SQL calendar_id: ${sqlAppointment.calendar_id})`,
        );
        skipped++;
        continue;
      }

      // Step 2: SQL user_id -> email
      const email = userToEmailMap.get(sqlUserId);
      if (!email) {
        console.log(
          `[${processed}/${sqlAppointments.length}] ⚠️  Skipping appointment ${sqlAppointment.id}: User not found (SQL user_id: ${sqlUserId})`,
        );
        skipped++;
        continue;
      }

      // Step 3: email -> Firestore member ID
      const memberId = emailToMemberMap.get(email.toLowerCase());
      if (!memberId) {
        console.log(
          `[${processed}/${sqlAppointments.length}] ⚠️  Skipping appointment ${sqlAppointment.id}: Member not found for email: ${email}`,
        );
        skipped++;
        continue;
      }

      // Step 4: member ID -> Firestore calendar (verify calendar exists)
      const firestoreCalendarId = memberToCalendarMap.get(memberId);
      if (!firestoreCalendarId) {
        console.log(
          `[${processed}/${sqlAppointments.length}] ⚠️  Skipping appointment ${sqlAppointment.id}: Calendar not found for member: ${memberId} (email: ${email})`,
        );
        skipped++;
        continue;
      }

      // Find or create customer
      const customerKey = `${sqlAppointment.client_name}|${sqlAppointment.client_phonenumber || ""}`;
      let customerId = customerCache.get(customerKey);

      if (!customerId) {
        // Try to find existing customer by searching through all customers
        // Note: Firestore doesn't support querying nested customFields easily,
        // so we'll fetch all and filter in memory (for small datasets this is fine)
        const allCustomers = await customerRepository.getAll({
          organizationId: TARGET_ORGANIZATION_ID,
          pagination: { limit: 1000 },
        });

        let customer = allCustomers.find((c) => {
          const name = c.customFields?.name as string;
          const phone =
            (c.customFields?.phone as string) ||
            (c.customFields?.["phone number"] as string);
          return (
            name === sqlAppointment.client_name &&
            (phone === sqlAppointment.client_phonenumber ||
              (!phone && !sqlAppointment.client_phonenumber))
          );
        });

        if (!customer) {
          // Create new customer
          const customerEmail = `migration-${Date.now()}-${processed}@placeholder.local`;

          const customerData = {
            organizationId: TARGET_ORGANIZATION_ID,
            email: customerEmail,
            customFields: {
              name: sqlAppointment.client_name,
              ...(sqlAppointment.client_phonenumber && {
                phone: sqlAppointment.client_phonenumber,
              }),
            },
          };

          if (!isDryRun) {
            customerId = await customerRepository.create({
              data: customerData,
              organizationId: TARGET_ORGANIZATION_ID,
            });
            console.log(
              `  Created customer: ${sqlAppointment.client_name} (ID: ${customerId})`,
            );
          } else {
            customerId = `dry-run-customer-${processed}`;
            console.log(
              `  [DRY RUN] Would create customer: ${sqlAppointment.client_name}`,
            );
          }
        } else {
          customerId = customer.id;
          console.log(
            `  Found existing customer: ${sqlAppointment.client_name} (ID: ${customerId})`,
          );
        }

        customerCache.set(customerKey, customerId);
      }

      // Determine status
      let status: APPOINTMENT_STATUS;
      const startDate = new Date(sqlAppointment.start_time);
      const now = new Date();

      if (sqlAppointment.deleted_at) {
        status = APPOINTMENT_STATUS.CANCELLED;
      } else if (startDate < now) {
        status = APPOINTMENT_STATUS.COMPLETED;
      } else {
        status = APPOINTMENT_STATUS.PENDING;
      }

      // Get service fee (if available)
      const firestoreService = firestoreServices.find(
        (s) => s.id === firestoreServiceId,
      );
      const fee = firestoreService?.price;

      // Create appointment data
      const appointmentData: AppointmentData = {
        assigneeType: OWNER_TYPE.MEMBER,
        assigneeId: memberId,
        customerId: customerId!,
        serviceId: firestoreServiceId,
        title: sqlAppointment.client_name,
        description: sqlAppointment.description || "",
        organizationId: TARGET_ORGANIZATION_ID,
        startTime: startDate.toISOString(),
        duration: sqlAppointment.duration,
        fee: fee,
        status: status,
      };

      if (!isDryRun) {
        await appointmentRepository.create({
          data: appointmentData,
          organizationId: TARGET_ORGANIZATION_ID,
        });
        created++;
        console.log(
          `[${processed}/${sqlAppointments.length}] ✓ Created appointment ${sqlAppointment.id} -> ${sqlAppointment.client_name} at ${startDate.toISOString()}`,
        );
      } else {
        created++;
        console.log(
          `[${processed}/${sqlAppointments.length}] [DRY RUN] Would create appointment: ${sqlAppointment.client_name} at ${startDate.toISOString()} (Status: ${status})`,
        );
      }
    } catch (error) {
      errors++;
      console.error(
        `[${processed}/${sqlAppointments.length}] ✗ Error processing appointment ${sqlAppointment.id}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Migration Summary");
  console.log("=".repeat(60));
  console.log(`Total appointments processed: ${processed}`);
  console.log(`Appointments created: ${created}`);
  console.log(`Appointments skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
  console.log("=".repeat(60));

  if (isDryRun) {
    console.log("\n⚠️  This was a DRY RUN. No data was actually migrated.");
    console.log("Run with --live flag to perform the actual migration.");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
