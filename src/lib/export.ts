import { AppState } from '../types';
import { calcular, diasDelPeriodo, objetivoDiario, totalIngresos, diaYMes, pesos, suma, tieneCuotas } from './calculator';

const aBytes = (txt: string) => new TextEncoder().encode(txt);

const aBase64 = (bytes: Uint8Array) => {
  let b = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    b += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return btoa(b);
};

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(b: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = TABLA_CRC[(c ^ b[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function juntarBytes(lista: Uint8Array[]) {
  const total = lista.reduce((t, x) => t + x.length, 0);
  const salida = new Uint8Array(total);
  let pos = 0;
  lista.forEach(x => {
    salida.set(x, pos);
    pos += x.length;
  });
  return salida;
}

function crearZip(archivos: { n: string; d: Uint8Array }[]) {
  const u16 = (n: number) => [n & 255, (n >> 8) & 255];
  const u32 = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  const locales: Uint8Array[] = [];
  const centrales: Uint8Array[] = [];
  let pos = 0;

  archivos.forEach(a => {
    const nombre = aBytes(a.n);
    const crc = crc32(a.d);
    const tam = a.d.length;
    const local = Uint8Array.from(
      ([] as number[]).concat(
        u32(0x04034b50),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(0),
        u16(0x21),
        u32(crc),
        u32(tam),
        u32(tam),
        u16(nombre.length),
        u16(0)
      )
    );
    locales.push(local, nombre, a.d);
    centrales.push(
      Uint8Array.from(
        ([] as number[]).concat(
          u32(0x02014b50),
          u16(20),
          u16(20),
          u16(0x0800),
          u16(0),
          u16(0),
          u16(0x21),
          u32(crc),
          u32(tam),
          u32(tam),
          u16(nombre.length),
          u16(0),
          u16(0),
          u16(0),
          u16(0),
          u32(0),
          u32(pos)
        )
      ),
      nombre
    );
    pos += local.length + nombre.length + tam;
  });

  const central = juntarBytes(centrales);
  const fin = Uint8Array.from(
    ([] as number[]).concat(
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(archivos.length),
      u16(archivos.length),
      u32(central.length),
      u32(pos),
      u16(0)
    )
  );

  return juntarBytes(locales.concat([central, fin]));
}

export function datosExportar(S: AppState, hoy: string) {
  const c = calcular(S, hoy);
  const dias = diasDelPeriodo(S, hoy);
  const o = objetivoDiario(S, hoy);
  const fecha = (iso: string) => diaYMes(iso) + '/' + iso.slice(0, 4);

  const resumen: [string, string | number, boolean?][] = [
    ['Período', fecha(S.start) + ' al ' + fecha(S.end)],
    ['Total de ingresos', totalIngresos(S), true],
    ['Total gastos importantes', c.total, true],
    ['Todavía por pagar', c.porPagar, true],
    ['Disponible del mes', c.disp, true],
    ['Base por día', c.base, true],
    ['Gastado en el período', suma((S.spent || []).filter(e => !e.meta), e => e.amt), true],
    ['Saldo', c.saldo, true],
  ];

  if (o) {
    resumen.push(['Objetivo por día', o.obj, true], ['Te sobra si lo cumplís', o.proyectado, true]);
  }
  if (c.fondo.activo) {
    resumen.push(
      ['Ahorrado en el período', c.fondo.ahorroPeriodo || 0, true],
      ['Fondo de ahorro total', c.fondo.totalConRend || 0, true]
    );
  }

  return {
    hoy,
    fecha,
    resumen,
    dias: dias.map(x => ({
      fecha: fecha(x.iso),
      dia: x.dia,
      presupuesto: x.presupuesto,
      gasto: x.gasto,
      sobra: x.sobra,
      pasado: x.i <= c.hoyIdx || !!x.gasto,
    })),
    gastos: [...(S.spent || [])]
      .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
      .map(e => ({
        fecha: fecha(e.date),
        cat: e.cat || '',
        nota: e.note || '',
        amt: e.amt,
        tipo: e.meta ? 'Aporte a meta' : 'Gasto',
      })),
    importantes: (S.items || [])
      .filter(i => i.n || i.a)
      .map(i => ({
        n: i.n || '',
        a: i.a || 0,
        estado: i.p ? 'Pagado' : 'Pendiente',
        cuotas: tieneCuotas(i) ? `${i.q!.actual} de ${i.q!.total}` : '',
      })),
  };
}

const xmlEsc = (s: unknown) =>
  String(s)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));

type CellValue = string | number | { s?: string; b?: number; m?: number };
const XT = (s: string): CellValue => ({ s, b: 1 });
const XM = (n: number): CellValue => ({ m: n });

function celdaXlsx(v: CellValue, r: number, c: number) {
  if (v === '' || v == null) return '';
  const ref = String.fromCharCode(65 + c) + (r + 1);
  if (typeof v === 'number') return Number.isFinite(v) ? `<c r="${ref}"><v>${v}</v></c>` : '';
  if (typeof v === 'object' && v.m !== undefined) {
    return Number.isFinite(v.m) ? `<c r="${ref}" s="2"><v>${Math.round(v.m * 100) / 100}</v></c>` : '';
  }
  const texto = typeof v === 'object' && v.s !== undefined ? v.s : String(v);
  const bold = typeof v === 'object' && v.b ? ' s="1"' : '';
  return `<c r="${ref}" t="inlineStr"${bold}><is><t xml:space="preserve">${xmlEsc(texto)}</t></is></c>`;
}

function hojaXlsx(filas: CellValue[][], anchos: number[]) {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<cols>' +
    anchos.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('') +
    '</cols><sheetData>' +
    filas.map((f, r) => `<row r="${r + 1}">${f.map((v, c) => celdaXlsx(v, r, c)).join('')}</row>`).join('') +
    '</sheetData></worksheet>'
  );
}

export function xlsxExportar(d: ReturnType<typeof datosExportar>) {
  const hojas: [string, CellValue[][], number[]][] = [
    [
      'Resumen',
      ([[XT('Mi Plata'), XT('Resumen del período')]] as CellValue[][]).concat(
        d.resumen.map(r => [r[0], r[2] ? XM(Number(r[1])) : String(r[1])])
      ),
      [30, 26],
    ],
    [
      'Días',
      ([[XT('Fecha'), XT('Día'), XT('Presupuesto'), XT('Gasto'), XT('Sobrante')]] as CellValue[][]).concat(
        d.dias.map(x => [x.fecha, x.dia, XM(x.presupuesto), x.gasto ? XM(x.gasto) : '', x.pasado ? XM(x.sobra) : ''])
      ),
      [14, 12, 16, 16, 16],
    ],
    [
      'Gastos anotados',
      ([[XT('Fecha'), XT('Categoría'), XT('Detalle'), XT('Monto'), XT('Tipo')]] as CellValue[][]).concat(
        d.gastos.map(x => [x.fecha, x.cat, x.nota, XM(x.amt), x.tipo])
      ),
      [14, 16, 36, 16, 16],
    ],
    [
      'Gastos importantes',
      ([[XT('Concepto'), XT('Monto'), XT('Estado'), XT('Cuotas')]] as CellValue[][]).concat(
        d.importantes.map(x => [x.n, XM(x.a), x.estado, x.cuotas])
      ),
      [34, 16, 14, 12],
    ],
  ];

  const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const cab = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

  const archivos = [
    [
      '[Content_Types].xml',
      cab +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        hojas
          .map(
            (_, i) =>
              `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
          )
          .join('') +
        '</Types>',
    ],
    [
      '_rels/.rels',
      cab +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ],
    [
      'xl/workbook.xml',
      cab +
        `<workbook xmlns="${ns}" xmlns:r="${rel}"><sheets>` +
        hojas.map((h, i) => `<sheet name="${xmlEsc(h[0])}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
        '</sheets></workbook>',
    ],
    [
      'xl/_rels/workbook.xml.rels',
      cab +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        hojas
          .map((_, i) => `<Relationship Id="rId${i + 1}" Type="${rel}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
          .join('') +
        `<Relationship Id="rId${hojas.length + 1}" Type="${rel}/styles" Target="styles.xml"/></Relationships>`,
    ],
    [
      'xl/styles.xml',
      cab +
        `<styleSheet xmlns="${ns}"><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0;[Red]\\-&quot;$&quot;#,##0"/></numFmts>` +
        '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
        '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
        '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    ],
  ].concat(hojas.map((h, i) => [`xl/worksheets/sheet${i + 1}.xml`, hojaXlsx(h[1], h[2])]));

  return crearZip(archivos.map(a => ({ n: a[0], d: aBytes(a[1]) })));
}

const pdfTxt = (s: unknown) =>
  String(s)
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\xFF]/g, '')
    .replace(/[\\()]/g, '\\$&');

export function crearPdf(lineas: { t: string; g?: number; b?: number }[], pie: string) {
  const TOPE = 800,
    BASE = 50,
    ALTO_LINEA = 12.5,
    porPagina = Math.floor((TOPE - BASE) / ALTO_LINEA);
  const paginas: { t: string; g?: number; b?: number }[][] = [];
  for (let i = 0; i < lineas.length; i += porPagina) paginas.push(lineas.slice(i, i + porPagina));
  if (!paginas.length) paginas.push([{ t: '' }]);

  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${paginas.map((_, k) => 6 + k * 2 + ' 0 R').join(' ')}] /Count ${paginas.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ];

  paginas.forEach((pagina, k) => {
    let y = TOPE,
      cs = '';
    pagina.forEach(l => {
      cs += `BT /${l.g ? 'F3' : l.b ? 'F2' : 'F1'} ${l.g ? 16 : 9.5} Tf 40 ${y.toFixed(1)} Td (${pdfTxt(l.t)}) Tj ET\n`;
      y -= ALTO_LINEA;
    });
    cs += `BT /F1 8 Tf 40 28 Td (${pdfTxt(pie + '  -  página ' + (k + 1) + ' de ' + paginas.length)}) Tj ET\n`;
    objetos.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${
        7 + k * 2
      } 0 R >>`
    );
    objetos.push(`<< /Length ${cs.length} >>\nstream\n${cs}endstream`);
  });

  let pdf = '%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n';
  const offsets: number[] = [];
  objetos.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf +=
    `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n` +
    offsets.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') +
    `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return Uint8Array.from(pdf, ch => ch.charCodeAt(0));
}

export function pdfExportar(d: ReturnType<typeof datosExportar>) {
  const izq = (t: unknown, n: number) => String(t).slice(0, n).padEnd(n);
  const der = (t: unknown, n: number) => String(t).slice(0, n).padStart(n);

  const L: { t: string; g?: number; b?: number }[] = [
    { t: 'Mi Plata - Resumen de Finanzas', g: 1 },
    { t: '' },
    { t: 'Creado el ' + d.fecha(d.hoy), b: 0 },
    { t: '' },
    { t: 'RESUMEN DEL PERÍODO', b: 1 },
  ];

  d.resumen.forEach(r => L.push({ t: izq(r[0], 34) + der(r[2] ? pesos(Number(r[1])) : r[1], r[2] ? 16 : 28) }));
  L.push(
    { t: '' },
    { t: 'DÍA POR DÍA', b: 1 },
    { t: izq('Día', 15) + der('Presupuesto', 14) + der('Gasto', 14) + der('Sobrante', 14), b: 1 }
  );

  d.dias.forEach(x =>
    L.push({
      t:
        izq(x.dia.slice(0, 3) + ' ' + x.fecha, 15) +
        der(pesos(x.presupuesto), 14) +
        der(x.gasto ? pesos(x.gasto) : '', 14) +
        der(x.pasado ? pesos(x.sobra) : '', 14),
    })
  );

  L.push({ t: '' }, { t: 'GASTOS ANOTADOS', b: 1 });
  if (!d.gastos.length) L.push({ t: 'Todavía no hay gastos anotados.' });
  d.gastos.forEach(x =>
    L.push({
      t:
        izq(x.fecha.slice(0, 5), 7) +
        izq((x.tipo === 'Gasto' ? (x.cat ? x.cat + ' - ' : '') : '') + (x.nota || x.tipo), 46) +
        der(pesos(x.amt), 14),
    })
  );

  L.push({ t: '' }, { t: 'PAGAR AL COBRAR / MERCADO PAGO', b: 1 });
  if (!d.importantes.length) L.push({ t: 'No cargaste gastos importantes.' });
  d.importantes.forEach(x =>
    L.push({
      t: izq(x.n, 34) + der(pesos(x.a), 14) + '  ' + x.estado + (x.cuotas ? ' (cuota ' + x.cuotas + ')' : ''),
    })
  );

  return crearPdf(L, 'Mi Plata App Multiplataforma');
}

export function descargarArchivo(nombre: string, bytes: Uint8Array, tipo: string) {
  const url = URL.createObjectURL(new Blob([bytes as any], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function descargarTexto(nombre: string, texto: string) {
  const url = URL.createObjectURL(new Blob([texto], { type: 'application/json;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
