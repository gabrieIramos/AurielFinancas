/**
 * Utilitários para parsing de arquivos bancários
 */

/**
 * Parse de valor monetário brasileiro
 * Suporta formatos:
 * - "1.234,56" (ponto milhar, vírgula decimal)
 * - "1234,56" (vírgula decimal)
 * - "1234.56" (ponto decimal)
 * - "1234" (inteiro)
 * - "-1234,56" (negativo)
 */
export function parseBrazilianCurrency(value: string): number {
  const cleanValue = value.trim();
  
  if (!cleanValue) {
    return NaN;
  }
  
  let amount: number;
  
  // Detectar formato: se tem vírgula E ponto, vírgula é decimal
  // Se tem só vírgula, é decimal
  // Se tem só ponto, verificar posição (se houver 3 dígitos após o último ponto, é milhar)
  if (cleanValue.includes(',') && cleanValue.includes('.')) {
    // Formato: 1.234,56 ou -1.234,56 (ponto milhar, vírgula decimal)
    amount = parseFloat(
      cleanValue
        .replace(/\./g, '')    // Remove separador de milhar
        .replace(',', '.')     // Troca vírgula por ponto decimal
    );
  } else if (cleanValue.includes(',')) {
    // Formato: 1234,56 ou -1234,56 (vírgula decimal)
    amount = parseFloat(cleanValue.replace(',', '.'));
  } else if (cleanValue.includes('.')) {
    // Verificar se é separador de milhar ou decimal
    // Se tem exatamente 3 dígitos após o ponto, provavelmente é milhar
    const parts = cleanValue.split('.');
    const lastPart = parts[parts.length - 1];
    
    if (lastPart.length === 3 && parts.length === 2) {
      // Pode ser milhar (1.234) ou decimal (1.234) - assumir milhar no contexto brasileiro
      // Mas se o valor for muito pequeno (< 10), provavelmente é decimal
      const possibleValue = parseFloat(cleanValue);
      if (possibleValue < 10) {
        // Provavelmente é decimal: 1.23
        amount = possibleValue;
      } else {
        // Provavelmente é milhar: 1.234 -> 1234
        amount = parseFloat(cleanValue.replace(/\./g, ''));
      }
    } else {
      // Decimal normal: 12.34, 123.45
      amount = parseFloat(cleanValue);
    }
  } else {
    // Formato: 1234 ou -1234 (inteiro)
    amount = parseFloat(cleanValue);
  }
  
  return amount;
}

/**
 * Parse de data brasileira (DD/MM/YYYY) para ISO (YYYY-MM-DD)
 */
export function parseBrazilianDate(dateStr: string): string | null {
  const parts = dateStr.trim().split('/');
  
  if (parts.length !== 3) {
    return null;
  }
  
  const [day, month, year] = parts;
  
  // Validar componentes
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
    return null;
  }
  
  if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
    return null;
  }
  
  // Formatar para ISO
  const isoDate = `${year.padStart(4, '20')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  
  // Validar data resultante
  const dateObj = new Date(isoDate);
  if (isNaN(dateObj.getTime())) {
    return null;
  }
  
  return isoDate;
}
