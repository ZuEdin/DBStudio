/**
 * Running Totals & Page Carried Forward Engine
 * Calculates: Group Subtotals, Carried Forward Totals ("Übertrag auf nächste Seite"),
 * Running Sum, and Conditional Formatting.
 */

export interface ReportItemRecord {
  id: string;
  groupKey: string;
  description: string;
  amount: number;
  quantity?: number;
  pageNumber?: number;
}

export interface RunningTotalsResult {
  records: Array<ReportItemRecord & { runningSum: number; percentageOfGroupTotal: number; isNegative: boolean }>;
  groupTotals: Record<string, number>;
  pageTotals: Record<number, { pageSubtotal: number; carriedForwardToNextPage: number; carriedFromPrevPage: number }>;
  grandTotal: number;
}

export const calculateRunningTotals = (items: ReportItemRecord[]): RunningTotalsResult => {
  const groupTotals: Record<string, number> = {};
  let grandTotal = 0;

  // 1. Calculate Group Totals & Grand Total
  items.forEach((item) => {
    const amt = Number(item.amount) || 0;
    groupTotals[item.groupKey] = (groupTotals[item.groupKey] || 0) + amt;
    grandTotal += amt;
  });

  // 2. Calculate Running Sum & Percentages
  let currentRunningSum = 0;
  const processedRecords = items.map((item) => {
    const amt = Number(item.amount) || 0;
    currentRunningSum += amt;
    const gTotal = groupTotals[item.groupKey] || 1;

    return {
      ...item,
      runningSum: currentRunningSum,
      percentageOfGroupTotal: parseFloat(((amt / gTotal) * 100).toFixed(2)),
      isNegative: amt < 0,
    };
  });

  // 3. Calculate Page Totals & Carried Forward
  const pageTotals: Record<number, { pageSubtotal: number; carriedForwardToNextPage: number; carriedFromPrevPage: number }> = {};
  let runningPageCarriedSum = 0;

  const recordsByPage: Record<number, ReportItemRecord[]> = {};
  items.forEach((item) => {
    const page = item.pageNumber || 1;
    if (!recordsByPage[page]) recordsByPage[page] = [];
    recordsByPage[page].push(item);
  });

  const pageNumbers = Object.keys(recordsByPage)
    .map(Number)
    .sort((a, b) => a - b);

  pageNumbers.forEach((p) => {
    const pItems = recordsByPage[p];
    const pageSubtotal = pItems.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const carriedFromPrevPage = runningPageCarriedSum;
    runningPageCarriedSum += pageSubtotal;

    pageTotals[p] = {
      pageSubtotal,
      carriedFromPrevPage,
      carriedForwardToNextPage: runningPageCarriedSum,
    };
  });

  return {
    records: processedRecords,
    groupTotals,
    pageTotals,
    grandTotal,
  };
};
