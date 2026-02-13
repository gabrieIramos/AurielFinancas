import { X, Shield, AlertTriangle, Lock, Eye, FileText, Scale, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface PrivacySecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "dark" | "light";
}

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  theme: "dark" | "light";
  defaultOpen?: boolean;
}

function AccordionItem({ title, icon, children, theme, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`${theme === "dark" ? "bg-zinc-800/50" : "bg-zinc-50"} rounded-xl overflow-hidden`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-4 flex items-center justify-between ${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100"} transition-colors`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className={`font-medium ${theme === "dark" ? "text-white" : "text-black"}`}>{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className={`w-5 h-5 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`} />
        ) : (
          <ChevronDown className={`w-5 h-5 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`} />
        )}
      </button>
      {isOpen && (
        <div className={`px-4 pb-4 ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"} text-sm leading-relaxed`}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function PrivacySecurityModal({ isOpen, onClose, theme }: PrivacySecurityModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto">
      <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-white"} w-full min-h-screen`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 ${theme === "dark" ? "bg-zinc-900/95" : "bg-white/95"} backdrop-blur-sm px-4 py-4 flex items-center justify-between border-b ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600/20 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>
                Privacidade e Segurança
              </h2>
              <p className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Termos, políticas e avisos importantes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
          >
            <X className={`w-5 h-5 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-6 space-y-4">
          {/* Aviso Importante sobre IA */}
          <div className={`p-4 rounded-xl ${theme === "dark" ? "bg-amber-900/20 border border-amber-800/30" : "bg-amber-50 border border-amber-200"}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className={`font-semibold mb-2 ${theme === "dark" ? "text-amber-400" : "text-amber-700"}`}>
                  Aviso Importante sobre Uso de IA
                </h3>
                <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-amber-200/80" : "text-amber-800"}`}>
                  As sugestões e análises geradas por inteligência artificial neste aplicativo têm caráter meramente 
                  informativo e educacional. <strong>Não constituem recomendação, aconselhamento ou ordem de investimento.</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Accordion Sections */}
          <AccordionItem
            title="Dados Enviados para a IA"
            icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
            theme={theme}
            defaultOpen={false}
          >
            <div className="space-y-3">
              <p>
                Para fornecer análises e sugestões personalizadas, alguns dados financeiros são 
                enviados para processamento por inteligência artificial. Prezamos pela transparência 
                e você tem o direito de saber exatamente quais informações são compartilhadas.
              </p>
              
              <p><strong>Dados que podem ser enviados para a IA:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Descrição e categoria das transações</li>
                <li>Valores e datas das movimentações financeiras</li>
                <li>Composição da carteira de investimentos</li>
                <li>Histórico de receitas e despesas</li>
              </ul>

              <p><strong>O que NÃO é enviado:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Seu nome, CPF ou documentos pessoais</li>
                <li>Dados bancários (número de conta, agência, senhas)</li>
                <li>Endereço ou informações de contato</li>
                <li>Dados de cartão de crédito</li>
              </ul>

              <p><strong>Garantias de privacidade:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  Os dados são enviados de forma <strong>anonimizada</strong>, sem identificação pessoal.
                </li>
                <li>
                  As requisições são processadas em tempo real e <strong> não são armazenadas </strong> 
                  permanentemente nos servidores da IA.
                </li>
                <li>
                  Utilizamos provedores de IA que garantem que os dados <strong>não são usados para 
                  treinar</strong> seus modelos (OpenAI API com data privacy).
                </li>
                <li>
                  Toda comunicação é feita via conexões <strong>criptografadas (HTTPS/TLS)</strong>.
                </li>
              </ul>

              <div className={`mt-3 p-3 rounded-lg ${theme === "dark" ? "bg-zinc-700/50" : "bg-zinc-100"}`}>
                <p className="text-xs">
                  <strong>💡 Dica:</strong> Você pode usar o recurso de IA sem preocupações. 
                  Seus dados financeiros são tratados com o máximo sigilo e nunca são associados 
                  à sua identidade real nos processamentos externos.
                </p>
              </div>
            </div>
          </AccordionItem>

          <AccordionItem
            title="Isenção de Responsabilidade"
            icon={<Scale className="w-5 h-5 text-blue-400" />}
            theme={theme}
          >
            <div className="space-y-3">
              <p>
                O Auriel Finanças é uma ferramenta de organização e gestão financeira pessoal. 
                As informações, análises e sugestões fornecidas pelo aplicativo, incluindo aquelas 
                geradas por inteligência artificial, são de natureza exclusivamente informativa.
              </p>
              <p>
                <strong>Importante:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  As análises de IA <strong>não substituem</strong> o aconselhamento de um profissional 
                  qualificado e certificado (CVM, ANBIMA, CFP®).
                </li>
                <li>
                  Decisões de investimento devem ser tomadas após consulta com assessores de 
                  investimentos, consultores financeiros ou analistas devidamente credenciados.
                </li>
                <li>
                  Rentabilidade passada não é garantia de rentabilidade futura. Todo investimento 
                  envolve riscos, incluindo a possível perda do capital investido.
                </li>
                <li>
                  O aplicativo não se responsabiliza por perdas financeiras decorrentes de decisões 
                  tomadas com base nas informações apresentadas.
                </li>
              </ul>
            </div>
          </AccordionItem>

          <AccordionItem
            title="Política de Privacidade"
            icon={<Eye className="w-5 h-5 text-purple-400" />}
            theme={theme}
          >
            <div className="space-y-3">
              <p>
                O Auriel Finanças está comprometido com a proteção dos seus dados pessoais, 
                em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
              
              <p><strong>Dados que coletamos:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Informações de cadastro (nome, e-mail)</li>
                <li>Dados financeiros inseridos voluntariamente por você</li>
                <li>Informações de uso do aplicativo para melhoria dos serviços</li>
              </ul>

              <p><strong>Como utilizamos seus dados:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Fornecer e personalizar os serviços do aplicativo</li>
                <li>Gerar análises e insights financeiros personalizados</li>
                <li>Melhorar continuamente a experiência do usuário</li>
                <li>Comunicar atualizações importantes sobre o serviço</li>
              </ul>

              <p><strong>Seus direitos (LGPD):</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Acesso aos seus dados pessoais</li>
                <li>Correção de dados incompletos ou desatualizados</li>
                <li>Anonimização, bloqueio ou eliminação de dados</li>
                <li>Portabilidade dos dados</li>
                <li>Revogação do consentimento a qualquer momento</li>
              </ul>
            </div>
          </AccordionItem>

          <AccordionItem
            title="Segurança dos Dados"
            icon={<Lock className="w-5 h-5 text-emerald-400" />}
            theme={theme}
          >
            <div className="space-y-3">
              <p>
                Implementamos medidas técnicas e organizacionais para proteger seus dados:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>Criptografia:</strong> Seus dados são criptografados em trânsito (HTTPS/TLS) 
                  e em repouso.
                </li>
                <li>
                  <strong>Autenticação segura:</strong> Sistema de autenticação robusto com proteção 
                  contra ataques.
                </li>
                <li>
                  <strong>Acesso restrito:</strong> Apenas você tem acesso aos seus dados financeiros. 
                  Nossa equipe não acessa informações pessoais sem sua autorização expressa.
                </li>
                <li>
                  <strong>Backups regulares:</strong> Realizamos backups periódicos para garantir a 
                  disponibilidade dos seus dados.
                </li>
                <li>
                  <strong>Monitoramento contínuo:</strong> Sistemas de detecção de ameaças e 
                  monitoramento de segurança 24/7.
                </li>
              </ul>
            </div>
          </AccordionItem>

          <AccordionItem
            title="Termos de Uso"
            icon={<FileText className="w-5 h-5 text-orange-400" />}
            theme={theme}
          >
            <div className="space-y-3">
              <p>
                Ao utilizar o Auriel Finanças, você concorda com os seguintes termos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  O aplicativo é destinado exclusivamente para uso pessoal de organização financeira.
                </li>
                <li>
                  Você é responsável pela veracidade das informações inseridas no aplicativo.
                </li>
                <li>
                  É proibido utilizar o aplicativo para atividades ilegais ou não autorizadas.
                </li>
                <li>
                  Reservamo-nos o direito de modificar, suspender ou descontinuar o serviço a 
                  qualquer momento.
                </li>
                <li>
                  Atualizações nos termos serão comunicadas através do aplicativo ou por e-mail.
                </li>
              </ul>

              <p className="mt-4">
                <strong>Limitação de responsabilidade:</strong> O Auriel Finanças não será responsável 
                por danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou 
                incapacidade de uso do aplicativo.
              </p>
            </div>
          </AccordionItem>

          {/* Consulte um Especialista */}
          <div className={`p-4 rounded-xl ${theme === "dark" ? "bg-emerald-900/20 border border-emerald-800/30" : "bg-emerald-50 border border-emerald-200"}`}>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className={`font-semibold mb-2 ${theme === "dark" ? "text-emerald-400" : "text-emerald-700"}`}>
                  Consulte Sempre um Especialista
                </h3>
                <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-emerald-200/80" : "text-emerald-800"}`}>
                  Antes de tomar qualquer decisão de investimento, recomendamos fortemente que você 
                  consulte um profissional qualificado e registrado nos órgãos competentes (CVM, ANBIMA). 
                  Um assessor de investimentos pode ajudá-lo a entender seu perfil de risco e definir 
                  a melhor estratégia para seus objetivos financeiros.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`mt-6 pt-4 border-t ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}>
            <p className={`text-xs text-center ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
              Última atualização: Janeiro de 2026
            </p>
            <p className={`text-xs text-center mt-1 ${theme === "dark" ? "text-zinc-600" : "text-zinc-500"}`}>
              © 2026 Auriel Finanças. Todos os direitos reservados.
            </p>
            <p className={`text-xs text-center mt-2 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
              Dúvidas? Entre em contato: suporte@aurielfinancas.com.br
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
