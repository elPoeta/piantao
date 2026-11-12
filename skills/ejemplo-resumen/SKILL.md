---
name: ejemplo-resumen
description: Resume un texto o archivo en 5 viñetas con un título; usala cuando el usuario pida "resumir", "sintetizar" o "TL;DR".
---

# Resumen en 5 viñetas

1. Si el usuario nombra un archivo, leelo con `read_file`. Si pega el texto, usalo directamente.
2. Escribí un título de máximo 8 palabras.
3. Escribí exactamente 5 viñetas, de máximo 20 palabras cada una, en el idioma del texto.
4. Si el texto tiene cifras o fechas, incluí al menos una.
5. No agregues opiniones propias. Si hay algo que no entendés, decilo en una línea final.

Para plantillas más largas mirá `plantilla.md` con `skill_read`.
