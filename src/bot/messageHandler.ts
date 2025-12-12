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

      // Extrai informações da data
      const day = DateHelper.getDay(parsed.date);
      const month = DateHelper.getMonth(parsed.date);
      const year = DateHelper.getYear(parsed.date);

      // Monta requisição de atualização
      const updateRequest: UpdateRequest = {
        type: parsed.type,
        value: parsed.value,
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
   * Retorna mensagem de ajuda
   */
  private getHelpMessage(): string {
    return `
🤖 *Bot de Controle Financeiro*

📝 *Comandos disponíveis:*

*DIÁRIO:*
• diario 87,10
• diario 400 amanha
• diario 100 07/01
• 517 (adiciona no diário de hoje)
• 35 amanha

*ENTRADA:*
• entrada 352,91 01/01
• entrada 200 hoje

*SAÍDA:*
• saida 94,90 hoje
• saida 600 06/02

📅 *Datas aceitas:*
• hoje
• amanha
• dd/mm
• dd/mm/aaaa

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
