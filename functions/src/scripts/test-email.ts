import "../infrastructure/local-init";


import { serviceHost } from "@/services";
import {
  buildAppointmentEmailHtml,
  buildAppointmentEmailText,
  formatAppointmentDateTime,
  formatDuration,
} from "../utils/email-utils";

const isDryRun = false;

async function main() {
  // Get Mailgun credentials from environment
  const mailgunApiKey = process.env.MAILGUN_API_KEY || "";
  const mailgunDomain = process.env.MAILGUN_DOMAIN || "";

  if (!isDryRun && (!mailgunApiKey || !mailgunDomain)) {
    console.error(
      "Error: MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables are required.\n" +
      "Or use --dry-run to preview the email without sending.",
    );
    process.exit(1);
  }

  // Sample test data
  const testData = {
    customerName: "John Doe",
    serviceName: "Haircut & Styling",
    appointmentDate: formatAppointmentDateTime(
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      "UTC",
    ),
    duration: formatDuration(60),
    fee: 50.0,
    organizationName: "Sample Barbershop",
    organizationContactInfo: {
      address: "123 Main Street, City, State 12345",
      phone: "+1 (555) 123-4567",
      email: "contact@barbershop.com",
    },
  };

  const html = buildAppointmentEmailHtml("confirmation", testData);
  const text = buildAppointmentEmailText("confirmation", testData);

  if (isDryRun) {
    console.log("\n=== DRY RUN MODE - Email Preview ===\n");
    console.log("From:", `${testData.organizationName} <${testData.organizationContactInfo.email}>`);
    console.log("To:", "test@example.com");
    console.log("Subject:", `Appointment Confirmed - ${testData.serviceName}`);
    console.log("\n--- HTML Preview ---");
    console.log(html);
    console.log("\n--- Text Preview ---");
    console.log(text);
    console.log("\n=== End Preview ===\n");
    console.log("✓ Dry run completed");
    return;
  }

  // Send email
  const mailgunService = serviceHost.getMailgunService({
    apiKey: mailgunApiKey,
    domain: mailgunDomain,
    url: "https://api.eu.mailgun.net", // EU domain endpoint
  });

  try {
    await mailgunService.sendEmail({
      from: `${testData.organizationName} <${testData.organizationContactInfo.email}>`,
      to: "kamenkanev88@gmail.com", // Change this to your test email
      subject: `Appointment Confirmed - ${testData.serviceName}`,
      html,
      text,
    });

    console.log("✓ Test email sent successfully!");
    console.log("Check your inbox at: kamenkanev88@gmail.com");
  } catch (error) {
    console.log(error);
    console.error("Error sending email:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();