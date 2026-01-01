import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.gif";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-amber-400 to-primary animate-spin-slow opacity-75 blur-sm" />
                <img src={logo} alt="La Casa Dark CORE" className="w-12 h-12 rounded-full relative z-10 border-2 border-primary" />
              </div>
              <span className="font-bold text-xl">La Casa Dark <span className="text-primary">CORE</span></span>
            </Link>
            
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-32 pb-20 px-4">
        <article className="max-w-4xl mx-auto prose prose-invert prose-lg">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-foreground">
            Política de <span className="text-primary">Privacidade</span>
          </h1>
          
          <p className="text-muted-foreground text-lg mb-8">
            Última atualização: 1 de Janeiro de 2026
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Introdução</h2>
            <p className="text-muted-foreground leading-relaxed">
              O La Casa Dark CORE ("nós", "nosso" ou "Plataforma") está comprometido em proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações pessoais quando você usa nossos serviços.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Informações que Coletamos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Coletamos os seguintes tipos de informações:
            </p>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">2.1 Informações Pessoais</h3>
            <ul className="text-muted-foreground space-y-2 mb-6">
              <li>Nome completo</li>
              <li>Endereço de email</li>
              <li>Número de telefone (opcional)</li>
              <li>Informações de pagamento</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3">2.2 Informações de Uso</h3>
            <ul className="text-muted-foreground space-y-2 mb-6">
              <li>Dados de navegação e interação com a plataforma</li>
              <li>Endereço IP e informações do dispositivo</li>
              <li>Conteúdo gerado usando nossas ferramentas</li>
              <li>Histórico de análises e gerações</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3">2.3 Integrações</h3>
            <ul className="text-muted-foreground space-y-2">
              <li>Dados de canais do YouTube conectados</li>
              <li>APIs de terceiros autorizadas pelo usuário</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Como Usamos suas Informações</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Utilizamos suas informações para:
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li>Fornecer e manter nossos serviços</li>
              <li>Processar pagamentos e gerenciar sua conta</li>
              <li>Personalizar sua experiência na plataforma</li>
              <li>Enviar comunicações importantes sobre o serviço</li>
              <li>Melhorar nossas ferramentas com base em padrões de uso</li>
              <li>Prevenir fraudes e garantir segurança</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Não vendemos suas informações pessoais. Podemos compartilhar dados com:
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li><strong>Processadores de pagamento:</strong> Para processar transações</li>
              <li><strong>Provedores de infraestrutura:</strong> Para hospedagem e armazenamento</li>
              <li><strong>Serviços de IA:</strong> Para processamento de conteúdo (sem identificação pessoal)</li>
              <li><strong>Autoridades legais:</strong> Quando exigido por lei</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Segurança dos Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Implementamos medidas técnicas e organizacionais para proteger suas informações, incluindo:
            </p>
            <ul className="text-muted-foreground mt-4 space-y-2">
              <li>Criptografia de dados em trânsito e em repouso</li>
              <li>Autenticação segura e controle de acesso</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares e planos de recuperação</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Seus Direitos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar exclusão de dados</li>
              <li>Portabilidade de dados</li>
              <li>Revogar consentimento</li>
              <li>Opor-se ao tratamento de dados</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Cookies e Tecnologias Similares</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar uso da plataforma e personalizar conteúdo. Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Retenção de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos suas informações pessoais enquanto sua conta estiver ativa ou conforme necessário para fornecer serviços. Após o encerramento da conta, retemos dados por até 5 anos para fins legais e de auditoria.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">9. Alterações nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre alterações significativas através do email cadastrado ou de aviso em nossa plataforma.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">10. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para questões sobre esta política ou para exercer seus direitos, entre em contato:
            </p>
            <ul className="text-muted-foreground mt-4 space-y-2">
              <li><strong>Email:</strong> <a href="mailto:privacidade@lacasadark.com" className="text-primary hover:underline">privacidade@lacasadark.com</a></li>
              <li><strong>Suporte:</strong> <a href="mailto:suporte@lacasadark.com" className="text-primary hover:underline">suporte@lacasadark.com</a></li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">11. Encarregado de Proteção de Dados (DPO)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nosso Encarregado de Proteção de Dados pode ser contatado através do email: <a href="mailto:dpo@lacasadark.com" className="text-primary hover:underline">dpo@lacasadark.com</a>
            </p>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 La Casa Dark CORE. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-foreground transition-colors">Termos de Uso</Link>
            <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
