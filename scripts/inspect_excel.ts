import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

function inspect(filename: string) {
    const filePath = path.join(process.cwd(), filename);

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    // Handle CommonJS/ESM interop issues with xlsx library
    const read = XLSX.readFile || (XLSX as any).default?.readFile;
    const utils = XLSX.utils || (XLSX as any).default?.utils;

    if (!read) {
        console.error('Could not find readFile function in XLSX export', Object.keys(XLSX));
        return;
    }

    try {
        const workbook = read(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert first row to JSON to see headers
        const data = utils.sheet_to_json(sheet, { header: 1 });

        console.log(`\n--- Inspecting ${filename} ---`);
        console.log('Sheet Name:', sheetName);
        // Print first 20 rows
        data.slice(0, 20).forEach((row: any, i: number) => {
            console.log(`Row ${i}:`, JSON.stringify(row));
        });

    } catch (error) {
        console.error(`Error processing ${filename}:`, error);
    }
}

inspect('Creators_1766130456.xlsx');
inspect('Creatives_1766130388.xlsx');
