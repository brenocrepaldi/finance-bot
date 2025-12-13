import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Gerenciador de conexão com Google Sheets API
 */
export class GoogleSheetsService {
  private auth: JWT;
  private sheets;
  private spreadsheetId: string;

  constructor() {
    // Verifica variáveis de ambiente
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.SHEET_ID) {
      throw new Error('Variáveis de ambiente do Google Sheets não configuradas corretamente');
    }

    // Configura autenticação
    this.auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.spreadsheetId = process.env.SHEET_ID;
  }

  /**
   * Lê dados de uma célula específica
   */
  async readCell(range: string): Promise<string | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range,
      });

      const values = response.data.values;
      if (values && values.length > 0 && values[0].length > 0) {
        return values[0][0];
      }

      return null;
    } catch (error) {
      console.error('Erro ao ler célula:', error);
      throw error;
    }
  }

  /**
   * Escreve dados em uma célula específica
   */
  async writeCell(range: string, value: string | number): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[value]],
        },
      });
    } catch (error) {
      console.error('Erro ao escrever célula:', error);
      throw error;
    }
  }

  /**
   * Lê um intervalo de células
   */
  async readRange(range: string): Promise<any[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range,
      });

      return response.data.values || [];
    } catch (error) {
      console.error('Erro ao ler intervalo:', error);
      throw error;
    }
  }

  /**
   * Escreve em múltiplas células
   */
  async writeRange(range: string, values: any[][]): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: values,
        },
      });
    } catch (error) {
      console.error('Erro ao escrever intervalo:', error);
      throw error;
    }
  }

  /**
   * Lê múltiplas células/ranges de uma vez (batch read)
   * Reduz drasticamente o número de requisições à API
   */
  async batchRead(ranges: string[]): Promise<Map<string, string | null>> {
    try {
      const response = await this.sheets.spreadsheets.values.batchGet({
        spreadsheetId: this.spreadsheetId,
        ranges: ranges,
      });

      const result = new Map<string, string | null>();
      
      response.data.valueRanges?.forEach((valueRange, index) => {
        const range = ranges[index];
        const values = valueRange.values;
        
        if (values && values.length > 0 && values[0].length > 0) {
          result.set(range, values[0][0]);
        } else {
          result.set(range, null);
        }
      });

      return result;
    } catch (error) {
      console.error('Erro ao ler células em batch:', error);
      throw error;
    }
  }
}
