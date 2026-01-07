# Deploy no EasyPanel

## Configuração de Domínios

### Landing Page: www.canaisdarks.com.br
- Redireciona automaticamente para `/landing`
- Público, sem autenticação

### Aplicação: app.canaisdarks.com.br  
- Aplicação completa com dashboard
- Requer autenticação

---

## Passos para Deploy no EasyPanel

### 1. Criar Projeto no EasyPanel
1. Acesse seu painel EasyPanel
2. Clique em **"New Project"**
3. Nome: `canaisdarks`

### 2. Criar Serviço
1. Dentro do projeto, clique em **"+ Service"**
2. Selecione **"App"** → **"Docker"**
3. Configure:
   - **Name**: `app`
   - **Source**: GitHub ou upload do código
   - **Dockerfile Path**: `./Dockerfile`

### 3. Configurar Domínios
No serviço criado, vá em **"Domains"** e adicione:

#### Domínio 1 - Landing
- **Domain**: `www.canaisdarks.com.br`
- **Port**: `80`
- **HTTPS**: Ativado

#### Domínio 2 - Landing (sem www)
- **Domain**: `canaisdarks.com.br`
- **Port**: `80`
- **HTTPS**: Ativado

#### Domínio 3 - Aplicação
- **Domain**: `app.canaisdarks.com.br`
- **Port**: `80`
- **HTTPS**: Ativado

### 4. Configurar DNS
No seu provedor de domínio, configure:

```
Tipo    Nome    Valor
A       @       [IP do servidor EasyPanel]
A       www     [IP do servidor EasyPanel]
A       app     [IP do servidor EasyPanel]
```

### 5. Variáveis de Ambiente (Opcional)
Se precisar adicionar variáveis de ambiente, vá em **"Environment"**:
```
NODE_ENV=production
```

### 6. Deploy
1. Clique em **"Deploy"**
2. Aguarde o build completar
3. Teste os domínios

---

## Comandos Úteis (Docker Local)

```bash
# Build da imagem
docker build -t canaisdarks .

# Rodar localmente
docker run -p 80:80 canaisdarks

# Com docker-compose
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

---

## Modo Manutenção

### Antes de um Deploy
1. Acesse o **Painel Admin** → **Manutenção Global**
2. Ative o modo manutenção
3. Configure a mensagem e previsão de retorno
4. Todos os usuários serão redirecionados para `/maintenance`
5. Após o deploy, desative o modo manutenção

### URL de Manutenção
- https://app.canaisdarks.com.br/maintenance

---

## Verificação

Após deploy, verifique:
- [ ] https://www.canaisdarks.com.br → Redireciona para landing
- [ ] https://canaisdarks.com.br → Redireciona para landing  
- [ ] https://app.canaisdarks.com.br → Abre aplicação completa
- [ ] Health check: https://app.canaisdarks.com.br/health
- [ ] Modo manutenção funciona corretamente

---

## Troubleshooting

### Erro 502 Bad Gateway
- Verifique se o container está rodando
- Cheque os logs: `docker logs canaisdarks-app`

### SSL não funciona
- Aguarde propagação DNS (até 48h)
- Verifique se os registros A estão corretos

### Página em branco
- Limpe cache do navegador
- Verifique console do navegador por erros
