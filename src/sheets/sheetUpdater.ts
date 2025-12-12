import { GoogleSheetsService } from './googleSheets';
import { UpdateRequest, SheetConfig, BotResponse } from '../types';
import { DateHelper } from '../utils/dateHelper';

/**
 * Gerencia atualizações na planilha de finanças
 */
export class SheetUpdater {
  private sheetsService: GoogleSheetsService;

  constructor() {
    this.sheetsService = new GoogleSheetsService();
  }

  /**
   * Retorna a configuração da planilha para um determinado mês/ano
   * 
   * Estrutura:
   * - JANEIRO: linhas 6-36, colunas B-F
   * - FEVEREIRO: linhas 6-34 (ano bissexto, 29 dias), colunas H-L (offset de 6)
   * - MARÇO: linhas 6-36, colunas N-R (offset de 12)
   * - ABRIL: linhas 6-35 (30 dias), colunas T-X (offset de 18)
   * - etc...
   */
  private getSheetConfig(month: number, year: number): SheetConfig {
    // Calcula o offset de colunas baseado no mês
    // Janeiro = 0, Fevereiro = 6, Março = 12, etc.
    const columnOffset = (month - 1) * 6;

    // Linha inicial é sempre 6
    const startRow = 6;

    // Determina a linha final baseado no mês
    let endRow = 36; // Padrão: 31 dias (dia 31 = linha 36)
    
    // Ajusta para meses com menos dias
    if (month === 2) {
      // Fevereiro
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      endRow = isLeapYear ? 34 : 33; // 29 ou 28 dias
    } else if ([4, 6, 9, 11].includes(month)) {
      // Abril, Junho, Setembro, Novembro
      endRow = 35; // 30 dias (dia 30 = linha 35)
    }

    return {
      month,
      year,
      startRow,
      endRow,
      columnOffset
    };
  }

  /**
   * Converte número de coluna para letra (0 = A, 1 = B, etc.)
   */
  private columnToLetter(column: number): string {
    let temp: number;
    let letter = '';
    
    while (column >= 0) {
      temp = column % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      column = Math.floor(column / 26) - 1;
    }
    
    return letter;
  }

  /**
   * Retorna a letra da coluna baseado no tipo e offset
   */
  private getColumnLetter(type: 'entrada' | 'saida' | 'diario', columnOffset: number): string {
    // Colunas base (Janeiro):
    // B = Dia (1)
    // C = Entrada (2)
    // D = Saída (3)
    // E = Diário (4)
    // F = Saldo (5)

    const baseColumns = {
      entrada: 2,  // Coluna C
      saida: 3,    // Coluna D
      diario: 4    // Coluna E
    };

    const columnNumber = baseColumns[type] + columnOffset;
    return this.columnToLetter(columnNumber);
  }

  /**
   * Calcula a linha na planilha baseado no dia do mês
   * Dia 1 = linha 6
   */
  private getRowNumber(day: number, config: SheetConfig): number {
    // A linha 6 corresponde ao dia 1
    return config.startRow + (day - 1);
  }

  /**
   * Atualiza um valor na planilha
   */
  async updateValue(request: UpdateRequest): Promise<BotResponse> {
    try {
      const { type, value, day, month, year } = request;

      // Validações
      if (day < 1 || day > 31) {
        return {
          success: false,
          message: `Dia inválido: ${day}`
        };
      }

      // Obtém configuração do mês
      const config = this.getSheetConfig(month, year);

      // Valida se o dia existe neste mês
      const maxDay = config.endRow - config.startRow + 1;
      if (day > maxDay) {
        return {
          success: false,
          message: `O mês ${month}/${year} só tem ${maxDay} dias`
        };
      }

      // Calcula posição na planilha
      const columnLetter = this.getColumnLetter(type, config.columnOffset);
      const rowNumber = this.getRowNumber(day, config);
      const cellRange = `${columnLetter}${rowNumber}`;

      // Formata valor em formato brasileiro
      const formattedValue = `R$ ${value.toFixed(2).replace('.', ',')}`;

      // Escreve na célula
      await this.sheetsService.writeCell(cellRange, formattedValue);

      // Monta mensagem de sucesso
      const dateStr = DateHelper.formatDate(new Date(year, month - 1, day));
      const typeLabel = {
        entrada: 'Entrada',
        saida: 'Saída',
        diario: 'Diário'
      }[type];

      return {
        success: true,
        message: `✅ ${typeLabel} de ${formattedValue} registrado para ${dateStr}`,
        details: {
          type: typeLabel,
          value: formattedValue,
          date: dateStr,
          column: cellRange
        }
      };

    } catch (error) {
      console.error('Erro ao atualizar planilha:', error);
      return {
        success: false,
        message: `❌ Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
}
