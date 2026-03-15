import { Chunk, ChunkerOptions, estimateTokens } from "./types";
import { chunkRecursive } from "./recursive";

interface MarkdownSection {
  heading: string;
  headingText: string;
  level: number;
  body: string;
  path: string;
}

export function parseMarkdownSections(content: string): MarkdownSection[] {
  const lines = content.split("\n");
  const sections: MarkdownSection[] = [];
  const headingStack: { text: string; level: number }[] = [];

  let currentHeading = "";
  let currentHeadingText = "";
  let currentLevel = 0;
  let currentBody: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)/);

    if (headerMatch) {
      // Save previous section
      if (currentBody.length > 0 || currentHeading) {
        sections.push({
          heading: currentHeading,
          headingText: currentHeadingText,
          level: currentLevel,
          body: currentBody.join("\n").trim(),
          path: headingStack
            .map((h) => `${"#".repeat(h.level)} ${h.text}`)
            .join(" > "),
        });
      }

      const level = headerMatch[1].length;
      const text = headerMatch[2].trim();

      // Update heading stack (pop headers at same or deeper level)
      while (
        headingStack.length > 0 &&
        headingStack[headingStack.length - 1].level >= level
      ) {
        headingStack.pop();
      }
      headingStack.push({ text, level });

      currentHeading = line;
      currentHeadingText = text;
      currentLevel = level;
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  // Save last section
  if (currentBody.length > 0 || currentHeading) {
    sections.push({
      heading: currentHeading,
      headingText: currentHeadingText,
      level: currentLevel,
      body: currentBody.join("\n").trim(),
      path: headingStack
        .map((h) => `${"#".repeat(h.level)} ${h.text}`)
        .join(" > "),
    });
  }

  return sections;
}

export function chunkMarkdown(
  content: string,
  opts: ChunkerOptions
): Chunk[] {
  const chunks: Chunk[] = [];
  const sections = parseMarkdownSections(content);

  for (const section of sections) {
    const sectionContent = section.heading
      ? `${section.heading}\n\n${section.body}`
      : section.body;

    if (!sectionContent.trim()) continue;

    if (estimateTokens(sectionContent) <= (opts.maxChunkSize || 400)) {
      chunks.push({
        content: sectionContent.trim(),
        metadata: {
          heading: section.headingText,
          section_path: section.path,
          chunk_type: "text",
        },
      });
    } else {
      // Section too large — use recursive chunker on the body
      const subChunks = chunkRecursive(section.body, opts);

      subChunks.forEach((sub, i) => {
        chunks.push({
          content:
            i === 0
              ? `${section.heading}\n\n${sub.content}`.trim()
              : sub.content,
          metadata: {
            ...sub.metadata,
            heading: section.headingText,
            section_path: section.path,
          },
        });
      });
    }
  }

  return chunks.filter((c) => c.content.length > 10);
}
