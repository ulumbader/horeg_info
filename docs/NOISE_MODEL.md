# Model Propagasi Kebisingan (Noise Propagation Model)

Dokumen ini menjelaskan dasar teori fisika akustik yang digunakan dalam proyek **SOUND HOREG.INFO** untuk memperkirakan paparan kebisingan.

> **DISCLAIMER:** Model ini adalah _estimasi teoritis lapangan bebas (free-field spherical divergence)_. Model ini tidak memperhitungkan redaman oleh penghalang fisik (bangunan, pohon, bukit), pantulan permukaan tanah, serapan udara, kondisi angin, atau gradien suhu. Pengukuran aktual di lapangan kemungkinan akan berbeda karena faktor-faktor eksternal tersebut.

## Dasar Teori (Hukum Kuadrat Terbalik)

Kebisingan (tingkat tekanan bunyi dalam decibel/dB) akan berkurang seiring berjalannya jarak dari sumber bunyi. Secara teoritis, dalam ruang terbuka tanpa halangan (ruang hampa/udara ideal), tingkat tekanan bunyi berkurang **6 dB setiap kali jarak berlipat ganda**.

Rumus fisika yang dipakai untuk menghitung tekanan suara ($L_2$) pada jarak tertentu ($r_2$) adalah:
$$ L_2 = L_1 - 20 \cdot \log_{10}(r_2 / r_1) $$

Di mana:
- $L_1$: Tingkat intensitas suara pada sumber (jarak standar $r_1 = 1$ meter).
- $r_2$: Jarak target dari sumber dalam meter.
- $L_2$: Estimasi kebisingan pada jarak target.

## Threshold (Ambang Batas) Kebisingan
Berdasarkan referensi kesehatan, sistem mengkategorikan paparan kebisingan ke dalam 3 zona:
1. **Zona Merah (Bahaya) / > 75 dB**: Berpotensi merusak pendengaran jika terpapar lama dan terus menerus. Menimbulkan gangguan signifikan bagi penduduk sekitar.
2. **Zona Kuning (Waspada) / 65 - 75 dB**: Ambang batas kebisingan lingkungan rata-rata (standar lingkungan yang dapat ditolerir untuk waktu tertentu).
3. **Zona Hijau (Aman) / < 55 dB**: Dianggap batas aman / kebisingan latar alami pedesaan atau ambang wajar lingkungan tempat tinggal malam hari.

## Contoh Perhitungan: Sumber Bunyi 125 dB
Misalkan sistem tata suara Sound Horeg memiliki intensitas sebesar **125 dB pada jarak 1 meter**.

**Berdasarkan jarak (m):**
- Pada jarak **100 meter**: $L_2 = 125 - 20 \cdot \log_{10}(100) = 125 - 40 = 85 \text{ dB}$
- Pada jarak **500 meter**: $L_2 = 125 - 20 \cdot \log_{10}(500) \approx 125 - 54 \approx 71 \text{ dB}$
- Pada jarak **1 kilometer**: $L_2 = 125 - 20 \cdot \log_{10}(1000) = 125 - 60 = 65 \text{ dB}$

**Berdasarkan ambang batas radius (m):**
Radius di mana suara mereda hingga ambang batas:
- Radius untuk **75 dB** (Zona Merah): $r = 10^{(125-75)/20} = 10^{2.5} \approx \textbf{316 meter}$
- Radius untuk **65 dB** (Zona Kuning): $r = 10^{(125-65)/20} = 10^{3} = \textbf{1 kilometer}$
- Radius untuk **55 dB** (Zona Hijau): $r = 10^{(125-55)/20} = 10^{3.5} \approx \textbf{3,16 kilometer}$

Catatan: Pembulatan (_rounding_) pada UI (seperti format string "1.5 km") dapat sedikit berbeda bergantung pada opsi digit pecahan, tetapi operasi matematis murni menggunakan presisi _floating point_ standar.
