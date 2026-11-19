# Icons Directory

Tempatkan file ikon berikut di direktori ini:

- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

## Cara Membuat Ikon

Anda dapat menggunakan tools online seperti:
- https://favicon.io/
- https://realfavicongenerator.com/
- https://app-icon-generator.online/

Atau gunakan command line dengan ImageMagick:
```bash
convert -size 192x192 xc:#4F46E5 -fill white -gravity center -pointsize 80 -annotate 0 "💰" icon-192.png
convert -size 512x512 xc:#4F46E5 -fill white -gravity center -pointsize 200 -annotate 0 "💰" icon-512.png
```

Untuk sementara, aplikasi akan tetap berfungsi tanpa ikon kustom.