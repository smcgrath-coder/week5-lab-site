import { describe, expect, it } from "vitest";
import { parseMarkdownBlocks } from "./markdown";

describe("parseMarkdownBlocks — plain text", () => {
  it("wraps plain text with no markdown syntax as a single paragraph span", () => {
    const blocks = parseMarkdownBlocks("Metformin lowers blood sugar.");
    expect(blocks).toEqual([
      {
        type: "paragraph",
        spans: [{ text: "Metformin lowers blood sugar.", bold: false, italic: false, code: false }],
      },
    ]);
  });

  it("returns an empty array for empty text", () => {
    expect(parseMarkdownBlocks("")).toEqual([]);
  });
});

describe("parseMarkdownBlocks — inline emphasis", () => {
  it("marks bold and italic spans within a paragraph", () => {
    const blocks = parseMarkdownBlocks("Take **500mg** *twice daily* with food.");
    expect(blocks).toEqual([
      {
        type: "paragraph",
        spans: [
          { text: "Take ", bold: false, italic: false, code: false },
          { text: "500mg", bold: true, italic: false, code: false },
          { text: " ", bold: false, italic: false, code: false },
          { text: "twice daily", bold: false, italic: true, code: false },
          { text: " with food.", bold: false, italic: false, code: false },
        ],
      },
    ]);
  });

  it("marks inline code spans", () => {
    const blocks = parseMarkdownBlocks("Use the `metformin` order set.");
    expect(blocks).toEqual([
      {
        type: "paragraph",
        spans: [
          { text: "Use the ", bold: false, italic: false, code: false },
          { text: "metformin", bold: false, italic: false, code: true },
          { text: " order set.", bold: false, italic: false, code: false },
        ],
      },
    ]);
  });
});

describe("parseMarkdownBlocks — headings", () => {
  it("captures the heading level and text", () => {
    const blocks = parseMarkdownBlocks("## Dosing\nSome text.");
    expect(blocks[0]).toEqual({
      type: "heading",
      level: 2,
      spans: [{ text: "Dosing", bold: false, italic: false, code: false }],
    });
  });
});

describe("parseMarkdownBlocks — lists", () => {
  it("captures an unordered list as an array of item span-arrays", () => {
    const blocks = parseMarkdownBlocks("- First step\n- Second step with **emphasis**");
    expect(blocks).toEqual([
      {
        type: "list",
        ordered: false,
        items: [
          [{ text: "First step", bold: false, italic: false, code: false }],
          [
            { text: "Second step with ", bold: false, italic: false, code: false },
            { text: "emphasis", bold: true, italic: false, code: false },
          ],
        ],
      },
    ]);
  });

  it("captures an ordered list", () => {
    const blocks = parseMarkdownBlocks("1. First\n2. Second");
    expect(blocks[0].type).toBe("list");
    expect(blocks[0].ordered).toBe(true);
    expect(blocks[0].items).toHaveLength(2);
  });
});

describe("parseMarkdownBlocks — code blocks", () => {
  it("captures a fenced code block verbatim", () => {
    const blocks = parseMarkdownBlocks("```\nconst x = 1;\n```");
    expect(blocks).toEqual([{ type: "code", text: "const x = 1;" }]);
  });
});

describe("parseMarkdownBlocks — multiple paragraphs", () => {
  it("produces one block per paragraph, in order", () => {
    const blocks = parseMarkdownBlocks("First paragraph.\n\nSecond paragraph.");
    expect(blocks.map((b) => b.type)).toEqual(["paragraph", "paragraph"]);
    expect(blocks[0].spans[0].text).toBe("First paragraph.");
    expect(blocks[1].spans[0].text).toBe("Second paragraph.");
  });
});
