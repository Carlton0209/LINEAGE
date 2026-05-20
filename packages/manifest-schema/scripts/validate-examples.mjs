import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
const schemaPath = join(packageDir, "schema.json");
const validDir = join(packageDir, "examples", "valid");
const invalidDir = join(packageDir, "examples", "invalid");

const ajv = new Ajv2020({
  allErrors: true,
  strict: true
});
addFormats(ajv);

const schema = JSON.parse(await readFile(schemaPath, "utf8"));
const validate = ajv.compile(schema);

async function readJsonExamples(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => join(directory, entry.name))
    .sort();

  return Promise.all(
    files.map(async (filePath) => ({
      filePath,
      data: JSON.parse(await readFile(filePath, "utf8"))
    }))
  );
}

function formatErrors(errors = []) {
  return errors
    .map((error) => {
      const path = error.instancePath || "/";
      return `  - ${path} ${error.message}`;
    })
    .join("\n");
}

let failures = 0;

for (const example of await readJsonExamples(validDir)) {
  const ok = validate(example.data);
  const displayPath = relative(packageDir, example.filePath);

  if (!ok) {
    failures += 1;
    console.error(`Expected valid example to pass: ${displayPath}`);
    console.error(formatErrors(validate.errors));
  } else {
    console.log(`valid   ${displayPath}`);
  }
}

for (const example of await readJsonExamples(invalidDir)) {
  const ok = validate(example.data);
  const displayPath = relative(packageDir, example.filePath);

  if (ok) {
    failures += 1;
    console.error(`Expected invalid example to fail: ${displayPath}`);
  } else {
    console.log(`invalid ${displayPath}`);
  }
}

if (failures > 0) {
  process.exitCode = 1;
}
