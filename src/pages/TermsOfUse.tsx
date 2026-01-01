import { motion } from "framer-motion";
import { Crown, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";

const TermsOfUse = () => {
  return (
    <>
      <Helmet>
        <title>Termos de Uso | La Casa Dark CORE</title>
        <meta name="description" content="Termos de uso da plataforma La Casa Dark CORE para criação de canais dark no YouTube." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary via-orange-500 to-yellow-500 flex items-center justify-center">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="font-black text-lg sm:text-xl text-foreground">La Casa Dark</span>
              <span className="font-black text-lg sm:text-xl text-primary">CORE</span>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
                Termos de <span className="text-primary">Uso</span>
              </h1>
              <p className="text-muted-foreground mb-8">Última atualização: Janeiro de 2026</p>

              <div className="prose prose-invert max-w-none space-y-8">
                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">1. Aceitação dos Termos</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    Ao acessar e utilizar a plataforma La Casa Dark CORE, você concorda com estes Termos de Uso. 
                    Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
                    O uso contínuo da plataforma constitui aceitação de quaisquer atualizações destes termos.
                  </p>
                </section>

                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">2. Descrição do Serviço</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    A La Casa Dark CORE oferece ferramentas de inteligência artificial para criação, 
                    automação e gestão de canais no YouTube. Nossos serviços incluem geração de roteiros, 
                    criação de thumbnails, narração por IA, analytics avançados e automação de publicação.
                  </p>
                </section>

                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">3. Período de Teste</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    Oferecemos um período de teste gratuito para novos usuários experimentarem a plataforma
                    antes de efetuar qualquer assinatura. Durante este período, você terá acesso às funcionalidades
                    principais para avaliar se o serviço atende às suas necessidades.
                  </p>
                </section>

                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">4. Responsabilidades do Usuário</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4 text-sm sm:text-base">O usuário se compromete a:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 text-sm sm:text-base">
                    <li>Utilizar a plataforma de acordo com as políticas do YouTube</li>
                    <li>Não criar conteúdo que viole direitos autorais</li>
                    <li>Manter suas credenciais de acesso seguras</li>
                    <li>Não compartilhar sua conta com terceiros</li>
                    <li>Respeitar os limites de uso do seu plano</li>
                  </ul>
                </section>

                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">5. Propriedade Intelectual</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    Todo o conteúdo gerado através da plataforma é de propriedade do usuário. 
                    A La Casa Dark CORE mantém os direitos sobre a tecnologia, marca e interfaces da plataforma.
                    O usuário não pode redistribuir ou revender as ferramentas da plataforma.
                  </p>
                </section>

                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">6. Pagamentos e Cancelamento</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    As assinaturas são cobradas mensalmente ou anualmente conforme o plano escolhido.
                    O usuário pode cancelar sua assinatura a qualquer momento através da plataforma.
                    Após o cancelamento, o acesso permanece ativo até o fim do período já pago.
                  </p>
                </section>

                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">7. Limitação de Responsabilidade</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    A La Casa Dark CORE não se responsabiliza por decisões tomadas pelo YouTube em relação 
                    aos canais dos usuários. Os resultados variam de acordo com o nicho, estratégia e dedicação
                    de cada usuário. Não garantimos resultados específicos de monetização.
                  </p>
                </section>

                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">8. Modificações dos Termos</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    Reservamos o direito de modificar estes termos a qualquer momento. 
                    Notificaremos os usuários sobre mudanças significativas por e-mail ou através da plataforma.
                    O uso continuado após modificações implica aceitação dos novos termos.
                  </p>
                </section>

                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">9. Contato</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    Para dúvidas sobre estes termos, entre em contato através do e-mail: 
                    <span className="text-primary"> suporte@lacasadark.com</span>
                  </p>
                </section>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
};

export default TermsOfUse;
