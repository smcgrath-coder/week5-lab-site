import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { parseMarkdownBlocks } from "./markdown";

const styles = StyleSheet.create({
  paragraph: { fontSize: 10, lineHeight: 1.4, marginBottom: 6 },
  heading1: { fontSize: 12.5, fontWeight: 700, marginBottom: 4, marginTop: 2 },
  heading2: { fontSize: 11.5, fontWeight: 700, marginBottom: 4, marginTop: 2 },
  headingRest: { fontSize: 10.5, fontWeight: 700, marginBottom: 4, marginTop: 2 },
  listRow: { flexDirection: "row", marginBottom: 3 },
  listBullet: { width: 14, fontSize: 10 },
  listItemText: { flex: 1, fontSize: 10, lineHeight: 1.4 },
  code: {
    fontFamily: "Courier",
    fontSize: 9,
    backgroundColor: "#f4f3ec",
    borderRadius: 3,
    padding: 6,
    marginBottom: 6,
  },
  blockquote: {
    borderLeftWidth: 2,
    borderLeftColor: "#cccccc",
    paddingLeft: 8,
    marginBottom: 6,
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
    marginVertical: 6,
  },
  bold: { fontWeight: 700 },
  italic: { fontStyle: "italic" },
  inlineCode: { fontFamily: "Courier", fontSize: 9.5 },
});

function Spans({ spans }) {
  return spans.map((s, i) => {
    const style = [s.bold && styles.bold, s.italic && styles.italic, s.code && styles.inlineCode].filter(
      Boolean
    );
    return (
      <Text key={i} style={style}>
        {s.text}
      </Text>
    );
  });
}

function headingStyle(level) {
  if (level === 1) return styles.heading1;
  if (level === 2) return styles.heading2;
  return styles.headingRest;
}

export function MarkdownPdfText({ text }) {
  const blocks = parseMarkdownBlocks(text);

  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <Text key={i} style={headingStyle(block.level)}>
                <Spans spans={block.spans} />
              </Text>
            );
          case "paragraph":
            return (
              <Text key={i} style={styles.paragraph}>
                <Spans spans={block.spans} />
              </Text>
            );
          case "list":
            return (
              <View key={i}>
                {block.items.map((itemSpans, j) => (
                  <View key={j} style={styles.listRow} wrap={false}>
                    <Text style={styles.listBullet}>{block.ordered ? `${j + 1}.` : "•"}</Text>
                    <Text style={styles.listItemText}>
                      <Spans spans={itemSpans} />
                    </Text>
                  </View>
                ))}
              </View>
            );
          case "code":
            return (
              <Text key={i} style={styles.code}>
                {block.text}
              </Text>
            );
          case "blockquote":
            return (
              <View key={i} style={styles.blockquote}>
                <Text style={styles.paragraph}>
                  <Spans spans={block.spans} />
                </Text>
              </View>
            );
          case "hr":
            return <View key={i} style={styles.hr} />;
          default:
            return null;
        }
      })}
    </>
  );
}
