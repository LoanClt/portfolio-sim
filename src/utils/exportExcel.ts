import type { PortfolioInvestment, CustomParameterSet, PortfolioSimulationParams } from '@/types/portfolio';

interface ExportOptions {
  investments: PortfolioInvestment[];
  customSets?: CustomParameterSet[];
  params?: PortfolioSimulationParams;
}

const headerFill = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FF1E3A8A' } // Indigo-900
};

const headerFont = { color: { argb: 'FFFFFFFF' }, bold: true };

const zebraFill = {
  light: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFEFF6FF' } }, // slate-50
  dark: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFDBEAFE' } } // indigo-50
};

export async function generatePortfolioExcel({ investments, customSets, params }: ExportOptions) {
  const ExcelJSImport: any = await import('exceljs/dist/exceljs.min.js');
  const ExcelJS = ExcelJSImport.default ?? ExcelJSImport;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'VC Portfolio Simulator';
  wb.created = new Date();

  // ---------------- Summary Sheet ----------------
  const summary = wb.addWorksheet('Summary');
  summary.views = [{ state: 'frozen', ySplit: 1 }];
  summary.columns = [
    { header: 'Metric', key: 'metric', width: 35 },
    { header: 'Value', key: 'value', width: 25 }
  ];
  const headerRow = summary.getRow(1);
  headerRow.height = 20;
  headerRow.eachCell(c => {
    c.fill = headerFill;
    c.font = { ...headerFont, size: 12 };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const totalInvestments = investments.reduce((sum, inv) => sum + inv.checkSize, 0);
  const avgTicket = investments.length ? totalInvestments / investments.length : 0;
  const avgValuation = investments.length ? investments.reduce((s, i) => s + i.entryValuation, 0) / investments.length : 0;
  const avgOwnership = investments.length ? investments.reduce((s, i) => s + (i.entryValuation > 0 ? (i.checkSize / i.entryValuation) * 100 : 0), 0) / investments.length : 0;

  const summaryData: { metric: string; value: string | number }[] = [
    { metric: 'Number of Investments', value: investments.length },
    { metric: 'Total Invested ($MM)', value: totalInvestments.toFixed(2) },
    { metric: 'Average Ticket Size ($MM)', value: avgTicket.toFixed(2) },
    { metric: 'Average Valuation ($MM)', value: avgValuation.toFixed(2) },
    { metric: 'Average Ownership (%)', value: avgOwnership.toFixed(2) }
  ];

  if (params) {
    const totalFees = params.setupFees + params.managementFees * params.managementFeeYears;
    summaryData.push({ metric: 'Setup Fees ($MM)', value: params.setupFees.toFixed(2) });
    summaryData.push({ metric: `Management Fees (% x ${params.managementFeeYears}y)`, value: params.managementFees.toFixed(2) });
    summaryData.push({ metric: 'Total Fees ($MM)', value: totalFees.toFixed(2) });
    const followOnReserve = totalInvestments * (params.followOnStrategy.reserveRatio / 100);
    summaryData.push({ metric: `Follow-on Reserve (${params.followOnStrategy.reserveRatio}% of fund)`, value: followOnReserve.toFixed(2) });
  }

  summary.addRows(summaryData);

  // Style zebra rows
  summary.eachRow((row, idx) => {
    if (idx === 1) return; // skip header
    row.eachCell(cell => {
      cell.fill = idx % 2 === 0 ? zebraFill.light : zebraFill.dark;
      if (idx === 2) {
        // emphasise first data row (number of investments)
        cell.font = { bold: true };
      }
      // currency/percent formatting
      if (typeof cell.value === 'string' && /^\d+\.\d+$/.test(cell.value)) {
        cell.numFmt = '#,##0.00';
      }
    });
  });

  // ---------------- Investments Sheet ----------------
  const investSheet = wb.addWorksheet('Investments');
  investSheet.views = [{ state: 'frozen', ySplit: 1 }];
  investSheet.columns = [
    { header: 'Company', key: 'companyName', width: 24 },
    { header: 'Field', key: 'field', width: 15 },
    { header: 'Region', key: 'region', width: 10 },
    { header: 'Entry Stage', key: 'entryStage', width: 12 },
    { header: 'Entry Valuation ($MM)', key: 'entryValuation', width: 20 },
    { header: 'Check Size ($MM)', key: 'checkSize', width: 18 },
    { header: 'Ownership %', key: 'ownership', width: 14 },
    { header: 'Entry Date', key: 'entryDate', width: 15 }
  ];
  investSheet.getRow(1).eachCell(c => {
    c.fill = headerFill;
    c.font = { ...headerFont, size: 12 };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  const investRows = investments.map(inv => ({
    ...inv,
    ownership: inv.entryValuation > 0 ? ((inv.checkSize / inv.entryValuation) * 100).toFixed(2) : '0'
  }));
  investSheet.addRows(investRows);
  // numeric formatting
  const moneyFmt = '#,##0.00';
  investSheet.getColumn('entryValuation').numFmt = moneyFmt;
  investSheet.getColumn('checkSize').numFmt = moneyFmt;
  investSheet.getColumn('ownership').numFmt = '0.00';
  investSheet.eachRow((row, idx) => {
    if (idx === 1) return;
    row.eachCell(cell => {
      cell.fill = idx % 2 === 0 ? zebraFill.light : zebraFill.dark;
    });
  });

  // ---------------- Custom Sets Sheet ----------------
  if (customSets && customSets.length) {
    const setSheet = wb.addWorksheet('Custom Parameter Sets');
    setSheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Color', key: 'color', width: 12 },
      { header: 'Icon', key: 'icon', width: 10 }
    ];
    setSheet.getRow(1).eachCell(c => {
      c.fill = headerFill;
      c.font = headerFont;
      c.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    setSheet.addRows(customSets.map(cs => ({
      name: cs.name,
      description: cs.description || '',
      color: cs.color,
      icon: cs.icon
    })));
    setSheet.eachRow((row, idx) => {
      if (idx === 1) return;
      row.eachCell(cell => {
        cell.fill = idx % 2 === 0 ? zebraFill.light : zebraFill.dark;
      });
    });
  }

  // TODO: Add charts (ExcelJS chart support is experimental). For now we export rich data tables.

  // Generate buffer and trigger download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'portfolio.xlsx';
  link.click();
  URL.revokeObjectURL(url);
} 