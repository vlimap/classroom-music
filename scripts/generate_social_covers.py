"""Gera imagens JPEG horizontais para prévias Open Graph a partir de capas existentes.

Execução: python scripts/generate_social_covers.py
Requer Pillow. Não adiciona texto ou dados editoriais às imagens.
"""
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
COVERS = ROOT / "covers" / "podcasts"
OUTPUT = ROOT / "covers" / "social"
SIZE = (1200, 630)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    inputs = sorted(path for path in COVERS.glob("*.webp")
                    if not path.stem.endswith("-card"))
    if not inputs:
        raise RuntimeError("Nenhuma capa de episódio encontrada")

    for path in inputs:
        destination = OUTPUT / (path.stem + ".jpg")
        with Image.open(path) as original:
            img = ImageOps.fit(
                original.convert("RGB"),
                SIZE,
                method=Image.Resampling.LANCZOS,
                centering=(0.5, 0.5),
            )
            img.save(
                destination, format="JPEG", quality=86,
                optimize=True, progressive=True, subsampling=0,
            )
        with Image.open(destination) as result:
            assert result.size == SIZE and result.format == "JPEG"
        size = destination.stat().st_size
        if size > 5_000_000:
            raise ValueError(f"Prévia excede 5 MB: {destination.name}")
        print(f"{destination.relative_to(ROOT)}: {size} bytes")

    expected = {path.stem + ".jpg" for path in inputs}
    for extra in OUTPUT.glob("*.jpg"):
        if extra.name not in expected:
            extra.unlink()
            print(f"Removida imagem desatualizada: {extra.name}")


if __name__ == "__main__":
    main()
