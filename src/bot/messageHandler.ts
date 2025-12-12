import { MessageParser } from '../utils/messageParser';
import { DateHelper } from '../utils/dateHelper';
import { SheetUpdater } from '../sheets/sheetUpdater';
import { UpdateRequest } from '../types';

/**
 * Processa mensagens recebidas e executa ações correspondentes
 */
export class MessageHandler {
  private sheetUpdater: SheetUpdater;

  constructor() {
    this.sheetUpdater = new SheetUpdater();
  }

  /**
   * Processa uma mensagem e retorna a resposta
   */
  async handleMessage(message: string): Promise<string> {
    try {
      // Faz parse da mensagem
      const parsed = MessageParser.parse(message);

      if (!parsed) {
        return this.getHelpMessage();
      }

      // Se é comando de consulta (saldo/resumo)
      if (['hoje', 'semana', 'mes'].includes(parsed.type)) {
        return await this.handleQueryCommand(parsed.type as 'hoje' | 'semana' | 'mes');
      }

      // Se é comando de atualização (entrada/saída/diário)
      // Extrai informações da data
      const day = DateHelper.getDay(parsed.date);
      const month = DateHelper.getMonth(parsed.date);
      const year = DateHelper.getYear(parsed.date);

      // Monta requisição de atualização
      const updateRequest: UpdateRequest = {
        type: parsed.type as 'entrada' | 'saida' | 'diario',
        value: parsed.value!,
        day,
        month,
        year
      };

      // Atualiza planilha
      const response = await this.sheetUpdater.updateValue(updateRequest);

      return response.message;

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      return `❌ Erro ao processar sua mensagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    }
  }

  /**
   * Processa comandos de consulta (saldo, resumo)
   */
  private async handleQueryCommand(type: 'hoje' | 'semana' | 'mes'): Promise<string> {
    try {
      switch (type) {
        case 'hoje':
          return await this.sheetUpdater.getDayReport(new Date());
        case 'semana':
          return await this.sheetUpdater.getWeekReport();
        case 'mes':
          return await this.sheetUpdater.getMonthReport();
        default:
          return '❌ Comando de consulta inválido.';
      }
    } catch (error) {
      console.error('Erro ao processar consulta:', error);
      return `❌ Erro ao buscar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    }
  }

  /**
   * Retorna mensagem de ajuda
   */
  private getHelpMessage(): string {
    return `
🤖 *Bot de Controle Financeiro*

📝 *ADICIONAR VALORES:*

*DIÁRIO:*
• diario 87,10
• diario 400 amanha
• 517 (adiciona no diário de hoje)

*ENTRADA:*
• entrada 352,91 01/01
• entrada 200 hoje

*SAÍDA:*
• saida 94,90 hoje
• saida 600 06/02

━━━━━━━━━━━━━━━━━━━━━━━━

📊 *CONSULTAR SALDOS:*

• *saldo* ou *resumo* → Resumo de hoje
• *saldo semana* → Resumo dos últimos 7 dias
• *saldo mes* → Resumo do mês atual

━━━━━━━━━━━━━━━━━━━━━━━━

📅 *Datas aceitas:*
• hoje • amanha • dd/mm • dd/mm/aaaa

💡 *Dica:* Valores podem usar vírgula ou ponto como decimal.
    `.trim();
  }

  /**
   * Valida se a mensagem é um comando
   */
  isValidCommand(message: string): boolean {
    return MessageParser.isValidCommand(message);
  }
}
