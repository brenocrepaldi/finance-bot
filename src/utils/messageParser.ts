import { ParsedMessage } from '../types';
import { DateHelper } from './dateHelper';

/**
 * Parser inteligente de mensagens do WhatsApp
 * Interpreta comandos de entrada, saída e diário
 */
export class MessageParser {
  /**
   * Normaliza valor monetário brasileiro para número
   * Converte "87,10" ou "87.10" para 87.10
   */
  private static normalizeValue(value: string): number {
    // Remove espaços
    let normalized = value.trim();
    
    // Se tem vírgula, substitui por ponto
    normalized = normalized.replace(',', '.');
    
    // Remove pontos que são separadores de milhar (ex: 1.000,00)
    // Mantém apenas o último ponto como decimal
    const parts = normalized.split('.');
    if (parts.length > 2) {
      normalized = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
    }
    
    return parseFloat(normalized);
  }

  /**
   * Detecta o tipo de operação (entrada, saída, diário ou consulta)
   */
  private static detectType(text: string): 'entrada' | 'saida' | 'diario' | 'saldo' | 'resumo' | 'hoje' | 'semana' | 'mes' {
    const lower = text.toLowerCase();
    
    // Comandos de consulta (sem valor)
    if (lower.match(/^(saldo|resumo|extrato)\s*(hoje|hj)?$/)) return 'hoje';
    if (lower.match(/^(saldo|resumo|extrato)\s*(semana|semanal)$/)) return 'semana';
    if (lower.match(/^(saldo|resumo|extrato)\s*(mes|mês|mensal)$/)) return 'mes';
    
    // Comandos de atualização (com valor)
    if (lower.includes('entrada')) return 'entrada';
    if (lower.includes('saida') || lower.includes('saída')) return 'saida';
    
    // Se tem só número, é diário
    if (/^\d+([,.]\d{1,2})?\s*(hoje|amanha|amanhã|\d{1,2}\/\d{1,2})?$/.test(lower)) return 'diario';
    
    // Padrão: diário
    return 'diario';
  }

  /**
   * Extrai o valor numérico da mensagem
   */
  private static extractValue(text: string): number | null {
    // Remove palavras-chave
    let cleanText = text
      .toLowerCase()
      .replace(/entrada|saida|saída|diario|diário|hoje|amanha|amanhã/gi, '')
      .trim();

    // Remove datas no formato dd/mm ou dd/mm/aaaa
    cleanText = cleanText.replace(/\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/g, '').trim();

    // Procura por número (pode ter vírgula ou ponto)
    const match = cleanText.match(/[\d]+[,.]?[\d]*/);
    
    if (match) {
      return this.normalizeValue(match[0]);
    }

    return null;
  }

  /**
   * Extrai a data da mensagem
   */
  private static extractDate(text: string): Date {
    const lower = text.toLowerCase();

    // Procura por "hoje"
    if (lower.includes('hoje')) {
      return DateHelper.parseDate('hoje');
    }

    // Procura por "amanha" ou "amanhã"
    if (lower.includes('amanha') || lower.includes('amanhã')) {
      return DateHelper.parseDate('amanha');
    }

    // Procura por formato dd/mm ou dd/mm/aaaa
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/);
    if (dateMatch) {
      return DateHelper.parseDate(dateMatch[1]);
    }

    // Padrão: hoje
    return new Date();
  }

  /**
   * Faz o parse completo da mensagem
   * 
   * Exemplos de atualização:
   * - "diario 87,10" → type: diario, value: 87.10, date: hoje
   * - "diario 400 amanha" → type: diario, value: 400, date: amanhã
   * - "517" → type: diario, value: 517, date: hoje
   * - "entrada 352,91 01/01" → type: entrada, value: 352.91, date: 01/01
   * - "saida 94,90 hoje" → type: saida, value: 94.90, date: hoje
   * 
   * Exemplos de consulta:
   * - "saldo" ou "resumo" → type: hoje, value: undefined, date: hoje
   * - "saldo semana" → type: semana, value: undefined
   * - "resumo mes" → type: mes, value: undefined
   */
  static parse(message: string): ParsedMessage | null {
    const trimmed = message.trim();
    
    if (!trimmed) {
      return null;
    }

    // Detecta o tipo
    const type = this.detectType(trimmed);

    // Se é comando de consulta, não precisa de valor
    if (['hoje', 'semana', 'mes'].includes(type)) {
      return {
        type: type as 'hoje' | 'semana' | 'mes',
        date: new Date(),
        rawText: trimmed
      };
    }

    // Para comandos de atualização, extrai o valor
    const value = this.extractValue(trimmed);
    if (value === null || isNaN(value)) {
      return null;
    }

    // Extrai a data
    const date = this.extractDate(trimmed);

    return {
      type,
      value,
      date,
      rawText: trimmed
    };
  }

  /**
   * Valida se a mensagem é um comando válido
   */
  static isValidCommand(message: string): boolean {
    return this.parse(message) !== null;
  }
}
