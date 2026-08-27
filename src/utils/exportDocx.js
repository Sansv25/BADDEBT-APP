import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

/**
 * Generates a DOCX Blob from the provided active row array.
 * Headings (FAT Codes) get styled with Heading2 and clean spacing.
 * Regular entries get styled as clean 11pt paragraphs.
 */
export const generateDocxBlob = async (rows) => {
  const children = [];

  rows.forEach((row) => {
    if (row.isHeading) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 120 },
          children: [
            new TextRun({
              text: row.text,
              bold: true,
              size: 28, // 14pt
              color: '1E293B',
            }),
          ],
        })
      );
    } else {
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 120 },
          children: [
            new TextRun({
              text: row.text,
              size: 22, // 11pt
              color: '334155',
            }),
          ],
        })
      );
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: children.length > 0 ? children : [
          new Paragraph({
            text: 'Data List Pelanggan Kosong',
            spacing: { before: 200, after: 200 },
          })
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
};

/**
 * Triggers browser download for generated .docx file
 */
export const downloadDocx = async (rows, filename = 'List_Pelanggan_Bad_Debt.docx') => {
  const blob = await generateDocxBlob(rows);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
