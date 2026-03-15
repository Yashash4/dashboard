/**
 * File processors for KB document ingestion.
 * Converts DOCX, XLSX, PPTX to plain text / markdown.
 */

/**
 * Process a binary file buffer into plain text for indexing.
 * Supports DOCX (mammoth), XLSX (xlsx), PPTX (jszip XML parsing).
 * Falls back to UTF-8 decode for unknown types.
 */
export async function processFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  switch (ext) {
    case "docx":
      return processDocx(buffer);
    case "xlsx":
    case "xls":
      return processXlsx(buffer);
    case "pptx":
      return processPptx(buffer);
    default:
      // If MIME type hints at one of our supported types, try that
      if (
        mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        return processDocx(buffer);
      }
      if (
        mimeType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        mimeType === "application/vnd.ms-excel"
      ) {
        return processXlsx(buffer);
      }
      if (
        mimeType ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      ) {
        return processPptx(buffer);
      }
      // Fallback to raw text
      return buffer.toString("utf-8");
  }
}

async function processDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

async function processXlsx(buffer: Buffer): Promise<string> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheets: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv: string = XLSX.utils.sheet_to_csv(sheet);
    if (csv.trim()) {
      sheets.push(`## Sheet: ${sheetName}\n\n${csv}`);
    }
  }

  return sheets.join("\n\n---\n\n");
}

async function processPptx(buffer: Buffer): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);

  const slides: string[] = [];
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
      return numA - numB;
    });

  for (const slidePath of slideFiles) {
    const xml = await zip.files[slidePath].async("text");
    // Extract all <a:t> text elements from PPTX XML
    const textParts: string[] = [];
    const regex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(xml)) !== null) {
      const text = match[1].trim();
      if (text) textParts.push(text);
    }

    if (textParts.length > 0) {
      const slideNum = slidePath.match(/slide(\d+)/)?.[1] || "?";
      slides.push(`## Slide ${slideNum}\n\n${textParts.join("\n")}`);
    }
  }

  return slides.join("\n\n---\n\n");
}
