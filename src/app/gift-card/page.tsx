
'use client';

import { GiftCardForm } from "@/components/gift-card/gift-card-form";
import { Shield, Award, Users, Clock, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function GiftCardPublicPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden bg-primary text-primary-foreground">
        <div className="container px-4 mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block px-3 py-1 mb-6 text-xs font-bold tracking-widest uppercase bg-white/10 rounded-full">
              Gift Card Krav Magá Ipiranga
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Dê o Presente da Segurança: Aula Particular no CT Krav Magá Ipiranga
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/80 mb-8 leading-relaxed">
              Transforme a vida de quem você ama com uma experiência única de empoderamento, confiança e defesa pessoal.
            </p>
            <a href="#buy-now" className="inline-flex items-center justify-center h-14 px-8 font-bold text-primary bg-white rounded-md hover:bg-primary-foreground transition-colors shadow-lg">
              GARANTIR MEU GIFT CARD AGORA
            </a>
          </div>
        </div>
        {/* Background Accent */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-10">
              <div>
                <h2 className="text-3xl font-bold mb-6">Mais do que um presente, uma ferramenta para a vida.</h2>
                <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                  <p>
                    Desde 2013, o CT Krav Magá Ipiranga transforma vidas através da técnica e da consciência. Sob a coordenação do especialista e autor renomado, Thiago R. Pedro, oferecemos o que há de mais moderno em Krav Magá.
                  </p>
                  <p>
                    No Centro de Treinamento de Krav Magá Ipiranga, acreditamos que a segurança é o maior bem que alguém pode possuir. Ao presentear com nosso Gift Card de Aula Particular, você não está apenas oferecendo uma aula técnica; você está proporcionando:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FeatureCard 
                  icon={<Shield className="h-6 w-6 text-primary" />} 
                  title="Confiança Inabalável" 
                  description="Aprender a identificar e reagir a situações de risco." 
                />
                <FeatureCard 
                  icon={<CheckCircle2 className="h-6 w-6 text-primary" />} 
                  title="Técnica Eficaz" 
                  description="Instrução personalizada com foco na realidade urbana." 
                />
                <FeatureCard 
                  icon={<Award className="h-6 w-6 text-primary" />} 
                  title="Exclusividade" 
                  description="Sessão dedicada inteiramente ao aprendizado do presenteado." 
                />
                <FeatureCard 
                  icon={<Users className="h-6 w-6 text-primary" />} 
                  title="Reconhecimento" 
                  description='Self Defence School of the Year 2025.' 
                />
              </div>

              <div className="p-8 rounded-xl bg-muted/50 border border-border">
                <h3 className="text-xl font-bold mb-4">Para quem é este presente?</h3>
                <p className="text-muted-foreground">
                  Para qualquer pessoa, independentemente do porte físico ou idade, que deseja se sentir mais segura no dia a dia. É o presente ideal para amigos, familiares ou parceiros que valorizam o autodesenvolvimento e a proteção.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold">Detalhes da Experiência</h3>
                <ul className="space-y-3">
                  <DetailItem icon={<Clock />} text="Duração: Até 1h30 de treinamento intensivo e personalizado." />
                  <DetailItem icon={<Shield />} text="Local: CT Krav Magá Ipiranga (Infraestrutura completa e segura)." />
                  <DetailItem icon={<Award />} text="Investimento: R$ 330,00." />
                  <DetailItem icon={<CheckCircle2 />} text="Validade: 90 dias após a compra." />
                </ul>
              </div>
            </div>

            {/* Form Section */}
            <div id="buy-now" className="lg:sticky lg:top-8 scroll-mt-24">
              <GiftCardForm />
              
              <div className="mt-8 space-y-6">
                <h3 className="text-xl font-bold text-center">O que acontece após a compra?</h3>
                <div className="grid gap-4">
                  <PostStep 
                    num="1" 
                    title="Confirmação" 
                    desc="O comprador recebe um e-mail com a informação que após a confirmação do pagamento, receberá o gift card." 
                  />
                  <PostStep 
                    num="2" 
                    title="Envio do Gift Card" 
                    desc="Um arquivo digital elegante (PDF ou Imagem) é enviado ao e-mail do comprador para que ele possa imprimir ou enviar." 
                  />
                  <PostStep 
                    num="3" 
                    title="Agendamento" 
                    desc="O presenteado entra em contato conosco via WhatsApp para escolher o melhor dia e horário." 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/30">
        <div className="container px-4 mx-auto text-center">
          <p className="font-bold mb-2">Centro de Treinamento Krav Magá Ipiranga</p>
          <p className="text-sm text-muted-foreground">© 2025 Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-lg border bg-card hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h4 className="font-bold mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function DetailItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-1 text-primary shrink-0">{icon}</div>
      <span className="text-muted-foreground">{text}</span>
    </li>
  );
}

function PostStep({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-lg bg-white shadow-sm border border-border/50">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
        {num}
      </div>
      <div>
        <h4 className="font-bold text-sm mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
