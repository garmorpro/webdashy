import path from "path";
import { Document, Page, View, Text, Image, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";

/**
 * Renders the client-facing invoice PDF. Deliberately built with
 * @react-pdf/renderer (pure JS, no headless-browser dependency) rather than
 * a Puppeteer/Chromium screenshot approach — this project has been burned
 * more than once by fragile native/binary Docker dependencies (see the
 * Prisma CLI symlink incident in DEPLOYMENT history), and a Chromium binary
 * in a slim Docker image is exactly that kind of risk. The tradeoff is that
 * this layout is redrawn in react-pdf's own primitives rather than reusing
 * the mockup's actual HTML/CSS — kept visually close on purpose, but it's a
 * separate implementation, not a screenshot of it.
 */

Font.registerHyphenationCallback((word) => [word]);

const NAVY = "#1b2951";
const INK_SOFT = "#334155";
const MUTED = "#64748b";
const FAINT = "#94a3b8";
const LINE = "#e2e8f0";
const ACCENT = "#a4ff4f";
const SUCCESS = "#059669";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, color: INK_SOFT, fontFamily: "Helvetica" },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  logo: { width: 130, height: 24 },
  tagline: { fontSize: 8, color: FAINT, marginTop: 6 },
  invTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: NAVY, letterSpacing: 2 },
  invNum: { fontSize: 9, color: MUTED, marginTop: 4 },
  statusPill: {
    marginTop: 8,
    alignSelf: "flex-end",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  statusPaid: { backgroundColor: "#ecfdf5", color: SUCCESS },
  statusSent: { backgroundColor: "#eff6ff", color: "#1d4ed8" },
  statusDraft: { backgroundColor: "#f1f5f9", color: "#334155" },
  parties: { flexDirection: "row", marginBottom: 26, gap: 24 },
  partyCol: { flex: 1 },
  kicker: { fontSize: 7, fontFamily: "Helvetica-Bold", color: FAINT, letterSpacing: 1, marginBottom: 6 },
  partyName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: NAVY },
  partyLine: { fontSize: 9, color: INK_SOFT, marginTop: 2, lineHeight: 1.5 },
  dates: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: LINE,
    paddingVertical: 12,
    marginBottom: 24,
  },
  dateCol: { flex: 1 },
  dateVal: { fontSize: 10, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 2 },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderColor: NAVY,
    paddingBottom: 8,
    marginBottom: 2,
  },
  th: { fontSize: 7, fontFamily: "Helvetica-Bold", color: FAINT, letterSpacing: 0.5 },
  tr: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderColor: LINE },
  tdDesc: { fontSize: 10, fontFamily: "Helvetica-Bold", color: NAVY },
  tdAmt: { fontSize: 10, color: INK_SOFT, textAlign: "right" },
  totals: { alignItems: "flex-end", marginTop: 12 },
  totalsBox: { width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalsDueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 2,
    borderColor: NAVY,
    paddingTop: 10,
    marginTop: 4,
  },
  totalsDueLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: NAVY },
  totalsDueVal: { fontSize: 12, fontFamily: "Helvetica-Bold", color: NAVY },
  payBox: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: LINE, borderRadius: 6, padding: 16, marginTop: 30 },
  payText: { fontSize: 9, color: INK_SOFT, lineHeight: 1.6 },
  footer: { marginTop: 34, paddingTop: 16, borderTopWidth: 1, borderColor: LINE, alignItems: "center" },
  thanks: { fontSize: 11, fontFamily: "Helvetica-Bold", color: NAVY },
  terms: { fontSize: 8, color: FAINT, marginTop: 6, textAlign: "center", maxWidth: 320 },
  bar: { width: 32, height: 3, backgroundColor: ACCENT, borderRadius: 2, marginTop: 12 },
});

export type InvoicePdfData = {
  invoiceNumber: string;
  status: "DRAFT" | "SENT" | "PAID";
  issueDate: Date;
  dueDate: Date | null;
  terms: string;
  fromName: string;
  fromAddress: string | null;
  billToName: string;
  billToContactName: string;
  billToEmail: string;
  lineItems: { description: string; amount: number }[];
  taxAmount: number;
  paymentInstructions: string | null;
  notes: string | null;
};

const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const subtotal = data.lineItems.reduce((sum, item) => sum + item.amount, 0);
  const total = subtotal + data.taxAmount;
  const statusStyle =
    data.status === "PAID" ? styles.statusPaid : data.status === "SENT" ? styles.statusSent : styles.statusDraft;
  const logoPath = path.join(process.cwd(), "public/brand/wordmark.png");

  return (
    <Document title={`Invoice ${data.invoiceNumber}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.topRow}>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop */}
            <Image src={logoPath} style={styles.logo} />
            <Text style={styles.tagline}>Website Design &amp; Development</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.invTitle}>INVOICE</Text>
            <Text style={styles.invNum}>{data.invoiceNumber}</Text>
            <Text style={[styles.statusPill, statusStyle]}>
              {data.status === "PAID" ? "Paid" : data.status === "SENT" ? "Sent" : "Draft"}
            </Text>
          </View>
        </View>

        <View style={styles.parties}>
          <View style={styles.partyCol}>
            <Text style={styles.kicker}>FROM</Text>
            <Text style={styles.partyName}>{data.fromName}</Text>
            {data.fromAddress ? <Text style={styles.partyLine}>{data.fromAddress}</Text> : null}
          </View>
          <View style={styles.partyCol}>
            <Text style={styles.kicker}>BILL TO</Text>
            <Text style={styles.partyName}>{data.billToName}</Text>
            <Text style={styles.partyLine}>
              Attn: {data.billToContactName}
              {"\n"}
              {data.billToEmail}
            </Text>
          </View>
        </View>

        <View style={styles.dates}>
          <View style={styles.dateCol}>
            <Text style={styles.kicker}>ISSUE DATE</Text>
            <Text style={styles.dateVal}>{dateFmt.format(data.issueDate)}</Text>
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.kicker}>DUE DATE</Text>
            <Text style={styles.dateVal}>{data.dueDate ? dateFmt.format(data.dueDate) : "—"}</Text>
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.kicker}>TERMS</Text>
            <Text style={styles.dateVal}>{data.terms}</Text>
          </View>
        </View>

        <View style={styles.tableHead}>
          <Text style={[styles.th, { flex: 3 }]}>DESCRIPTION</Text>
          <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>AMOUNT</Text>
        </View>
        {data.lineItems.map((item, i) => (
          <View key={i} style={styles.tr}>
            <Text style={[styles.tdDesc, { flex: 3 }]}>{item.description}</Text>
            <Text style={[styles.tdAmt, { flex: 1 }]}>{money(item.amount)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text>Subtotal</Text>
              <Text>{money(subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text>Tax</Text>
              <Text>{money(data.taxAmount)}</Text>
            </View>
            <View style={styles.totalsDueRow}>
              <Text style={styles.totalsDueLabel}>Total Due</Text>
              <Text style={styles.totalsDueVal}>{money(total)}</Text>
            </View>
          </View>
        </View>

        {data.paymentInstructions ? (
          <View style={styles.payBox}>
            <Text style={styles.kicker}>PAYMENT</Text>
            <Text style={styles.payText}>{data.paymentInstructions}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.thanks}>Thank you for choosing {data.fromName}!</Text>
          <Text style={styles.terms}>
            {data.notes || `Payment due within the terms above. Questions about this invoice? Just reply to the email it was sent with.`}
          </Text>
          <View style={styles.bar} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}
