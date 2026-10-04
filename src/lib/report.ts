import { jsPDF } from "jspdf";
import { EVENT, OPTION_LETTERS, QUIZ_TOTAL } from "@/data/config";
import { QUIZ_QUESTIONS } from "@/data/quizQuestions";
import { SEQ_TOTAL, SEQUENCE_STAGES } from "@/data/sequenceQuestions";

/**
 * The end-of-session Q&A report — a real PDF built right in the browser
 * (no server, works offline). Players download it from /play the moment the
 * operator finishes the game; the operator can grab the same file from the
 * Notes tab.
 */

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 16;
const MARGIN_R = 16;
const MARGIN_B = 20;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

const INK: [number, number, number] = [14, 14, 14];
const SUN: [number, number, number] = [255, 210, 63];
const COBALT: [number, number, number] = [45, 108, 255];
const MUTED: [number, number, number] = [110, 110, 110];
const WHITE: [number, number, number] = [255, 255, 255];

/**
 * jsPDF's built-in fonts are Latin-1 only — normalise the fancy typographic
 * characters used in the question pack so nothing renders as a tofu box.
 */
function clean(text: string) {
  return text
    .replace(/₹/g, "Rs. ")
    .replace(/→/g, " -> ")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[★✦•]/g, "*")
    .replace(/✓/g, "v ")
    .replace(/✗/g, "x ")
    .replace(/·/g, " - ")
    .replace(/[^\x20-\x7E]/g, "");
}

/** Builds the full report document — exported so tests/tools can inspect it. */
export function buildReport(): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 0;

  function footer(pageNumber: number) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `${EVENT.cell} - ${EVENT.university} - Startup School`,
      MARGIN_L,
      PAGE_H - 10,
    );
    doc.text(`${pageNumber}`, PAGE_W - MARGIN_R, PAGE_H - 10, {
      align: "right",
    });
  }

  function ensure(height: number) {
    if (y + height > PAGE_H - MARGIN_B) {
      doc.addPage();
      y = 22;
    }
  }

  /** Wrapped paragraph writer with automatic page breaks. */
  function paragraph(
    text: string,
    opts: {
      size?: number;
      style?: "normal" | "bold" | "italic";
      color?: [number, number, number];
      indent?: number;
      leading?: number;
      after?: number;
    } = {},
  ) {
    const {
      size = 10,
      style = "normal",
      color = INK,
      indent = 0,
      leading = size * 0.45 + 1.2,
      after = 1.8,
    } = opts;
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const wrapped = doc.splitTextToSize(
      clean(text),
      CONTENT_W - indent,
    ) as string[];
    for (const line of wrapped) {
      ensure(leading);
      doc.text(line, MARGIN_L + indent, y);
      y += leading;
    }
    y += after;
  }

  /** Solid section band, e.g. "GAME 01 - SITUATION QUIZ". */
  function sectionBand(title: string, subtitle: string) {
    ensure(22);
    y += 3;
    doc.setFillColor(...INK);
    doc.rect(MARGIN_L, y - 5.6, CONTENT_W, 8.6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...SUN);
    doc.text(clean(title), MARGIN_L + 3, y);
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    const sub = clean(subtitle);
    doc.text(sub, PAGE_W - MARGIN_R - 3, y, { align: "right" });
    y += 11;
  }

  /* ---------------- cover header ---------------- */
  doc.setFillColor(...INK);
  doc.rect(0, 0, PAGE_W, 34, "F");
  doc.setFillColor(...SUN);
  doc.rect(0, 34, PAGE_W, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.setTextColor(...SUN);
  doc.text("STARTUP SCHOOL", MARGIN_L, 17);
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text("Q&A REPORT", PAGE_W - MARGIN_R, 17, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text(clean(EVENT.cell), MARGIN_L, 25);
  doc.text(clean(EVENT.university), MARGIN_L, 30);
  doc.text(
    new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    PAGE_W - MARGIN_R,
    30,
    { align: "right" },
  );

  y = 48;
  paragraph(
    `Every question, every answer, every teaching note from tonight's session: ` +
      `Game 01 - Situation Quiz (${QUIZ_TOTAL} questions) and Game 02 - Sequence ` +
      `Ladder (${SEQ_TOTAL} stages, easy to brutal). Keep it, revise it, build.`,
    { size: 10, color: MUTED, after: 4 },
  );

  /* ---------------- Game 01 ---------------- */
  sectionBand("GAME 01 - SITUATION QUIZ", `${QUIZ_TOTAL} QUESTIONS`);

  for (const q of QUIZ_QUESTIONS) {
    ensure(30);
    paragraph(`Q${q.id}. ${q.prompt}`, {
      size: 11,
      style: "bold",
      after: 1.2,
    });
    paragraph(
      `Answer: ${OPTION_LETTERS[q.correct]}) ${q.options[q.correct]}`,
      { size: 10, style: "bold", color: COBALT, indent: 4, after: 1 },
    );
    paragraph(`Note: ${q.why}`, {
      size: 9.5,
      style: "italic",
      color: MUTED,
      indent: 4,
      after: 4,
    });
    ensure(4);
    doc.setDrawColor(210, 205, 192);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_L, y - 1.5, PAGE_W - MARGIN_R, y - 1.5);
    y += 1;
  }

  /* ---------------- Game 02 ---------------- */
  sectionBand(
    "GAME 02 - SEQUENCE LADDER",
    `${SEQ_TOTAL} STAGES: EASY -> BRUTAL`,
  );

  for (const s of SEQUENCE_STAGES) {
    ensure(34);
    paragraph(`Stage ${s.stage} (${s.label}) - ${s.title}`, {
      size: 11,
      style: "bold",
      after: 1.2,
    });
    paragraph(s.prompt, { size: 10, after: 1.4 });
    s.steps.forEach((step, i) => {
      paragraph(`${i + 1}. ${step}`, { size: 10, indent: 4, after: 0.8 });
    });
    y += 1.4;
    paragraph(`Note: ${s.why}`, {
      size: 9.5,
      style: "italic",
      color: MUTED,
      indent: 4,
      after: 4,
    });
    ensure(4);
    doc.setDrawColor(210, 205, 192);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_L, y - 1.5, PAGE_W - MARGIN_R, y - 1.5);
    y += 1;
  }

  ensure(18);
  y += 4;
  paragraph(
    `${EVENT.tagline}. Brought to you by the ${EVENT.cell}, ${EVENT.university}.`,
    { size: 9.5, style: "bold", color: MUTED },
  );

  const total = doc.getNumberOfPages();
  for (let page = 2; page <= total; page++) {
    doc.setPage(page);
    footer(page);
  }

  return doc;
}

/** Generates the report and hands it to the browser as a download. */
export function downloadReport() {
  buildReport().save("startup-school-qa-report.pdf");
}
