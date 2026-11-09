import Link from "next/link";
import { linkCatalogo, type Colecao } from "@/lib/catalogo";
import { Revelar } from "./movimento";

// As coleções da loja (uma por categoria), com as camisas em leque na capa.
export function Colecoes({ colecoes }: { colecoes: Colecao[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {colecoes.map((c, i) => {
        const meio = (c.capas.length - 1) / 2;
        return (
          <Revelar key={c.nome} atraso={i * 0.06}>
            <Link href={linkCatalogo(c.nome)} className="group cartao block overflow-hidden transition hover:border-white/20">
              <div
                className="foto-produto relative h-52 overflow-hidden"
                style={{ "--c1": c.cores[0], "--c2": c.cores[1] } as React.CSSProperties}
              >
                {c.capas.map((src, k) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt=""
                    loading="lazy"
                    className="absolute top-6 h-40 w-36 rounded-xl object-cover shadow-lg transition duration-500 group-hover:-translate-y-1"
                    style={{
                      left: `calc(50% - 72px + ${(k - meio) * 70}px)`,
                      rotate: `${(k - meio) * 7}deg`,
                      zIndex: k === Math.round(meio) ? 2 : 1,
                    }}
                  />
                ))}
              </div>
              <div className="flex items-end justify-between gap-3 p-5">
                <div>
                  <h3 className="titulo text-2xl">{c.nome}</h3>
                  <span className="text-sm text-suave">
                    {c.total} {c.total === 1 ? "produto" : "produtos"}
                  </span>
                </div>
                <span className="text-sm font-medium text-suave transition group-hover:text-lima">Ver →</span>
              </div>
            </Link>
          </Revelar>
        );
      })}
    </div>
  );
}
