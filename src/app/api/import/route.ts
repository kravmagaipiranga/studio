
'use server';

import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';
import { Student } from '@/lib/types';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // When deployed to App Hosting, GOOGLE_APPLICATION_CREDENTIALS is automatically set
    // and initializeApp() will work without arguments.
    admin.initializeApp();
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
    // For local development, you might need to rely on the service account file
    // or other credential mechanisms.
  }
}

const db = admin.firestore();

// --- Google Sheets Configuration ---
const SPREADSHEET_ID = '16t3CYQtIVRIT2ZJhcPi64BePZXCMYjKJOhZkgs7t_d8'; 
const SHEET_NAME = 'Sheet1'; // Common default name, change if yours is different
const RANGE = `${SHEET_NAME}!A:Z`; // Read all columns

async function getGoogleSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        projectId: process.env.GCLOUD_PROJECT,
    });

    const authClient = await auth.getClient();
    return google.sheets({ version: 'v4', auth: authClient });
}

// Helper to format Glide dates (e.g., "MM/DD/YYYY") to "YYYY-MM-DD"
function formatGlideDate(dateStr: string | null | undefined): string {
    if (!dateStr || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        return '';
    }
    const [month, day, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.BACKUP_API_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const sheets = await getGoogleSheetsClient();

        // 1. Fetch data from Google Sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            return NextResponse.json({ message: 'No data found in the sheet to import.' });
        }

        // 2. Map headers to indices
        const headers = rows[0].map(h => h.trim().toLowerCase());
        const headerMap: { [key: string]: number } = {};
        headers.forEach((header, index) => {
            headerMap[header] = index;
        });

        const studentData = rows.slice(1);
        let importedCount = 0;
        let skippedCount = 0;
        const batch = db.batch();

        // 3. Process each row and map to Student type
        for (const row of studentData) {
            const name = row[headerMap['nome completo']];
            if (!name) {
                skippedCount++;
                continue;
            }

            const docRef = db.collection('students').doc(); 

            const student: Omit<Student, 'id'> = {
                name: name || '',
                email: row[headerMap['e-mail']] || '',
                phone: row[headerMap['whatsapp']] || '',
                cpf: row[headerMap['cpf']] || '',
                dob: formatGlideDate(row[headerMap['data de nascimento']]),
                startDate: formatGlideDate(row[headerMap['início dos treinos']]),
                belt: row[headerMap['graduação atual (faixa)']] || 'Branca',
                status: 'Ativo',
                paymentStatus: row[headerMap['status do pagamento']] || 'Pendente',
                planType: row[headerMap['tipo de plano']] || 'Mensal',
                planValue: parseFloat(row[headerMap['valor do plano']]) || 200,
                tshirtSize: row[headerMap['camiseta (tamanho)']] || 'M',
                pantsSize: row[headerMap['calça (tamanho)']] || 'M',
                emergencyContacts: row[headerMap['contato de emergência']] || '',
                medicalHistory: row[headerMap['histórico médico']] || '',
                generalNotes: row[headerMap['observações gerais']] || '',
                registrationDate: new Date().toISOString(),
            };

            const studentWithId: Student = { ...student, id: docRef.id };
            batch.set(docRef, studentWithId);
            importedCount++;
        }
        
        await batch.commit();

        return NextResponse.json({ 
            success: true,
            message: `Import completed. Imported: ${importedCount}, Skipped: ${skippedCount}.` 
        });

    } catch (error) {
        console.error('Import failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Import failed', details: errorMessage }, { status: 500 });
    }
}
