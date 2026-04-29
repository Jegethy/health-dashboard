import { EntryView } from "@/lib/entries";
import { entryInputSchema, EntryInput } from "@/lib/validation";

const headers = [
  "date",
  "weightKg",
  "steps",
  "caloriesEaten",
  "caloriesBurned",
  "notes",
] as const;

export function entriesToCsv(entries: EntryView[]): string {
  const rows = entries.map((entry) =>
    [
      entry.date,
      entry.weightKg,
      entry.steps,
      entry.caloriesEaten,
      entry.caloriesBurned,
      entry.notes,
    ].map(formatCsvCell),
  );

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

export function parseEntriesCsv(csv: string): {
  entries: EntryInput[];
  errors: string[];
} {
  const rows = parseCsvRows(csv);
  const errors: string[] = [];

  if (rows.length === 0) {
    return { entries: [], errors: ["The CSV file is empty."] };
  }

  const foundHeaders = rows[0].map((header) => header.trim());
  const missingHeaders = headers.filter((header) => !foundHeaders.includes(header));

  if (missingHeaders.length > 0) {
    return {
      entries: [],
      errors: [`Missing required columns: ${missingHeaders.join(", ")}.`],
    };
  }

  const entries = rows.slice(1).flatMap((row, index) => {
    if (row.every((cell) => cell.trim() === "")) {
      return [];
    }

    const record = Object.fromEntries(
      headers.map((header) => {
        const cellIndex = foundHeaders.indexOf(header);
        return [header, row[cellIndex] ?? ""];
      }),
    );

    const parsed = entryInputSchema.safeParse(record);

    if (!parsed.success) {
      errors.push(`Row ${index + 2}: ${parsed.error.issues[0]?.message ?? "Invalid row."}`);
      return [];
    }

    return [parsed.data];
  });

  return { entries, errors };
}

function formatCsvCell(value: string | number | null): string {
  if (value == null) {
    return "";
  }

  const stringValue = String(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);

  return rows.filter((parsedRow) => parsedRow.some((value) => value.trim() !== ""));
}
