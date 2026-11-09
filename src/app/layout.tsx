import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { CarrinhoProvider } from "@/lib/carrinho";
import { LojaProvider } from "@/lib/loja";
import { buscarVitrine } from "@/lib/servidor";
import { Topo } from "@/components/topo";
import { Rodape } from "@/components/rodape";
import { CarrinhoGaveta } from "@/components/carrinho-gaveta";
import { Movimento } from "@/components/movimento";
import { FundoPixel } from "@/components/fundo-pixel";

const titulo = Bricolage_Grotesque({ variable: "--font-titulo", subsets: ["latin"] });
const corpo = Space_Grotesk({ variable: "--font-corpo", subsets: ["latin"] });

export const viewport: Viewport = { themeColor: "#08070c" };

export async function generateMetadata(): Promise<Metadata> {
  const v = await buscarVitrine();
  if (v.estado !== "ok") return { title: "Loja não encontrada" };
  return {
    title: { default: v.loja.nome, template: `%s | ${v.loja.nome}` },
    description: `Camisas e jerseys geek na ${v.loja.nome}. Escolha, monte o carrinho e finalize pelo WhatsApp.`,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const v = await buscarVitrine();

  return (
    // suppressHydrationWarning: extensões do navegador (tradutores, etc.) mexem na tag <html>
    // antes do React carregar e geravam um aviso falso de hidratação.
    <html lang="pt-BR" className={`${titulo.variable} ${corpo.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-svh overflow-x-hidden">
        <FundoPixel />
        {v.estado === "ok" ? (
          <LojaProvider loja={v.loja}>
            <CarrinhoProvider>
              <Movimento>
                <Topo />
                {children}
                <Rodape />
                <CarrinhoGaveta />
              </Movimento>
            </CarrinhoProvider>
          </LojaProvider>
        ) : (
          <main className="flex min-h-svh items-center justify-center p-6 text-center">
            <div className="cartao max-w-md space-y-3 p-10">
              <h1 className="titulo text-3xl">
                {v.estado === "sem_loja" ? "Loja não encontrada" : "Loja fora do ar"}
              </h1>
              <p className="text-suave">
                {v.estado === "sem_loja"
                  ? "Esse endereço não leva a nenhuma loja. Confira o que foi digitado."
                  : "Não conseguimos carregar a loja agora. Tente de novo em instantes."}
              </p>
            </div>
          </main>
        )}
      </body>
    </html>
  );
}
