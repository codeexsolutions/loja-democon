import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Produto } from "@/lib/tipos";
import { estiloUniverso, type Universo } from "@/lib/universos";
import { Revelar } from "./movimento";

// Lookbook: um capítulo por coleção, só com a foto principal do ensaio.
export function Lookbook({ itens }: { itens: { produto: Produto; universo: Universo }[] }) {
  return (
    <div>
      {itens.map(({ produto: p, universo: u }, i) => (
        <article key={p.id} id={`lookbook-${u.chave}`} className="capitulo scroll-mt-24" data-lado={i % 2 ? "direita" : "esquerda"} style={estiloUniverso(u)}>
          <Revelar className="capitulo-cena">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u.fotos.cena} alt={`Ensaio da camisa ${u.nome}`} loading="lazy" />
            <div className="capitulo-texto vidro-liquido">
              <div className="capitulo-numero">Capítulo {String(i + 1).padStart(2, "0")} · {u.kanji}</div>
              <h3 className={"capitulo-titulo " + (u.fonte === "gotica" ? "titulo-gotica" : "titulo-hq")}>{u.nome}</h3>
              <p className="capitulo-frase">{u.frase}</p>
              <ul className="capitulo-detalhes">
                {u.detalhes.map((d) => <li key={d}>{d}</li>)}
              </ul>
              <Link href={`/produto/${p.id}`} className="btn-banner">
                Quero essa <ArrowRight size={18} />
              </Link>
            </div>
          </Revelar>
        </article>
      ))}
    </div>
  );
}
