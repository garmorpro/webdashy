import path from "path";
import { Document, Page, View, Text, Image, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";
import { QUESTIONNAIRE_SECTIONS, formatFieldValue, type QuestionnaireAnswers } from "@/lib/questionnaire-schema";

/**
 * Renders the Design Questionnaire responses to PDF — same
 * @react-pdf/renderer approach as invoice-pdf.tsx, for the same reason
 * (pure JS, no headless-browser/Chromium dependency to keep working in a
 * slim Docker image — see that file's own comment). Redraws the admin
 * "View Responses" dialog's layout in react-pdf primitives rather than
 * reusing its HTML/CSS — kept visually close on purpose (same short-field
 * grid / long-field accent-bar distinction, driven by the same field
 * `type` from questionnaire-schema.ts), but it's a separate implementation.
 */

Font.registerHyphenationCallback((word) => [word]);

const NAVY = "#1b2951";
const INK_SOFT = "#334155";
const MUTED = "#64748b";
const FAINT = "#94a3b8";
const LINE = "#e2e8f0";
const ACCENT = "#a4ff4f";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 9.5, color: INK_SOFT, fontFamily: "Helvetica" },
  logo: { width: 120, height: 22 },
  kicker: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#4c6b1f", letterSpacing: 1.5, marginTop: 22 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 4 },
  meta: { fontSize: 9, color: MUTED, marginTop: 4 },
  divider: { height: 1, backgroundColor: LINE, marginTop: 18, marginBottom: 4 },
  sectionWrap: { marginTop: 22 },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: FAINT, letterSpacing: 1, marginBottom: 10 },
  shortGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 12, columnGap: 16 },
  shortField: { width: "31%" },
  shortLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: MUTED, letterSpacing: 0.3 },
  shortValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 2 },
  longFields: { flexDirection: "column", rowGap: 12 },
  longField: { flexDirection: "row" },
  longBar: { width: 2.5, backgroundColor: ACCENT, borderRadius: 1.5, marginRight: 10, alignSelf: "stretch" },
  longLabel: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 3 },
  longValue: { fontSize: 9.5, color: INK_SOFT, lineHeight: 1.5 },
  notAnswered: { fontSize: 9, color: FAINT, fontStyle: "italic" },
});

export type QuestionnairePdfData = {
  businessName: string;
  submittedAt: Date;
  answers: QuestionnaireAnswers;
};

const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

function QuestionnaireDocument({ data }: { data: QuestionnairePdfData }) {
  const logoPath = path.join(process.cwd(), "public/brand/wordmark.png");

  return (
    <Document title={`${data.businessName} — Design Questionnaire`}>
      <Page size="LETTER" style={styles.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop */}
        <Image src={logoPath} style={styles.logo} />
        <Text style={styles.kicker}>DESIGN QUESTIONNAIRE</Text>
        <Text style={styles.title}>{data.businessName}</Text>
        <Text style={styles.meta}>Submitted {dateFmt.format(data.submittedAt)}</Text>
        <View style={styles.divider} />

        {QUESTIONNAIRE_SECTIONS.map((section) => {
          const shortFields = section.fields.filter((f) => f.type !== "textarea");
          const longFields = section.fields.filter((f) => f.type === "textarea");

          return (
            <View key={section.id} style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>

              {shortFields.length > 0 ? (
                <View style={styles.shortGrid}>
                  {shortFields.map((field) => {
                    const raw = data.answers[field.key]?.trim();
                    const value = raw ? formatFieldValue(field, raw) : "";
                    return (
                      <View key={field.key} style={styles.shortField} wrap={false}>
                        <Text style={styles.shortLabel}>{field.label.toUpperCase()}</Text>
                        <Text style={value ? styles.shortValue : styles.notAnswered}>
                          {value || "Not answered"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {longFields.length > 0 ? (
                <View style={[styles.longFields, shortFields.length > 0 ? { marginTop: 14 } : undefined]}>
                  {longFields.map((field) => {
                    const value = data.answers[field.key]?.trim();
                    return (
                      <View key={field.key} style={styles.longField} wrap={false}>
                        <View style={styles.longBar} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.longLabel}>{field.label}</Text>
                          <Text style={value ? styles.longValue : styles.notAnswered}>
                            {value || "Not answered"}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}

export async function renderQuestionnairePdf(data: QuestionnairePdfData): Promise<Buffer> {
  return renderToBuffer(<QuestionnaireDocument data={data} />);
}
