# 🎬 Configuração do Workflow VEO3 no n8n

## 📋 Pré-requisitos

1. **n8n** instalado e rodando
2. **Conta Browserless** (https://browserless.io) - plano gratuito disponível
3. **Conta Google** com acesso ao Veo3/VideoFX

---

## ⚙️ Passo 1: Configurar Variáveis de Ambiente no n8n

No seu n8n, vá em **Settings → Variables** e adicione:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `GOOGLE_EMAIL` | Email da conta Google | `seu.email@gmail.com` |
| `GOOGLE_PASSWORD` | Senha da conta Google | `sua_senha_aqui` |
| `BROWSERLESS_TOKEN` | Token da API Browserless | `abc123...` |

### Como obter o Browserless Token:
1. Acesse https://browserless.io
2. Crie uma conta (tem plano gratuito com 1000 requests/mês)
3. Copie o API Token do dashboard

---

## 📥 Passo 2: Importar o Workflow

1. No n8n, clique em **+ Add Workflow**
2. Clique nos 3 pontinhos (...) → **Import from File**
3. Selecione o arquivo `n8n-veo3-workflow.json`
4. Ou cole o JSON diretamente

---

## 🔑 Passo 3: Configurar Credencial HTTP Query Auth

O workflow usa autenticação via query param para Browserless:

1. Vá em **Credentials** no n8n
2. Clique em **+ Add Credential**
3. Escolha **HTTP Query Auth**
4. Configure:
   - **Name**: `Browserless Token`
   - **Parameter Name**: `token`
   - **Parameter Value**: `[seu BROWSERLESS_TOKEN]`

---

## 🌐 Passo 4: Ativar o Workflow

1. Abra o workflow importado
2. Clique no toggle **Active** no canto superior direito
3. Copie a URL do webhook (ex: `https://seu-n8n.com/webhook/veo3/generate`)

---

## 🔧 Passo 5: Configurar no Admin da Plataforma

1. Acesse `/admin` na plataforma
2. Vá na aba **APIs**
3. Em **n8n Webhook URL**, cole:
   ```
   https://seu-n8n.com/webhook/veo3/generate
   ```
4. Em **n8n Callback URL**, cole:
   ```
   https://kabnbvnephjifeazaiis.supabase.co/functions/v1/n8n-video-callback
   ```
5. Salve as configurações

---

## 📡 Como Funciona

```
┌─────────────────┐     ┌──────────────┐     ┌────────────────┐
│   Plataforma    │────▶│    n8n       │────▶│  Browserless   │
│  (Frontend)     │     │  (Webhook)   │     │  (Playwright)  │
└─────────────────┘     └──────────────┘     └────────────────┘
        │                       │                     │
        │                       │                     ▼
        │                       │              ┌────────────────┐
        │                       │              │   Google Veo3  │
        │                       │              │  (Video Gen)   │
        │                       │              └────────────────┘
        │                       │                     │
        │                       ◀─────────────────────┘
        │                       │ (video_url)
        │                       ▼
        │               ┌──────────────┐
        │               │   Callback   │
        │               │ (Supabase)   │
        │               └──────────────┘
        │                       │
        ◀───────────────────────┘
        │ (atualiza status)
        ▼
   [Vídeo pronto!]
```

### Fluxo Detalhado:

1. **Frontend** envia request para n8n com:
   - `prompt`: Descrição do vídeo
   - `job_id`: ID único do job
   - `callback_url`: URL para receber resultado
   - `duration`: Duração (8s padrão)
   - `aspect_ratio`: Proporção (16:9 padrão)

2. **n8n** retorna imediatamente `{ status: 'processing' }`

3. **Browserless** executa script Playwright que:
   - Faz login no Google
   - Acessa labs.google/fx/tools/video-fx
   - Preenche o prompt
   - Aguarda geração (até 5 min)
   - Captura URL do vídeo

4. **n8n** envia resultado para callback:
   ```json
   {
     "job_id": "xxx",
     "status": "completed",
     "video_url": "https://..."
   }
   ```

5. **Edge Function** (n8n-video-callback) atualiza a tabela `video_generation_jobs`

6. **Frontend** recebe atualização via polling ou realtime

---

## 🐛 Troubleshooting

### Erro: "GOOGLE_EMAIL e GOOGLE_PASSWORD devem estar configurados"
→ Configure as variáveis de ambiente no n8n

### Erro: "Browserless timeout"
→ Verifique se o token está correto e se tem requests disponíveis

### Erro: "Login falhou"
→ Verifique se a conta Google não tem 2FA ativado ou desative temporariamente

### Vídeo não é gerado em 5 minutos
→ O Veo3 pode estar com alta demanda. Tente novamente mais tarde.

---

## 🔒 Segurança

⚠️ **IMPORTANTE**: 
- Nunca compartilhe suas credenciais Google
- Use uma conta Google dedicada para automação
- Considere usar Google Cloud Service Account para produção
- O Browserless token deve ser mantido seguro

---

## 📊 Monitoramento

No n8n, você pode ver:
- **Executions**: Histórico de todas as execuções
- **Logs**: Logs detalhados de cada step
- **Errors**: Erros e falhas

---

## 💡 Dicas

1. **Teste primeiro manualmente**: Acesse labs.google/fx/tools/video-fx e gere um vídeo manualmente para garantir que sua conta tem acesso

2. **Monitore o uso**: Browserless tem limite de requests no plano gratuito

3. **Fallback**: A plataforma tem fallback para API Laozhang/Sora caso o n8n falhe
