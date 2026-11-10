import Link from "next/link";
import { Revelar } from "./movimento";

// Seção de largura total com título simples.
export function Secao({
  id,
  titulo,
  rotulo,
  link,
  children,
}: {
  id?: string;
  titulo: string;
  rotulo?: string;
  link?: { href: string; texto: string };
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="w-full scroll-mt-20 px-4 py-14 sm:px-8 lg:px-12">
      <Revelar className="vidro-liquido mb-8 flex flex-wrap items-end justify-between gap-4 rounded-3xl px-6 py-5">
        <div>
          {rotulo && <div className="rotulo mb-2 text-lima">{rotulo}</div>}
          <h2 className="titulo text-3xl sm:text-4xl">{titulo}</h2>
        </div>
        {link && (
          <Link href={link.href} className="text-sm text-suave transition hover:text-texto">
            {link.texto} →
          </Link>
        )}
      </Revelar>
      {children}
    </section>
  );
}
