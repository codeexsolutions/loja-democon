import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center px-4 pt-24 text-center">
      <div className="cartao flex max-w-md flex-col items-center gap-4 p-10">
        <div className="rotulo text-lima">Erro 404</div>
        <h1 className="titulo text-4xl">Página não encontrada</h1>
        <p className="text-suave">Esse produto ou página não existe mais.</p>
        <Link href="/catalogo" className="btn">
          Voltar ao catálogo
        </Link>
      </div>
    </main>
  );
}
