export function escapeCSV(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    const str = String(value);
    const safeStr = /^[=+\-@\t]/.test(str) ? `'${str}` : str;
    if (safeStr.includes(',') || safeStr.includes('"') || safeStr.includes('\n') || safeStr.includes('\r') || safeStr.includes(';')) {
        return `"${safeStr.replace(/"/g, '""')}"`;
    }
    return safeStr;
}

export function downloadCSV(
    filenameBase: string,
    headers: string[],
    rows: unknown[][],
    options: { filename?: string } = {},
): void {
    const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
    const safeBase = filenameBase.replace(/[^\w-]+/g, '_');
    const filename = options.filename ?? `${safeBase}_${today}.csv`;

    const headerLine = headers.map(escapeCSV).join(';');
    const bodyLines = rows.map(row => row.map(escapeCSV).join(';'));
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
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
