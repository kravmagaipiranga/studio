export function escapeCSV(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r') || str.includes(';')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export function downloadCSV(filenameBase: string, headers: string[], rows: unknown[][]): void {
    const today = new Date().toISOString().split('T')[0];
    const safeBase = filenameBase.replace(/[^\w-]+/g, '_');
    const filename = `${safeBase}_${today}.csv`;

    const headerLine = headers.map(escapeCSV).join(',');
    const bodyLines = rows.map(row => row.map(escapeCSV).join(','));
    const csvContent = [headerLine, ...bodyLines].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
