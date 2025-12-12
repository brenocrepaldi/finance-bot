import { GoogleSheetsService } from '../sheets/googleSheets';
import { SheetUpdater } from '../sheets/sheetUpdater';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Script de teste para verificar conexão com Google Sheets
 */
async function testGoogleSheets() {
  console.log('🧪 Iniciando testes do Google Sheets...\n');

  try {
    // Teste 1: Conexão básica
    console.log('📝 Teste 1: Verificando conexão...');
    const sheetsService = new GoogleSheetsService();
    console.log('✅ Serviço criado com sucesso!\n');

    // Teste 2: Leitura de teste
    console.log('📖 Teste 2: Tentando ler célula B6 (dia 1 de janeiro)...');
    try {
      const value = await sheetsService.readCell('B6');
      console.log(`✅ Leitura bem-sucedida! Valor: "${value || 'vazio'}"\n`);
    } catch (error) {
      console.error('❌ Erro ao ler célula:', error);
      throw error;
    }

    // Teste 3: Escrita de teste
    console.log('✍️  Teste 3: Tentando escrever "TESTE" na célula E6 (Diário dia 1 de Janeiro)...');
    try {
      await sheetsService.writeCell('E6', 'TESTE');
      console.log('✅ Escrita bem-sucedida!\n');
    } catch (error) {
      console.error('❌ Erro ao escrever célula:', error);
      throw error;
    }

    // Teste 4: Verificar se escreveu
    console.log('🔍 Teste 4: Verificando se o valor foi escrito...');
    try {
      const valueAfter = await sheetsService.readCell('E6');
      if (valueAfter === 'TESTE') {
        console.log('✅ Valor confirmado! Google Sheets está funcionando!\n');
      } else {
        console.log(`⚠️  Valor diferente do esperado: "${valueAfter}"\n`);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar célula:', error);
      throw error;
    }

    // Teste 5: SheetUpdater
    console.log('🔧 Teste 5: Testando SheetUpdater...');
    const updater = new SheetUpdater();
    
    const testUpdate = {
      type: 'diario' as const,
      value: 123456789.45,
      day: 1,
      month: 1, // Janeiro
      year: 2025
    };

    console.log(`   Tentando registrar: R$ ${testUpdate.value} no diário do dia ${testUpdate.day}/01/2025`);
    const response = await updater.updateValue(testUpdate);
    
    if (response.success) {
      console.log(`✅ ${response.message}`);
      if (response.details) {
        console.log(`   Coluna: ${response.details.column}`);
        console.log(`   Valor: ${response.details.value}`);
      }
    } else {
      console.log(`❌ ${response.message}`);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 Todos os testes concluídos!');
    console.log('═'.repeat(60));
    console.log('\n📋 Verifique sua planilha:');
    console.log(`   https://docs.google.com/spreadsheets/d/${process.env.SHEET_ID}/edit`);
    console.log('\n   Você deve ver:');
    console.log('   - Célula E6 com valor R$ 123,45 (Diário do dia 1 de Janeiro)');
    console.log('   - Linha 6 corresponde ao dia 1');
    console.log('   - Coluna E é a coluna Diário de Janeiro');

  } catch (error) {
    console.error('\n❌ ERRO NOS TESTES:', error);
    console.log('\n🔍 Possíveis problemas:');
    console.log('   1. Service Account não tem permissão de Editor na planilha');
    console.log('   2. SHEET_ID incorreto no .env');
    console.log('   3. GOOGLE_PRIVATE_KEY malformatada no .env');
    console.log('   4. Google Sheets API não está ativada no projeto');
    process.exit(1);
  }
}

// Executa os testes
testGoogleSheets();
