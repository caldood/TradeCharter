/**
 * Generates a sample XLSX-compatible CSV and triggers a download.
 * Used by the UploadCard "Download sample template" button.
 */
export function downloadSampleTemplate(): void {
  const csv = [
    'Date,Ticker,Action,Price,Quantity,Notional,Strategy,Portfolio',
    '2024-01-05,AAPL,Add,185.50,100,18550,Growth,Fund A',
    '2024-01-12,MSFT,Add,374.20,50,18710,Value,Fund A',
    '2024-01-18,AAPL,Trim,191.30,50,9565,Growth,Fund A',
    '2024-01-25,NVDA,Add,613.75,80,49100,Growth,Fund B',
    '2024-02-02,GOOGL,Add,141.80,120,17016,Value,Fund A',
    '2024-02-09,MSFT,Trim,407.10,25,10177.5,Value,Fund A',
    '2024-02-15,AAPL,Add,184.20,150,27630,Growth,Fund A',
    '2024-02-22,NVDA,Add,788.17,40,31526.8,Growth,Fund B',
    '2024-03-01,GOOGL,Trim,153.90,60,9234,Value,Fund A',
    '2024-03-08,AAPL,Trim,169.00,100,16900,Growth,Fund A',
    '2024-03-15,MSFT,Add,415.50,75,31162.5,Value,Fund A',
    '2024-03-22,NVDA,Trim,878.36,30,26350.8,Growth,Fund B',
    '2024-04-01,META,Add,527.19,35,18451.65,Growth,Fund B',
    '2024-04-10,AAPL,Add,171.19,200,34238,Growth,Fund A',
    '2024-04-18,GOOGL,Add,155.14,90,13962.6,Value,Fund A',
    '2024-04-25,META,Trim,441.38,20,8827.6,Growth,Fund B',
    '2024-05-03,NVDA,Add,762.00,60,45720,Growth,Fund B',
    '2024-05-10,MSFT,Trim,404.87,50,20243.5,Value,Fund A',
    '2024-05-17,AAPL,Add,189.87,125,23733.75,Growth,Fund A',
    '2024-05-24,META,Add,449.01,45,20205.45,Growth,Fund B',
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample-trades-template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
