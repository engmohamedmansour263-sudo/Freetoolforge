import { PDFDocument } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export type PdfExtraction = { text: string; pageCount: number; pages: Array<{ page: number; text: string }> };

export async function inspectPdf(bytes: Buffer) {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
  const [title, author, subject, creator, producer, keywords, creationDate, modificationDate] = [
    pdf.getTitle(), pdf.getAuthor(), pdf.getSubject(), pdf.getCreator(), pdf.getProducer(),
    pdf.getKeywords(), pdf.getCreationDate(), pdf.getModificationDate(),
  ];
  return {
    pageCount: pdf.getPageCount(),
    pageSizes: pdf.getPages().map((page, index) => ({ page: index + 1, width: Math.round(page.getWidth()), height: Math.round(page.getHeight()) })),
    metadata: { title, author, subject, creator, producer, keywords, creationDate: creationDate?.toISOString() ?? null, modificationDate: modificationDate?.toISOString() ?? null },
    encrypted: false,
  };
}

export async function extractPdfText(bytes: Buffer): Promise<PdfExtraction> {
  const task = getDocument({ data: new Uint8Array(bytes), useSystemFonts: true, isEvalSupported: false, disableFontFace: true });
  const doc = await task.promise;
  try {
    const pages: Array<{ page: number; text: string }> = [];
    let fullText = '';
    const pagesToProcess = Math.min(doc.numPages, 200);
    for (let pageNumber = 1; pageNumber <= pagesToProcess; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items.map((item) => 'str' in item ? item.str : '').filter(Boolean).join(' ').replace(/[ \t]+/g, ' ').trim();
      pages.push({ page: pageNumber, text });
      if (fullText.length < 100_000) fullText += `${fullText ? '\n\n' : ''}[صفحة ${pageNumber}]\n${text}`.slice(0, 100_000 - fullText.length);
    }
    return { text: fullText, pageCount: doc.numPages, pages, processedPages: pagesToProcess, truncated: doc.numPages > pagesToProcess || fullText.length >= 100_000 };
  } finally { await doc.destroy(); }
}
