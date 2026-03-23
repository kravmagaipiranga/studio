import { MessageTemplate } from "./types";

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "vencimento",
    name: "Lembrete de Vencimento",
    subject: "Lembrete de Mensalidade - Krav Magá Ipiranga",
    body: `Olá, {{nome}}! Tudo bem? 👊

Passando para lembrar que seu plano de Krav Magá ({{plano}}) vence em {{vencimento}}.

O valor para renovação é R$ {{valor}}.

Caso queira agilizar, você pode pagar via PIX usando a chave: thiago@kravmaga.org.br (CNPJ: 31.116.136/0001-95).

Se o pagamento já foi realizado, por favor desconsidere esta mensagem. Qualquer dúvida, estamos à disposição!

Kida! 🛡️`
  },
  {
    id: "boas_vindas",
    name: "Boas-vindas",
    subject: "Bem-vindo ao CT Krav Magá Ipiranga!",
    body: `Olá, {{nome}}! Seja muito bem-vindo(a) ao nosso Centro de Treinamento! 🥊

Ficamos felizes em ter você conosco. Lembre-se que seu plano foi registrado como {{plano}} e sua data de início foi {{inicio}}.

Aqui vão algumas dicas para você aproveitar ao máximo suas aulas conosco!

- Nosso Centro de Treinamento possui vestiários e armários. Use-os como precisar, seja para colocar seu uniforme ou roupa de treino depois de chegar na academia, seja para guardar seus pertences em segurança (não use relógios, pulseiras, colares ou anéis durante os treinos, eles podem causar graves acidentes ou quebrar).
- Antes de entrar ou sair do tatame, avise o instrutor. Isso é importante para evitar acidentes e para todos saberem que você está bem.
- Ouça seu corpo e obedeça ao seu ritmo individual. Qualquer lesão ocorrida pelo excesso de disposição ou pela falta de preparo irá atrapalhar sua rotina e trazer problemas. 
- Ouça seu instrutor! Ele já tem muito tempo de experiência, e irá ajudá-lo a encontrar seu ritmo de treino e a maneira correta de fazê-lo sem se lesionar, aprendendo a técnica de forma mais rápida. Não deixe que a ansiedade e o ego atrapalhem suas ações e causem danos a você e a seu corpo!
- Comece devagar. Essa é a melhor forma de ganhar, gradualmente, força, agilidade e técnica, sem se machucar. Mantenha o foco na técnica e na execução do exercício, e espere o momento certo para aumentar força e velocidade. Fazer certo é melhor que fazer rápido. Quando a técnica estiver boa, gradativamente aumente seu velocidade e sua intensidade de treino.
- Absorva o máximo de informações possível. Aulas de Krav Magá exigem concentração e atenção do aluno.
- Pergunte. Não tenha medo de fazer perguntas quando não entender algo. Seu instrutor e seus colegas de treino estão lá para ajudar você! Todos sairão ganhando quando você entender o exercício corretamente. 
- Treine! Não é preciso falar, mas, o único jeito de aprender e ficar bom em algo é treinando. Repita o exercício incontáveis números de vezes, não pare o treino enquanto o instrutor não solicitar ou não mudar de exercício. Preste atenção em cada detalhe do movimento e de seu corpo.

Dicas para Recuperação Pós Aula:
- Hidrate-se! Beba bastante água durante o dia, antes e após seu treino. Se preciso for, beba também durante, mas DO LADO DE FORA do tatame. A água ajuda na recuperação muscular e no funcionamento correto do seu corpo. Desidratação pode causar cãibra, fadiga e outros problemas mais graves.
- Alongue! O alongamento ajuda a prevenir leões. Alongamentos dinâmicos ajudam a soltar a musculatura e deixá-los prontos para o exercício, enquanto alongamentos estáticos ajudam a deixar a musculatura menos rígida e menos dolorida.
- Descanse! Dê ao seu corpo um tempo de recuperação após a aula. Tenha uma boa noite de sono e se alimente de uma forma saudável para seus músculos se recuperarem! E não se assuste caso você sinta algum tipo de desconforto ou dor muscular após as primeiras aulas. Essa condição é absolutamente normal, e durará até que seu corpo se acostume com as aulas.

Tome sempre todos os cuidados necessários e mantenha o foco e a determinação para atingir seus objetivos. Só assim você será capaz de ir longe e obter sempre os melhores resultados, no seu treino e na sua vida!

Qualquer dúvida sobre horários ou uniformes, pode nos chamar por aqui.

Bom treino! Kida! 👊`
  },
  {
    id: "planos_vencidos",
    name: "Planos Vencidos",
    subject: "Lembrete de Pagamento - Krav Magá Ipiranga",
    body: `Olá, {{nome}}! Tudo bem?

Somos do Krav Magá Ipiranga. Entramos em contato para lembrar que seu plano venceu em {{vencimento}}.

Para renovar e continuar treinando, você pode fazer o pagamento através do nosso link: https://kravmagaipiranga.com/pgto

Ou, se preferir, via PIX usando a chave: thiago@kravmaga.org.br (CNPJ: 31.116.136/0001-95).

Se o pagamento já foi efetuado, por favor, desconsidere esta mensagem.

Qualquer dúvida, estamos à disposição!
Kida!`
  },
  {
    id: "planos_vencidos_trimestral",
    name: "Planos Vencidos (Trimestral)",
    subject: "Lembrete de Pagamento - Krav Magá Ipiranga",
    body: `Olá, {{nome}}! Estamos entrando em contato para lembrar que seu plano trimestral expirou. O pagamento referente aos meses {{meses_cobertos}} foi realizado em {{data_pagamento}}.

Com isso, o prazo para pagamento da próxima mensalidade irá vencer nos próximos dias. O QR code para realizar seu próximo pagamento pode ser encontrado no link: https://kravmagaipiranga.com/pgto

Caso prefira pagar diretamente por PIX, use a chave thiago@kravmaga.org.br ou o CNPJ 31116136000195.

Essa é uma mensagem automática de nosso sistema. Caso já tenha realizado o pagamento, desconsidere esse email.

Qualquer dúvida, estamos à disposição! Até a aula! Kida!`
  },
  {
    id: "leads_cat_cpkm",
    name: "Leads CAT CPKM",
    subject: "Aula Experimental Gratuita - Krav Magá Ipiranga",
    body: `Olá, {{nome}}! Tudo bem? 👋

Aqui é o Professor Thiago, do Centro de Krav Magá Ipiranga.

Recentemente, você entrou em contato com a Central de Atendimento para saber mais sobre nossa academia. Gostaria de te convidar para sentir na pele a segurança e a confiança que o Krav Magá proporciona através de uma aula experimental gratuita. 🛡️

Você sabia que o Centro de Treinamento Krav Magá Ipiranga foi oficialmente premiado com o título "Self Defence School of the Year 2025 – South East Brazil", no GHP Active Lifestyle Awards 2025?

O prêmio reconhece instituições que se destacam na promoção de saúde, bem-estar, estilo de vida ativo e segurança pessoal, avaliando critérios como impacto social, qualidade dos serviços, compromisso com os alunos, profissionalismo e contribuição para o desenvolvimento da comunidade.

Com mais de 27 anos de experiência, somos o maior CT da região e estamos prontos para te ajudar a descobrir sua força.

Horários disponíveis para iniciantes:
🔹 Seg/Qua: 18h e 20h
🔹 Ter/Qui: 19h e 20h
🔹 Sáb: 10h30

Podemos reservar sua vaga para esta semana?

Basta responder por aqui ou clicar no link: 🔗 https://form.jotform.com/kravmagaipiranga/agende

Qualquer dúvida, estou à disposição! 👊

Professor Thiago
kravmagaipiranga.com`
  },
  {
    id: "mes_das_mulheres",
    name: "Mês das Mulheres",
    subject: "Campanha Mês das Mulheres - Krav Magá Ipiranga",
    body: `Olá, {{nome}}! Tudo bem? 👋

Aqui é o Professor Thiago, do Centro de Krav Magá Ipiranga.

Vimos seu interesse na nossa campanha especial do Mês das Mulheres! 🛡️

Sua vaga para realizar um mês de aulas gratuitas durante o mês de março na turma de *{{turma}}* está pré-reservada.

Gostaria de confirmar sua participação? Alguma dúvida sobre como funciona o treino ou localização?

Estamos ansiosos para te receber no tatame! 👊`
  },
  {
    id: "agendamentos_instrucoes",
    name: "Agendamentos: Instruções de Aula",
    subject: "Sua Aula Experimental - Krav Magá Ipiranga",
    body: `Olá, {{nome_completo}}! Tudo bem? 
Na próxima {{dia_semana}}, dia {{data_aula}}, você fará sua aulas de experiência gratuita no Centro de Treinamento de Krav Magá Ipiranga!

Para sua aula, utilize uma roupa confortável, a mesma que usaria para um passeio ao parque, ou para a prática de uma atividade física (como a musculação, por exemplo). Recomendamos o uso de uma calça (pode ser um moletom, legging ou uma calça de kimono) e camiseta.

📋 Abaixo, listamos algumas Informações Importantes para Suas Aulas de Krav Magá:

📍 Estrutura do Centro:
- Nossa academia possui vestiários e armários, disponíveis para que você possa guardar pertences e trocar de roupa, antes ou após as aulas.
- Retire todos os acessórios (relógios, pulseiras, colares, anéis) antes do treino para evitar acidentes.  

🗣️ Durante a Aula:  
- Comunique-se com o instrutor ao entrar/sair do tatame.  
- Respeite seu corpo: evite exageros para prevenir lesões.  
- Informe ao instrutor qualquer dor ou condição médica (tratamento de coluna, problemas de glicemia ou pressão, problemas cardíacos, limitação de movimentos em membros, etc) 
- Siga as orientações do instrutor à risca – a experiência dele é seu guia!  
- Priorize a técnica, não a velocidade. A evolução vem com consistência.  
- Concentre-se e absorva cada detalhe.  
- Pergunte sempre se tiver dúvidas – todos estão ali para aprender juntos!

Nos vemos na aula! Kida!`
  },
  {
    id: "agendamentos_faltou",
    name: "Agendamentos: Faltou",
    subject: "Sentimos sua falta! - Krav Magá Ipiranga",
    body: `Oi, {{nome}}, tudo bem? Notamos que você não conseguiu comparecer ao seu treino experimental na semana passada e sentimos sua falta!

Sabemos que a correria do dia a dia e os imprevistos podem desanimar, mas o Krav Magá é justamente sobre superar esses obstáculos e fortalecer sua mente. A disciplina é o que nos leva além, mesmo nos dias em que o cansaço tenta vencer. ✨

Que tal darmos esse primeiro passo juntos agora? Vamos agendar um novo horário para você vivenciar essa experiênica. Qual dia e horário desta semana funcionam melhor para você? 👊`
  },
  {
    id: "agendamentos_obrigado",
    name: "Agendamentos: Obrigado/Pós Aula",
    subject: "Obrigado pela sua visita! - Krav Magá Ipiranga",
    body: `Olá, {{nome}}! Foi uma satisfação ter você conosco no nosso treino! 👊
Parabéns por dar esse primeiro passo. No Krav Magá, técnica e confiança andam juntas, e você já mostrou que tem a determinação necessária para se proteger e viver com mais segurança.

Queremos muito que você faça parte da nossa família aqui no CT Ipiranga! Para incentivar sua continuidade, temos um presente: 25% de desconto na sua camiseta oficial de treino (válido por 7 dias). Basta mostrar este print na recepção. 🎁

Pronto para o próximo nível? Faça sua matrícula no link abaixo:
👉 https://tinyurl.com/kmipiranga

Nos vemos no tatame!
Professor Thiago R. Pedro`
  },
];

export function getTemplateBody(templates: MessageTemplate[], id: string): string {
  return templates.find(t => t.id === id)?.body ?? (DEFAULT_TEMPLATES.find(t => t.id === id)?.body ?? "");
}

export function applyTemplateVars(body: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((text, [key, value]) => {
    return text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }, body);
}
