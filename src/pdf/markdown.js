import { marked } from "marked";

function span(text, { bold = false, italic = false, code = false } = {}) {
  return { text, bold, italic, code };
}

function flattenInline(tokens, style = {}) {
  const spans = [];
  for (const t of tokens ?? []) {
    switch (t.type) {
      case "strong":
        spans.push(...flattenInline(t.tokens, { ...style, bold: true }));
        break;
      case "em":
        spans.push(...flattenInline(t.tokens, { ...style, italic: true }));
        break;
      case "codespan":
        spans.push(span(t.text, { ...style, code: true }));
        break;
      case "link":
      case "strong_em":
        spans.push(...flattenInline(t.tokens, style));
        break;
      case "br":
        spans.push(span("\n", style));
        break;
      default:
        if (t.text) spans.push(span(t.text, style));
    }
  }
  return spans;
}

function inlineTokensOf(token) {
  if (token.tokens) return token.tokens;
  return [{ type: "text", text: token.text ?? "" }];
}

function listItemSpans(item) {
  // Tight list items: item.tokens is inline content directly.
  // Loose list items: item.tokens contains a 'text' or 'paragraph' wrapper.
  const inner = item.tokens ?? [];
  const wrapper = inner.find((t) => t.type === "text" || t.type === "paragraph");
  if (wrapper) return flattenInline(inlineTokensOf(wrapper));
  return flattenInline(inner);
}

export function parseMarkdownBlocks(text) {
  if (!text) return [];

  const tokens = marked.lexer(text);
  const blocks = [];

  for (const t of tokens) {
    switch (t.type) {
      case "heading":
        blocks.push({ type: "heading", level: t.depth, spans: flattenInline(inlineTokensOf(t)) });
        break;
      case "paragraph":
      case "text":
        blocks.push({ type: "paragraph", spans: flattenInline(inlineTokensOf(t)) });
        break;
      case "list":
        blocks.push({
          type: "list",
          ordered: Boolean(t.ordered),
          items: t.items.map(listItemSpans),
        });
        break;
      case "code":
        blocks.push({ type: "code", text: t.text });
        break;
      case "blockquote":
        blocks.push({ type: "blockquote", spans: flattenInline(inlineTokensOf(t)) });
        break;
      case "hr":
        blocks.push({ type: "hr" });
        break;
      case "space":
        break;
      default:
        if (t.text) blocks.push({ type: "paragraph", spans: [span(t.text)] });
    }
  }

  return blocks;
}
