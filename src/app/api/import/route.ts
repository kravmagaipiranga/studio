
'use server';

import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';
import { Student } from '@/lib/types';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.GCLOUD_PROJECT,
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

const db = admin.firestore();

// --- Google Sheets Configuration ---
// IMPORTANT: Make sure this SHEET_ID matches your student sheet
const SPREADSHEET_ID = '16t3CYQtIVRIT2ZJhcPi64BePZXCMYjKJOhZkgs7t_d8'; 
const SHEET_NAME = 'Sheet1'; // Common default name, change if yours is different
const RANGE = `${SHEET_NAME}!A:Z`; // Read all columns

async function getGoogleSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
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

     if (!SPREADSHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        return NextResponse.json({ error: 'Google Sheets API environment variables not configured.' }, { status: 500 });
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

        // 3. Process each row and map to Student type
        for (const row of studentData) {
            // Basic validation: skip rows without a name
            const name = row[headerMap['nome completo']];
            if (!name) {
                skippedCount++;
                continue;
            }

            const newStudentId = db.collection('students').doc().id;

            const student: Partial<Student> = {
                id: newStudentId,
                name: name || '',
                email: row[headerMap['e-mail']] || '',
                phone: row[headerMap['whatsapp']] || '',
                cpf: row[headerMap['cpf']] || '',
                dob: formatGlideDate(row[headerMap['data de nascimento']]),
                startDate: formatGlideDate(row[headerMap['início dos treinos']]),
                belt: row[headerMap['graduação atual (faixa)']] || 'Branca',
                status: row[headerMap['status do aluno']] || 'Ativo',
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

            // Remove any undefined fields before saving
            Object.keys(student).forEach(key => (student as any)[key] === undefined && delete (student as any)[key]);
            
            // 4. Save to Firestore using Admin SDK syntax
            await db.collection('students').doc(newStudentId).set(student);
            importedCount++;
        }


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
