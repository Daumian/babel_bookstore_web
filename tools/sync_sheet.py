#!/usr/bin/env python3
"""Sincroniza libros.json desde el CSV publicado del Google Sheet.

Solo usa la librería estándar. Si algo sale mal (descarga, CSV vacío o con
muy pocas filas) termina con código != 0 SIN tocar libros.json.

Uso: python3 tools/sync_sheet.py [--csv archivo_local.csv] [--out libros.json]
"""
import argparse
import csv
import io
import json
import os
import re
import sys
import urllib.request

CSV_URL = (
    "https://docs.google.com/spreadsheets/d/e/"
    "2PACX-1vRhVwjqJDm812fcM1MMifZh0kK19AMzh1urMD_5eZnPTyONUtWItBnYVLpxwUNf7XNTxaf4WnwPoKYy"
    "/pub?gid=1555136311&single=true&output=csv"
)
# Si el CSV trae menos de este % de los libros actuales, no se sobrescribe.
MIN_RATIO = 0.70
REQUIRED_COLUMNS = {"titulo", "idioma"}

IDIOMAS = {
    "ingles": "Inglés",
    "frances": "Francés",
    "aleman": "Alemán",
    "italiano": "Italiano",
    "portuges": "Portugués",
    "portugues": "Portugués",
    "hebreo": "Hebreo",
    "espanol": "Español",
}


def fail(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def sin_tildes(s):
    return (s.lower().replace("á", "a").replace("é", "e").replace("í", "i")
            .replace("ó", "o").replace("ú", "u").replace("ñ", "n"))


def normalizar_idioma(raw):
    partes = [p.strip() for p in raw.split(",") if p.strip()]
    return ", ".join(IDIOMAS.get(sin_tildes(p), p) for p in partes)


def parsear_precio(raw):
    """'$5,000' / '$5.000' / '5000' -> 5000. Vacío o inválido -> None."""
    s = re.sub(r"[^\d.,]", "", raw or "")
    if not s:
        return None
    s = re.sub(r"[.,]\d{1,2}$", "", s)  # descarta centavos (5.000,50)
    s = re.sub(r"[.,]", "", s)
    return int(s) if s else None


def descargar():
    req = urllib.request.Request(CSV_URL, headers={"User-Agent": "babel-bookstore-sync"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.read().decode("utf-8-sig")
    except Exception as e:
        fail(f"no se pudo descargar el CSV: {e}")


def convertir(texto):
    reader = csv.DictReader(io.StringIO(texto))
    cols = {(c or "").strip().lower() for c in (reader.fieldnames or [])}
    faltan = REQUIRED_COLUMNS - cols
    if faltan:
        fail(f"faltan columnas en el CSV: {', '.join(sorted(faltan))} (llegaron: {sorted(cols)})")

    libros = []
    for fila in reader:
        f = {(k or "").strip().lower(): (v or "").strip() for k, v in fila.items()}
        if not f.get("titulo"):
            continue
        libros.append({
            "ID": f.get("id", ""),
            "Nombre": f["titulo"],
            "Autor": f.get("autor", ""),
            "Genero": f.get("genero", ""),
            "Estado": f.get("estado", ""),
            "Idioma": normalizar_idioma(f.get("idioma", "")),
            "Precio": parsear_precio(f.get("precio", "")),
            "URL_Foto": f.get("imagen", ""),
        })
    return libros


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", help="usar un CSV local en vez de descargarlo (para probar)")
    ap.add_argument("--out", default="libros.json")
    args = ap.parse_args()

    if args.csv:
        with open(args.csv, encoding="utf-8-sig") as fh:
            texto = fh.read()
    else:
        texto = descargar()

    if not texto.strip():
        fail("el CSV vino vacío")
    libros = convertir(texto)
    if not libros:
        fail("el CSV no tiene libros válidos")

    actuales = 0
    if os.path.exists(args.out):
        try:
            with open(args.out, encoding="utf-8") as fh:
                actuales = len(json.load(fh))
        except Exception:
            actuales = 0
    if actuales and len(libros) < actuales * MIN_RATIO:
        fail(f"el CSV trae {len(libros)} libros y libros.json tiene {actuales} "
             f"(mínimo aceptado {int(actuales * MIN_RATIO)}). No se sobrescribe.")

    salida = json.dumps(libros, ensure_ascii=False, indent=4) + "\n"
    try:
        with open(args.out, encoding="utf-8") as fh:
            if fh.read() == salida:
                print("Sin cambios.")
                return
    except FileNotFoundError:
        pass
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(salida)
    print(f"libros.json actualizado: {len(libros)} libros (antes {actuales}).")


if __name__ == "__main__":
    main()
