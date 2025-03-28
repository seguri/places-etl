import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

// Example of async main function
async function main() {
  console.log("Hello, World!");

  try {
    // Simulate an async operation
    const result = await new Promise((resolve) => {
      setTimeout(() => resolve("Async operation completed!"), 1000);
    });

    console.log(result);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Normalize `import.meta.url` and `process.argv[1]`
const thisFilePath = fileURLToPath(import.meta.url); // Convert `import.meta.url` to a file path

// Check if this file is being run directly
if (thisFilePath === resolve(process.argv[1])) {
  main().catch((err) => {
    console.error("Unhandled error in main:", err);
    process.exit(1);
  });
}
