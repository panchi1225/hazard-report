import { format, parseISO, getMonth, getYear } from 'date-fns';
import { Report } from '../types';

// 年度を取得する（4月始まり）
export const getFiscalYear = (dateString: string): number => {
  try {
    const date = parseISO(dateString);
    const month = getMonth(date) + 1; // 1-12
    const year = getYear(date);
    return month >= 4 ? year : year - 1;
  } catch (e) {
    return new Date().getFullYear();
  }
};

// インデックスからA, B, C... Z, AA, AB... を生成
export const getAlphabetMapping = (index: number): string => {
  let result = '';
  let i = index;
  while (i >= 0) {
    result = String.fromCharCode((i % 26) + 65) + result;
    i = Math.floor(i / 26) - 1;
  }
  return `報告者${result}`;
};

// 年度と全レポートを渡して、ID -> 匿名名のマップを生成する
// 指定年度のレポートを発生日の古い順にソートし、出現した順にA, B, C...と割り当てる
export const generateAnonymousMapForYear = (reports: Report[], targetFiscalYear: number): Record<string, string> => {
  const map: Record<string, string> = {};
  let nextIndex = 0;
  
  // 指定年度のレポートを日時の古い順にソート（発生日でソート）
  const sortedReports = [...reports]
    .filter(r => getFiscalYear(r.incidentDate) === targetFiscalYear)
    .sort((a, b) => new Date(a.incidentDate).getTime() - new Date(b.incidentDate).getTime());
    
  sortedReports.forEach(r => {
    if (!map[r.reporterId]) {
      map[r.reporterId] = getAlphabetMapping(nextIndex++);
    }
  });
  
  return map;
};

export const formatDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'yyyy年MM月dd日');
  } catch (e) {
    return dateString;
  }
};
