import { GoogleSheetsService } from './googleSheets';
import { UpdateRequest, SheetConfig, BotResponse, DayData, PeriodSummary } from '../types';
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

  /**
   * Lê os dados de um dia específico da planilha
   */
  async getDayData(day: number, month: number, year: number): Promise<DayData | null> {
    try {
      const config = this.getSheetConfig(month, year);
      const rowNumber = this.getRowNumber(day, config);
      
      // Lê as 4 colunas: Entrada, Saída, Diário, Saldo
      const entradaCol = this.getColumnLetter('entrada', config.columnOffset);
      const saidaCol = this.getColumnLetter('saida', config.columnOffset);
      const diarioCol = this.getColumnLetter('diario', config.columnOffset);
      const saldoCol = this.columnToLetter(5 + config.columnOffset); // Coluna F + offset
      
      const [entrada, saida, diario, saldo] = await Promise.all([
        this.sheetsService.readCell(`${entradaCol}${rowNumber}`),
        this.sheetsService.readCell(`${saidaCol}${rowNumber}`),
        this.sheetsService.readCell(`${diarioCol}${rowNumber}`),
        this.sheetsService.readCell(`${saldoCol}${rowNumber}`)
      ]);

      return {
        day,
        month,
        year,
        entrada: this.parseValue(entrada),
        saida: this.parseValue(saida),
        diario: this.parseValue(diario),
        saldo: this.parseValue(saldo)
      };
    } catch (error) {
      console.error('Erro ao ler dados do dia:', error);
      return null;
    }
  }

  /**
   * Converte valor da planilha (ex: "R$ 87,10") para número
   */
  private parseValue(cellValue: string | null): number {
    if (!cellValue || cellValue.trim() === '') return 0;
    
    // Remove "R$", espaços e converte vírgula para ponto
    const cleaned = cellValue
      .replace(/R\$\s*/g, '')
      .replace(/\./g, '') // Remove separadores de milhar
      .replace(/,/g, '.') // Converte decimal
      .trim();
    
    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
  }

  /**
   * Formata valor para exibição (ex: 1234.56 → "R$ 1.234,56")
   */
  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  /**
   * Gera mensagem formatada com os dados do dia
   */
  async getDayReport(date: Date): Promise<string> {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const data = await this.getDayData(day, month, year);

    if (!data) {
      return '❌ Não foi possível obter os dados deste dia.';
    }

    const dateStr = DateHelper.formatDate(date);
    
    return `
📊 *RESUMO FINANCEIRO - ${dateStr}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 *ENTRADA:* ${this.formatCurrency(data.entrada)}
💸 *SAÍDA:* ${this.formatCurrency(data.saida)}
🍽️ *DIÁRIO:* ${this.formatCurrency(data.diario)}

💵 *SALDO DO DIA:* ${this.formatCurrency(data.saldo)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${this.getSaldoEmoji(data.saldo)} ${this.getSaldoMessage(data.saldo)}
    `.trim();
  }

  /**
   * Retorna emoji baseado no saldo
   */
  private getSaldoEmoji(saldo: number): string {
    if (saldo > 0) return '✅';
    if (saldo < 0) return '⚠️';
    return 'ℹ️';
  }

  /**
   * Retorna mensagem motivacional baseado no saldo
   */
  private getSaldoMessage(saldo: number): string {
    if (saldo > 0) return 'Saldo positivo! Continue assim! 🎉';
    if (saldo < 0) return 'Atenção aos gastos! 📉';
    return 'Saldo zerado.';
  }

  /**
   * Gera relatório semanal
   */
  async getWeekReport(): Promise<string> {
    const today = new Date();
    const days: DayData[] = [];
    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalDiario = 0;

    // Últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const dayData = await this.getDayData(
        date.getDate(),
        date.getMonth() + 1,
        date.getFullYear()
      );

      if (dayData) {
        days.push(dayData);
        totalEntradas += dayData.entrada;
        totalSaidas += dayData.saida;
        totalDiario += dayData.diario;
      }
    }

    const saldoFinal = days.length > 0 ? days[days.length - 1].saldo : 0;

    return `
📅 *RESUMO SEMANAL (Últimos 7 dias)*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 *Total ENTRADAS:* ${this.formatCurrency(totalEntradas)}
💸 *Total SAÍDAS:* ${this.formatCurrency(totalSaidas)}
🍽️ *Total DIÁRIO:* ${this.formatCurrency(totalDiario)}

💵 *SALDO FINAL:* ${this.formatCurrency(saldoFinal)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Média diária: ${this.formatCurrency((totalEntradas + totalSaidas + totalDiario) / 7)}
    `.trim();
  }

  /**
   * Gera relatório mensal
   */
  async getMonthReport(): Promise<string> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const config = this.getSheetConfig(month, year);
    
    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalDiario = 0;
    let diasComDados = 0;

    // Percorre todos os dias do mês até hoje
    const currentDay = today.getDate();
    for (let day = 1; day <= currentDay; day++) {
      const dayData = await this.getDayData(day, month, year);
      
      if (dayData && (dayData.entrada > 0 || dayData.saida > 0 || dayData.diario > 0)) {
        totalEntradas += dayData.entrada;
        totalSaidas += dayData.saida;
        totalDiario += dayData.diario;
        diasComDados++;
      }
    }

    const lastDayData = await this.getDayData(currentDay, month, year);
    const saldoAtual = lastDayData?.saldo || 0;

    const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(today);

    return `
📆 *RESUMO MENSAL - ${monthName.toUpperCase()}/${year}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 *Total ENTRADAS:* ${this.formatCurrency(totalEntradas)}
💸 *Total SAÍDAS:* ${this.formatCurrency(totalSaidas)}
🍽️ *Total DIÁRIO:* ${this.formatCurrency(totalDiario)}

💵 *SALDO ATUAL:* ${this.formatCurrency(saldoAtual)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Dias com registros: ${diasComDados}/${currentDay}
📈 Média diária: ${diasComDados > 0 ? this.formatCurrency((totalEntradas + totalSaidas + totalDiario) / diasComDados) : 'N/A'}
    `.trim();
  }
}

