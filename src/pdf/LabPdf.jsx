import { Document, Page, pdf, StyleSheet, Text, View } from "@react-pdf/renderer";
import { buildPdfData } from "./buildPdfData";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontSize: 10.5,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    fontSize: 8,
    color: "#888888",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#cccccc",
    paddingTop: 6,
  },
  pageNumber: {
    position: "absolute",
    bottom: 24,
    right: 44,
    fontSize: 8,
    color: "#888888",
  },
  coverTitle: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  coverSub: { fontSize: 11, color: "#555555", marginBottom: 28 },
  coverRow: { fontSize: 11, marginBottom: 7, flexDirection: "row" },
  coverLabel: { fontWeight: 700, width: 110 },
  sectionHeading: {
    fontSize: 15,
    fontWeight: 700,
    marginTop: 18,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
    paddingBottom: 4,
  },
  subheading: { fontSize: 12.5, fontWeight: 700, marginTop: 14, marginBottom: 6, color: "#5b2e91" },
  conversationLabel: { fontSize: 11, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  emptyConversation: { fontSize: 9.5, fontStyle: "italic", color: "#888888", marginBottom: 10 },
  turnStudent: { backgroundColor: "#f4f3ec", borderRadius: 4, padding: 8, marginBottom: 6 },
  turnModel: { backgroundColor: "#f1e9fb", borderRadius: 4, padding: 8, marginBottom: 6 },
  turnSpeaker: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#666666", marginBottom: 3 },
  turnText: { fontSize: 10, lineHeight: 1.4 },
  reflectionPrompt: { fontSize: 10.5, fontWeight: 700, marginTop: 10, marginBottom: 3 },
  reflectionAnswer: { fontSize: 10, lineHeight: 1.4, marginBottom: 8 },
});

function PageFooter() {
  return (
    <>
      <Text style={styles.footer} fixed>
        MHI 289A · Week 5 Lab Record · UC Davis School of Medicine
      </Text>
      <Text
        style={styles.pageNumber}
        fixed
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </>
  );
}

function ConversationBlock({ block }) {
  return (
    <View>
      <Text style={styles.conversationLabel}>{block.label}</Text>
      {block.turns.length === 0 && <Text style={styles.emptyConversation}>(no messages)</Text>}
      {block.turns.map((turn, i) => (
        <View key={i} style={turn.speaker === "Student" ? styles.turnStudent : styles.turnModel} wrap={false}>
          <Text style={styles.turnSpeaker}>{turn.speaker}</Text>
          <Text style={styles.turnText}>{turn.text}</Text>
        </View>
      ))}
    </View>
  );
}

function ReflectionBlock({ block }) {
  return (
    <View wrap={false}>
      <Text style={styles.reflectionPrompt}>{block.prompt}</Text>
      <Text style={styles.reflectionAnswer}>{block.answer}</Text>
    </View>
  );
}

function Block({ block }) {
  if (block.type === "subheading") return <Text style={styles.subheading}>{block.text}</Text>;
  if (block.type === "conversation") return <ConversationBlock block={block} />;
  return <ReflectionBlock block={block} />;
}

export function LabPdf({ data }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.coverTitle}>Week 5 Lab Record</Text>
        <Text style={styles.coverSub}>Working With AI — Prompting, Breaking, and Grounding</Text>
        <View style={styles.coverRow}>
          <Text style={styles.coverLabel}>Student</Text>
          <Text>{data.cover.name || "—"}</Text>
        </View>
        <View style={styles.coverRow}>
          <Text style={styles.coverLabel}>Lane</Text>
          <Text>{data.cover.lane || "—"}</Text>
        </View>
        <View style={styles.coverRow}>
          <Text style={styles.coverLabel}>Date</Text>
          <Text>{data.cover.date}</Text>
        </View>
        <View style={styles.coverRow}>
          <Text style={styles.coverLabel}>Models used</Text>
          <Text>{data.cover.models.join(", ") || "None"}</Text>
        </View>
        <View style={styles.coverRow}>
          <Text style={styles.coverLabel}>Submitted</Text>
          <Text>{data.cover.timestamp}</Text>
        </View>
        <PageFooter />
      </Page>

      <Page size="LETTER" style={styles.page} wrap>
        {data.labSections.map((section) => (
          <View key={section.heading}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </View>
        ))}
        <PageFooter />
      </Page>
    </Document>
  );
}

export async function generatePdfBlob(state) {
  const data = buildPdfData(state);
  return pdf(<LabPdf data={data} />).toBlob();
}
