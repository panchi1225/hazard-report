import { Report, Site } from '../types';
import { format, parseISO } from 'date-fns';

// CSV出力
export const exportToCSV = (reports: Report[], sites: Site[]) => {
  // BOMを追加してExcelで文字化けしないようにする
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  
  const headers = ['ID', '発生日', '現場名', '報告者名', '内容', '確認済み', '登録日時', '更新日時'];
  
  const rows = reports.map(r => [
    r.id,
    r.incidentDate,
    r.siteName,
    r.reporterName,
    `"${r.content.replace(/"/g, '""')}"`, // 改行やカンマ対応
    r.checked ? '済' : '未',
    format(parseISO(r.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    format(parseISO(r.updatedAt), 'yyyy-MM-dd HH:mm:ss')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `hiyari_reports_${format(new Date(), 'yyyyMMdd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// TSV出力
export const exportToTSV = (reports: Report[], sites: Site[]) => {
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  
  const headers = ['ID', '発生日', '現場名', '報告者名', '内容', '確認済み', '登録日時', '更新日時'];
  
  const rows = reports.map(r => [
    r.id,
    r.incidentDate,
    r.siteName,
    r.reporterName,
    `"${r.content.replace(/"/g, '""').replace(/\t/g, ' ')}"`, // タブ文字はスペースに変換
    r.checked ? '済' : '未',
    format(parseISO(r.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    format(parseISO(r.updatedAt), 'yyyy-MM-dd HH:mm:ss')
  ]);

  const tsvContent = [
    headers.join('\t'),
    ...rows.map(row => row.join('\t'))
  ].join('\n');

  const blob = new Blob([bom, tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `hiyari_reports_${format(new Date(), 'yyyyMMdd')}.tsv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// PDF出力
export const printReports = (reports: Report[], title: string) => {
  // 日本語フォント対応のため、今回はブラウザの印刷機能を利用したHTML出力アプローチを維持しつつ、
  // 要件を満たす帳票レイアウトに改善します。
  // （jsPDFで日本語を扱うには大容量のフォントファイルの読み込みが必要になるため、
  // 静的サイトでの安定稼働を優先してHTML印刷を採用します）

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('ポップアップがブロックされました。許可してください。');
    return;
  }

  const checkedCount = reports.filter(r => r.checked).length;
  const uncheckedCount = reports.length - checkedCount;

  // 現場別集計
  const siteCounts: Record<string, number> = {};
  reports.forEach(r => {
    siteCounts[r.siteName] = (siteCounts[r.siteName] || 0) + 1;
  });

  // 個人別集計（ランキング）
  const reporterCounts: Record<string, number> = {};
  reports.forEach(r => {
    reporterCounts[r.reporterName] = (reporterCounts[r.reporterName] || 0) + 1;
  });
  const ranking = Object.entries(reporterCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif; padding: 20px; color: #333; line-height: 1.5; }
        h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .summary-container { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .summary-box { border: 1px solid #ccc; padding: 15px; width: 30%; border-radius: 4px; }
        .summary-box h3 { margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 5px; font-size: 14px; }
        .summary-list { list-style: none; padding: 0; margin: 0; font-size: 12px; }
        .summary-list li { display: flex; justify-content: space-between; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: top; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .content { white-space: pre-wrap; }
        .text-center { text-align: center; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
        .badge-checked { background-color: #e6f4ea; color: #1e8e3e; border: 1px solid #1e8e3e; }
        .badge-unchecked { background-color: #fef7e0; color: #b06000; border: 1px solid #b06000; }
        @media print {
          @page { size: A4 landscape; margin: 15mm; }
          button { display: none; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div style="text-align: right; margin-bottom: 10px;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background-color: #2563eb; color: white; border: none; border-radius: 4px;">印刷 / PDF保存</button>
      </div>
      
      <h1>${title}（全${reports.length}件）</h1>
      
      <div style="text-align: right; margin-bottom: 20px; font-size: 12px;">
        出力日: ${format(new Date(), 'yyyy年MM月dd日 HH:mm')}
      </div>

      <div class="summary-container">
        <div class="summary-box">
          <h3>全体集計</h3>
          <ul class="summary-list">
            <li><span>対象件数:</span> <strong>${reports.length} 件</strong></li>
            <li><span>確認済:</span> <strong>${checkedCount} 件</strong></li>
            <li><span>未確認:</span> <strong>${uncheckedCount} 件</strong></li>
          </ul>
        </div>
        
        <div class="summary-box">
          <h3>現場別件数</h3>
          <ul class="summary-list">
            ${Object.entries(siteCounts).map(([site, count]) => `
              <li><span>${site}:</span> <strong>${count} 件</strong></li>
            `).join('')}
          </ul>
        </div>

        <div class="summary-box">
          <h3>個人別ランキング (上位10名)</h3>
          <ul class="summary-list">
            ${ranking.map(([name, count], index) => `
              <li><span>${index + 1}位 ${name}:</span> <strong>${count} 件</strong></li>
            `).join('')}
          </ul>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 10%;">発生日</th>
            <th style="width: 15%;">現場</th>
            <th style="width: 15%;">報告者</th>
            <th style="width: 50%;">内容</th>
            <th style="width: 10%; text-align: center;">状態</th>
          </tr>
        </thead>
        <tbody>
          ${reports.map(r => `
            <tr>
              <td>${r.incidentDate}</td>
              <td>${r.siteName}</td>
              <td>${r.reporterName}</td>
              <td class="content">${r.content}</td>
              <td class="text-center">
                <span class="badge ${r.checked ? 'badge-checked' : 'badge-unchecked'}">
                  ${r.checked ? '確認済' : '未確認'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.focus();
  }, 500);
};
