import { validateContactInput, verifySpamProtection } from "./src/lib/contact";

async function runTests() {
  console.log("Running Contact Form Integration Tests...");

  // Test 1: Validation
  console.log("\n--- Test 1: Input Validation ---");
  const validData = {
    name: "John Doe",
    mobileNumber: "+919876543210",
    email: "john@example.com",
    enquiryType: "GENERAL",
    message: "This is a test message with enough characters.",
    consent: true,
    turnstileToken: "1x00000000000000000000AA"
  };
  
  const validRes = validateContactInput(validData);
  if (validRes.success) {
    console.log("✅ Valid data passed validation");
  } else {
    console.log("❌ Valid data failed validation:", validRes.error);
  }

  const invalidData = {
    ...validData,
    mobileNumber: "123", // too short
  };
  const invalidRes = validateContactInput(invalidData);
  if (!invalidRes.success) {
    console.log("✅ Invalid data correctly failed validation");
  } else {
    console.log("❌ Invalid data incorrectly passed validation");
  }

  // Test 2: Spam Protection
  console.log("\n--- Test 2: Spam Protection ---");
  
  // Honeypot tripped
  const honeypotRes = await verifySpamProtection("bot-data", "1x00000000000000000000AA");
  if (!honeypotRes.success && honeypotRes.error === "Invalid submission") {
    console.log("✅ Honeypot correctly blocked submission");
  } else {
    console.log("❌ Honeypot check failed");
  }

  // Valid Turnstile
  const turnstileRes = await verifySpamProtection("", "1x00000000000000000000AA");
  if (turnstileRes.success) {
    console.log("✅ Turnstile test token accepted");
  } else {
    console.log("❌ Turnstile test token failed");
  }

  // Invalid Turnstile
  const badTurnstileRes = await verifySpamProtection("", "2x00000000000000000000AB");
  if (!badTurnstileRes.success) {
    console.log("✅ Invalid turnstile token rejected");
  } else {
    console.log("❌ Invalid turnstile token accepted");
  }

  console.log("\nTests Completed.");
}

runTests().catch(console.error);
