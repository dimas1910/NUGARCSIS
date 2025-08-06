import { NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import { extractDoacaoInfo, extractComparisonInfo, compareData } from '../../../lib/pdf-utils'; // Adjust path as needed

export async function POST(request) {
  try {
    const formData = await request.formData();
    const pdf1File = formData.get('pdf1');
    const pdf2File = formData.get('pdf2');

    if (!pdf1File || !pdf2File) {
      return NextResponse.json({ error: 'Both PDF files are required.' }, { status: 400 });
    }

    // Convert File to Buffer
    const pdf1Buffer = Buffer.from(await pdf1File.arrayBuffer());
    const pdf2Buffer = Buffer.from(await pdf2File.arrayBuffer());

    // Extract text from PDFs
    const pdf1Data = await pdfParse(pdf1Buffer);
    const pdf2Data = await pdfParse(pdf2Buffer);

    const pdf1Text = pdf1Data.text;
    const pdf2Text = pdf2Data.text;

    // Apply the extraction and comparison logic
    const doacaoInfo = extractDoacaoInfo(pdf1Text);
    const comparisonInfo = extractComparisonInfo(pdf2Text);
    const comparisonResults = compareData(doacaoInfo, comparisonInfo);

    return NextResponse.json({
      extractedDoacao: doacaoInfo,
      extractedComparison: comparisonInfo,
      comparisonResults: comparisonResults,
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ error: error.message || 'Failed to process PDFs.' }, { status: 500 });
  }
}
