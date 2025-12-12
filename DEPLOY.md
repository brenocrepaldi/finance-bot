# 🚀 Guia Completo de Deploy no Railway

## 📋 Pré-requisitos

- [ ] Conta no [Railway](https://railway.app/) (use GitHub para login)
- [ ] Código funcionando localmente
- [ ] Arquivo `.env` configurado corretamente
- [ ] Repositório Git (GitHub, GitLab ou Bitbucket)

---

## 🔧 Passo 1: Preparar o Projeto

### 1.1 Adicione as variáveis ao `.env` (NÃO commitar!)

Certifique-se que seu `.env` está completo:

```env
GOOGLE_PROJECT_ID=seu-projeto-id
GOOGLE_CLIENT_EMAIL=finance-bot@seu-projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE...\n-----END PRIVATE KEY-----\n"
SHEET_ID=1hBzCCegUwc2S9WlvIjBYEuh4uhaW-t4Ne0aWtt8BuiY
ALLOWED_CHATS=120363XXXXXXXXXX@g.us
```

### 1.2 Commit e push para o GitHub

```bash
git add .
git commit -m "Preparar para deploy no Railway"
git push origin main
```

**⚠️ IMPORTANTE:** O `.env` NÃO será enviado (está no .gitignore)

---

## 🚂 Passo 2: Criar Projeto no Railway

### 2.1 Acessar Railway

1. Acesse https://railway.app/
2. Clique em **Login** e use sua conta GitHub
3. Clique em **New Project**

### 2.2 Conectar Repositório

1. Selecione **Deploy from GitHub repo**
2. Autorize o Railway a acessar seus repositórios
3. Selecione o repositório `finance-bot`
4. Clique em **Deploy Now**

Railway detectará automaticamente o `Dockerfile` e começará o build!

---

## 🔐 Passo 3: Configurar Variáveis de Ambiente

### 3.1 Adicionar Variáveis

No dashboard do Railway:

1. Clique no seu projeto/serviço
2. Vá em **Variables**
3. Clique em **+ New Variable**
4. Adicione uma por uma:

```
GOOGLE_PROJECT_ID = gen-lang-client-0393851443

GOOGLE_CLIENT_EMAIL = finance-bot@gen-lang-client-0393851443.iam.gserviceaccount.com

GOOGLE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDEXUOLv9pYtM6l
+4vJOrH5MQDJ2hfARjFhuDoXb7zq7/rqL5q8zTBuY5WWFezRo973jV+yD9lMaCxX
...
-----END PRIVATE KEY-----

SHEET_ID = 1hBzCCegUwc2S9WlvIjBYEuh4uhaW-t4Ne0aWtt8BuiY

ALLOWED_CHATS = 120363XXXXXXXXXX@g.us
```

**⚠️ ATENÇÃO COM GOOGLE_PRIVATE_KEY:**
- Cole a chave COMPLETA (incluindo BEGIN e END)
- SEM aspas
- COM as quebras de linha reais (pressione Enter entre as linhas)

### 3.2 Salvar

Clique em **Add** para cada variável.

---

## 📱 Passo 4: Configurar Volume para Sessão WhatsApp

**IMPORTANTE:** Para não precisar escanear QR Code toda vez:

### 4.1 Criar Volume

1. No dashboard do Railway, vá em **Settings**
2. Role até **Volumes**
3. Clique em **+ New Volume**
4. Configure:
   - **Mount Path:** `/app/auth`
   - Clique em **Add**

Isso manterá a sessão do WhatsApp persistente!

---

## 🚀 Passo 5: Deploy e Primeira Execução

### 5.1 Triggerar Deploy

1. Vá em **Deployments**
2. O deploy deve iniciar automaticamente
3. Aguarde o build completar (2-5 minutos)

### 5.2 Ver Logs

1. Clique em **View Logs**
2. Você verá:

```
🚀 Iniciando Finance WhatsApp Bot...
📁 Pasta de autenticação: /app/auth
📦 Usando Baileys v2.3000.1027934701 (latest)
✨ Bot iniciado com sucesso!
📱 Aguardando QR Code...
```

### 5.3 **PROBLEMA:** QR Code não aparece nos logs!

O Railway não mostra caracteres especiais (QR Code) nos logs.

**Solução temporária:**

Vamos adicionar uma funcionalidade para salvar o QR Code como base64.

---

## 🔧 Passo 6: Escanear QR Code (Primeira Vez)

### Opção A: Deploy local primeiro, depois Railway

1. Rode localmente: `npm run dev`
2. Escaneie o QR Code
3. A sessão será salva em `auth/`
4. Copie a pasta `auth/` para o Railway usando CLI:

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Vincular ao projeto
railway link

# Copiar sessão
railway run bash
# Dentro do container, copie os arquivos manualmente
```

### Opção B: Modificar para enviar QR Code por webhook (RECOMENDADO)

Vou criar uma versão que envia o QR Code para seu WhatsApp pessoal!

---

## 📊 Passo 7: Monitoramento

### 7.1 Ver Logs em Tempo Real

```
railway logs
```

Ou no dashboard: **View Logs**

### 7.2 Verificar Status

- **Running** = Bot está ativo ✅
- **Crashed** = Erro, verifique logs ❌

---

## 🔄 Passo 8: Atualizações Futuras

Sempre que fizer mudanças:

```bash
git add .
git commit -m "Descrição da mudança"
git push origin main
```

Railway fará deploy automaticamente! 🚀

---

## 💰 Custos

**Plano Gratuito:**
- $5 de crédito/mês
- Suficiente para um bot simples
- Sem cartão de crédito necessário

**Se ultrapassar:**
- ~$0.000463/GB-hora de RAM
- ~$0.000231/vCPU-hora

Para um bot leve: **~$1-3/mês**

---

## ⚠️ Troubleshooting

### Bot não conecta no Railway

1. Verifique as variáveis de ambiente
2. Veja os logs: `railway logs`
3. Certifique-se que o volume está montado em `/app/auth`

### QR Code não aparece

Use a solução abaixo para enviar QR Code por webhook ou email.

### Bot desconecta frequentemente

Normal nas primeiras vezes. A sessão persistente resolve isso.

### Erro "Bad MAC"

Delete o volume e escaneie QR Code novamente:
1. Settings > Volumes > Delete
2. Criar volume novamente
3. Redeploy

---

## 🎯 Próximo Passo

Vou criar uma versão melhorada que:
1. ✅ Salva QR Code como imagem
2. ✅ Envia QR Code para seu WhatsApp/Email
3. ✅ Facilita primeira conexão no Railway

Quer que eu implemente isso agora?
