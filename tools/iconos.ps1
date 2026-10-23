# Genera los íconos PNG de la app (Kilo sobre las olas) a partir de un dibujo simple.
# Uso: powershell -ExecutionPolicy Bypass -File tools\iconos.ps1
Add-Type -AssemblyName System.Drawing
$dest = Join-Path $PSScriptRoot '..\icons'
New-Item -ItemType Directory -Force $dest | Out-Null

function Color($hex, $a = 255) { $c = [System.Drawing.ColorTranslator]::FromHtml($hex); [System.Drawing.Color]::FromArgb($a, $c) }

function Icono([int]$size, [string]$nombre, [double]$escala) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear((Color '#1F6E66'))
  $u = $size / 100.0
  # Olas de fondo
  $ola = New-Object System.Drawing.Drawing2D.GraphicsPath
  $y = 78 * $u
  $ola.AddBezier(0, $y, 12.5 * $u, $y - 7 * $u, 12.5 * $u, $y + 7 * $u, 25 * $u, $y)
  $ola.AddBezier(25 * $u, $y, 37.5 * $u, $y - 7 * $u, 37.5 * $u, $y + 7 * $u, 50 * $u, $y)
  $ola.AddBezier(50 * $u, $y, 62.5 * $u, $y - 7 * $u, 62.5 * $u, $y + 7 * $u, 75 * $u, $y)
  $ola.AddBezier(75 * $u, $y, 87.5 * $u, $y - 7 * $u, 87.5 * $u, $y + 7 * $u, 100 * $u, $y)
  $ola.AddLine(100 * $u, $y, 100 * $u, 100 * $u); $ola.AddLine(100 * $u, 100 * $u, 0, 100 * $u); $ola.CloseFigure()
  $g.FillPath((New-Object System.Drawing.SolidBrush (Color '#2A9488')), $ola)
  # Kilo, centrado y escalado (los íconos "maskable" necesitan más margen)
  $s = $u * $escala; $ox = 50 * $u - 50 * $s; $oy = 50 * $u - 50 * $s
  $P = { param($x, $y) New-Object System.Drawing.PointF(($ox + $x * $s), ($oy + $y * $s)) }
  $claro = Color '#EEF3F4'; $tinta = Color '#14232B'
  $pen = New-Object System.Drawing.Pen $claro, (6 * $s); $pen.StartCap = 'Round'; $pen.EndCap = 'Round'
  $g.DrawArc($pen, ($ox + 38 * $s), ($oy + 29 * $s), (24 * $s), (22 * $s), 180, 180)
  $g.DrawLine($pen, (& $P 38 40), (& $P 38 44)); $g.DrawLine($pen, (& $P 62 40), (& $P 62 44))
  $g.FillEllipse((New-Object System.Drawing.SolidBrush $claro), ($ox + 28 * $s), ($oy + 39 * $s), (44 * $s), (38 * $s))
  $bt = New-Object System.Drawing.SolidBrush $tinta
  $g.FillEllipse($bt, ($ox + 40.4 * $s), ($oy + 51.7 * $s), (5.2 * $s), (6.6 * $s))
  $g.FillEllipse($bt, ($ox + 54.4 * $s), ($oy + 51.7 * $s), (5.2 * $s), (6.6 * $s))
  $mej = New-Object System.Drawing.SolidBrush (Color '#D9822B' 150)
  $g.FillEllipse($mej, ($ox + 34 * $s), ($oy + 58 * $s), (6 * $s), (6 * $s))
  $g.FillEllipse($mej, ($ox + 60 * $s), ($oy + 58 * $s), (6 * $s), (6 * $s))
  $boca = New-Object System.Drawing.Pen $tinta, (1.8 * $s); $boca.StartCap = 'Round'; $boca.EndCap = 'Round'
  $g.DrawArc($boca, ($ox + 46.5 * $s), ($oy + 59.5 * $s), (7 * $s), (5 * $s), 20, 140)
  $bmp.Save((Join-Path $dest $nombre), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

Icono 180 'apple-touch-icon.png' 1.0
Icono 192 'icon-192.png' 1.0
Icono 512 'icon-512.png' 1.0
Icono 512 'icon-maskable-512.png' 0.8
Write-Output "Iconos generados en $dest"
