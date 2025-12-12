/**
 * Tipos e interfaces do projeto
 */

export interface ParsedMessage {
  type: 'entrada' | 'saida' | 'diario';
  value: number;
  date: Date;
  rawText: string;
}

export interface SheetConfig {
  month: number; // 1-12
  year: number;
  startRow: number;
  endRow: number;
  columnOffset: number; // Deslocamento para a direita (0 para janeiro, offset para outros meses)
}

export interface SheetColumns {
  day: string;      // Coluna B
  entrada: string;  // Coluna C
  saida: string;    // Coluna D
  diario: string;   // Coluna E
  saldo: string;    // Coluna F
}

export interface UpdateRequest {
  type: 'entrada' | 'saida' | 'diario';
  value: number;
  day: number;
  month: number;
  year: number;
}

export interface BotResponse {
  success: boolean;
  message: string;
  details?: {
    type: string;
    value: string;
    date: string;
    column: string;
  };
}
