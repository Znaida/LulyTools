import * as XLSX from 'xlsx';

export interface ProcessedExcelResult {
  fileName: string;
  totalRows: number;
  resumenVentas: any[];
  resumenDispo: any[];
  resumenPendientes: any[];
  baseclb: any[];
  wbOutBlob: Blob;
}

export async function processGicrLotesExcel(file: File): Promise<ProcessedExcelResult> {
  const buffer = await file.arrayBuffer();
  // Read whole workbook keeping original raw structure for export
  const wb = XLSX.read(buffer, { type: 'array' });

  if (!wb.SheetNames.includes('GICR_Lotes')) {
    throw new Error("El archivo Excel no contiene la hoja 'GICR_Lotes'.");
  }

  // 1. Detect Header Row
  const worksheet = wb.Sheets['GICR_Lotes'];
  const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  let headerRowIdx = 0;
  const keywords = ['Contrato', 'Lote', 'Cliente'];

  for (let idx = 0; idx < Math.min(30, rawMatrix.length); idx++) {
    const rowStr = rawMatrix[idx].map(c => String(c).toLowerCase());
    let matches = 0;
    keywords.forEach(k => {
      if (rowStr.some(cell => cell.includes(k.toLowerCase()))) {
        matches++;
      }
    });
    if (matches >= 2) {
      headerRowIdx = idx;
      break;
    }
  }

  // 2. Read Sheet from Header Row
  const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIdx, defval: '' });

  if (!rawJson || rawJson.length === 0) {
    throw new Error("No se encontraron registros en la hoja GICR_Lotes.");
  }

  // Clean column names
  const rawHeaders = Object.keys(rawJson[0]);
  const cleanedHeaders: { original: string; clean: string }[] = rawHeaders.map(h => ({
    original: h,
    clean: String(h).replace(/\s+/g, ' ').trim()
  }));

  // Find columns to merge into 'Fracc'
  const colsAUnir: string[] = [];
  let foundStart = false;

  for (const h of cleanedHeaders) {
    const colNameLower = h.clean.toLowerCase();
    if (colNameLower.includes('fracc')) {
      colsAUnir.push(h.original);
      foundStart = true;
    } else if (foundStart && colNameLower.includes('unnamed')) {
      colsAUnir.push(h.original);
    } else if (foundStart && !colNameLower.includes('unnamed')) {
      break;
    }
  }

  // Clean and transform data rows
  const cleanedData = rawJson.map((row, index) => {
    const newRow: Record<string, any> = {};

    // Build Fracc by joining colsAUnir if present
    if (colsAUnir.length > 0) {
      const fraccVal = colsAUnir
        .map(c => String(row[c] || '').trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      newRow['Fracc'] = fraccVal;
    }

    // Process all other non-Unnamed columns
    cleanedHeaders.forEach(h => {
      if (colsAUnir.includes(h.original)) return; // already handled
      if (/^unnamed/i.test(h.clean)) return; // drop unmerged Unnamed

      newRow[h.clean] = row[h.original];
    });

    // Clean text columns
    ['Estatus', 'Iniciales'].forEach(col => {
      if (newRow[col] !== undefined) {
        const val = String(newRow[col] || '').trim();
        newRow[col] = val === '' ? 'SIN DATO' : val.toUpperCase();
      } else {
        newRow[col] = 'SIN DATO';
      }
    });

    // Clean Numeric Columns
    ['Area M²', 'Precio M²', 'Valor Contado', 'Valor Operacional'].forEach(col => {
      let numVal = 0;
      if (newRow[col] !== undefined) {
        const strVal = String(newRow[col]).replace(/[$,]/g, '').trim();
        numVal = parseFloat(strVal);
        if (isNaN(numVal)) numVal = 0;
      }
      newRow[col] = numVal;
    });

    // Calculations
    if (newRow['Area M²'] && newRow['Precio M²']) {
      newRow['Valor Contado'] = newRow['Area M²'] * newRow['Precio M²'];
    }

    if (newRow['Valor Operacional'] === 0) {
      newRow['Valor Operacional'] = newRow['Valor Contado'];
    }

    newRow['#'] = index + 1;

    // Date & Calculated Year
    let anoCalculado = 'Sin Año';
    if (newRow['Fecha de Venta']) {
      let dateObj: Date | null = null;
      if (typeof newRow['Fecha de Venta'] === 'number') {
        // Excel serial date number
        dateObj = new Date(Math.round((newRow['Fecha de Venta'] - 25569) * 86400 * 1000));
      } else {
        dateObj = new Date(newRow['Fecha de Venta']);
      }

      if (dateObj && !isNaN(dateObj.getTime())) {
        anoCalculado = String(dateObj.getFullYear());
        newRow['Fecha de Venta'] = dateObj.toISOString().split('T')[0];
      }
    }
    newRow['Año_Calculado'] = anoCalculado;

    return newRow;
  });

  // 3. Helper to generate Pivot Tables (Index: Fracc, Columns: Año_Calculado, Values: Count of Lote)
  function generarPivot(data: any[], statusRegex: RegExp): any[] {
    const filtered = data.filter(r => statusRegex.test(String(r['Estatus'] || '')));

    if (filtered.length === 0) {
      return [{ 'Sin Datos': 'No hay coincidencias' }];
    }

    // Get all unique years
    const yearsSet = new Set<string>();
    filtered.forEach(r => yearsSet.add(r['Año_Calculado'] || 'Sin Año'));
    const sortedYears = Array.from(yearsSet).sort();

    // Group by Fracc
    const pivotMap: Record<string, Record<string, number>> = {};

    filtered.forEach(r => {
      const fracc = r['Fracc'] || 'Sin Fracc';
      const ano = r['Año_Calculado'] || 'Sin Año';

      if (!pivotMap[fracc]) pivotMap[fracc] = {};
      pivotMap[fracc][ano] = (pivotMap[fracc][ano] || 0) + 1;
    });

    // Build Rows
    const pivotRows: any[] = [];
    const yearTotals: Record<string, number> = {};
    let grandTotal = 0;

    Object.keys(pivotMap).sort().forEach(fracc => {
      const rowObj: Record<string, any> = { 'Fracc': fracc };
      let rowTotal = 0;

      sortedYears.forEach(yr => {
        const count = pivotMap[fracc][yr] || 0;
        rowObj[yr] = count;
        rowTotal += count;
        yearTotals[yr] = (yearTotals[yr] || 0) + count;
      });

      rowObj['Total General'] = rowTotal;
      grandTotal += rowTotal;
      pivotRows.push(rowObj);
    });

    // Total General Row
    const totalRow: Record<string, any> = { 'Fracc': 'Total General' };
    sortedYears.forEach(yr => {
      totalRow[yr] = yearTotals[yr] || 0;
    });
    totalRow['Total General'] = grandTotal;
    pivotRows.push(totalRow);

    return pivotRows;
  }

  // Generate the 3 summary tables
  const resumenVentas = generarPivot(cleanedData, /VENDIDO|ESCRITURADO/i);
  const resumenDispo = generarPivot(cleanedData, /DISPONIBLE/i);
  const resumenPendientes = generarPivot(cleanedData, /PENDIENTE ESCRITURAR|OFERTA POR ESCRITURAR/i);

  // 4. Build output Excel Workbook
  const outWb = XLSX.utils.book_new();

  // Copy original sheets
  wb.SheetNames.forEach(sheetName => {
    XLSX.utils.book_append_sheet(outWb, wb.Sheets[sheetName], sheetName);
  });

  // Append cleaned baseclb sheet
  const wsBaseclb = XLSX.utils.json_to_sheet(cleanedData);
  XLSX.utils.book_append_sheet(outWb, wsBaseclb, 'baseclb');

  // Append summary sheets
  XLSX.utils.book_append_sheet(outWb, XLSX.utils.json_to_sheet(resumenVentas), 'Resumen_Ventas_Anual');
  XLSX.utils.book_append_sheet(outWb, XLSX.utils.json_to_sheet(resumenDispo), 'Resumen_Disponibles');
  XLSX.utils.book_append_sheet(outWb, XLSX.utils.json_to_sheet(resumenPendientes), 'Resumen_Pendientes_Escriturar');

  const outArrayBuffer = XLSX.write(outWb, { bookType: 'xlsx', type: 'array' });
  const wbOutBlob = new Blob([outArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  return {
    fileName: 'GICR_Final_Completo.xlsx',
    totalRows: cleanedData.length,
    resumenVentas,
    resumenDispo,
    resumenPendientes,
    baseclb: cleanedData,
    wbOutBlob
  };
}
