// Divisão vetorial de pixels inteiros, sem filtros ou desfoque.
const ALTURAS = [8, 8, 16, 8, 24, 16, 8, 8, 0, 8, 16, 24, 16, 8, 16, 8];
function degraus(deslocamento: number) {
  let linha = "M0 64V" + (32 - ALTURAS[deslocamento % ALTURAS.length]);
  for (let x = 0; x < 1600; x += 16) {
    linha += "H" + x + "V" + (32 - ALTURAS[(x / 16 + deslocamento) % ALTURAS.length]);
  }
  return linha + "H1600V64Z";
}

export function DivisoriaPixel() {
  return (
    <div aria-hidden="true" className="divisoria-pixel">
      <svg className="divisoria-relevo" viewBox="0 0 1600 64" preserveAspectRatio="none" shapeRendering="crispEdges">
        <path d={degraus(0)} fill="currentColor" opacity=".12" />
        <path d={degraus(5)} fill="currentColor" opacity=".2" transform="translate(0 12)" />
        <path d={degraus(9)} fill="var(--color-noite)" transform="translate(0 24)" />
      </svg>
      <div className="divisoria-trilha" />
      <span className="divisoria-emblema">
        <svg width="24" height="24" viewBox="0 0 15 15" fill="currentColor" shapeRendering="crispEdges">
          <path d="M6 0h3v3h3v3h3v3h-3v3H9v3H6v-3H3V9H0V6h3V3h3z" />
          <path d="M6 6h3v3H6z" fill="var(--color-noite)" />
        </svg>
      </span>
    </div>
  );
}