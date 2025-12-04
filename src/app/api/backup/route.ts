
'use server';

import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';
import { Student } from '@/lib/types';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // When deployed to App Hosting, GOOGLE_APPLICATION_CREDENTIALS is automatically set
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.GCLOUD_PROJECT,
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
    // For local development, you might need to set up credentials differently
    // e.g., using a service account file.
  }
}

const db = admin.firestore();

// Define the structure of your Google Sheet
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Alunos'; // The name of the sheet (tab) in your spreadsheet
const HEADERS = [
    'ID', 'Nome', 'Email', 'Status', 'Data de Nascimento', 'CPF', 
    'Telefone', 'Faixa', 'Início dos Treinos', 'Anuidade FIKM Paga',
    'Tipo de Plano', 'Valor do Plano', 'Data Último Pagamento', 'Vencimento do Plano', 
    'Status do Pagamento', 'Anotações'
];

async function getGoogleSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    return google.sheets({ version: 'v4', auth: authClient });
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

        // 1. Fetch all students from Firestore
        const studentsSnapshot = await db.collection('students').get();
        if (studentsSnapshot.empty) {
            return NextResponse.json({ message: 'No students to backup.' });
        }

        const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];

        // 2. Format data for Google Sheets
        const rows = students.map(student => [
            student.id || '',
            student.name || '',
            student.email || '',
            student.status || '',
            student.dob || '',
            student.cpf || '',
            student.phone || '',
            student.belt || '',
            student.startDate || '',
            student.fikmAnnuityPaid ? 'Sim' : 'Não',
            student.planType || '',
            student.planValue || '',
            student.lastPaymentDate || '',
            student.planExpirationDate || '',
            student.paymentStatus || '',
            student.generalNotes || '',
        ]);

        // 3. Clear the existing sheet data (except headers)
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A2:Z`, // Clear from the second row downwards
        });

        // 4. Update the sheet with new data (including headers)
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [HEADERS, ...rows],
            },
        });

        return NextResponse.json({ 
            success: true,
            message: `Backup completed successfully. ${students.length} students backed up to Google Sheet.` 
        });

    } catch (error) {
        console.error('Backup failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Backup failed', details: errorMessage }, { status: 500 });
    }
}
