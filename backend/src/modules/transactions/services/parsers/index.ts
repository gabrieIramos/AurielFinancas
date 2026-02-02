// Interface e tipos
export * from './bank-parser.interface';

// Parsers específicos
export { C6CsvParser } from './c6-csv.parser';
export { C6ContaCorrenteCsvParser } from './c6-conta-corrente-csv.parser';
export { InterOfxParser } from './inter-ofx.parser';
export { BbOfxParser } from './bb-ofx.parser';
export { NubankCsvParser } from './nubank-csv.parser';
export { GenericOfxParser } from './generic-ofx.parser';
