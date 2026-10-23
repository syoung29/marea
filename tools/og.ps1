# Genera og.png (1200x630): la imagen que aparece al compartir el link de Marea.
# Uso: powershell -ExecutionPolicy Bypass -File tools\og.ps1
Add-Type -AssemblyName System.Drawing
$W = 1200; $H = 630
$bmp = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'
function Color($hex, $a = 255) { $c = [System.Drawing.ColorTranslator]::FromHtml($hex); [System.Drawing.Color]::FromArgb($a, $c) }
function Brocha($hex, $a = 255) { New-Object System.Drawing.SolidBrush (Color $hex $a) }

# Cielo
$cielo = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.Point 0, 0), (New-Object System.Drawing.Point 0, $H), (Color '#13252E'), (Color '#0D161B')
$g.FillRectangle($cielo, 0, 0, $W, $H)

# Olas: de atrás (ámbar tenue) hacia adelante (verde profundo)
function Ola($y, $amp, $lam, $color) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $x = -$lam
  while ($x -lt $W + $lam) {
    $p.AddBezier($x, $y, $x + $lam / 4, $y - $amp, $x + $lam / 4, $y - $amp, $x + $lam / 2, $y)
    $p.AddBezier($x + $lam / 2, $y, $x + 3 * $lam / 4, $y + $amp, $x + 3 * $lam / 4, $y + $amp, $x + $lam, $y)
    $x += $lam
  }
  $p.AddLine($W + $lam, $y, $W + $lam, $H); $p.AddLine($W + $lam, $H, -$lam, $H); $p.CloseFigure()
  $g.FillPath($color, $p)
}
Ola 430 16 420 (Brocha '#3A3424')
Ola 470 14 300 (Brocha '#1E4744')
Ola 505 12 240 (Brocha '#2A7F75')

# Kilo flotando a la derecha
$s = 3.6; $ox = 790; $oy = 210
$claro = Color '#C7D5DA'; $tinta = Color '#152229'
$pen = New-Object System.Drawing.Pen $claro, (8 * $s); $pen.StartCap = 'Round'; $pen.EndCap = 'Round'
$g.DrawArc($pen, $ox + 32 * $s, $oy + 18 * $s, 36 * $s, 44 * $s, 180, 180)
$bc = New-Object System.Drawing.SolidBrush $claro
$g.FillEllipse($bc, $ox + 20 * $s, $oy + 34 * $s, 60 * $s, 52 * $s)
$g.FillEllipse($bc, $ox + 72 * $s, $oy + 50 * $s, 12 * $s, 18 * $s)
$g.FillEllipse($bc, $ox + 16 * $s, $oy + 52 * $s, 12 * $s, 18 * $s)
$bt = New-Object System.Drawing.SolidBrush $tinta
$g.FillEllipse($bt, $ox + 36.4 * $s, $oy + 49.4 * $s, 7.2 * $s, 9.2 * $s)
$g.FillEllipse($bt, $ox + 56.4 * $s, $oy + 49.4 * $s, 7.2 * $s, 9.2 * $s)
$mej = Brocha '#EEA04C' 120
$g.FillEllipse($mej, $ox + 28 * $s, $oy + 58 * $s, 8 * $s, 8 * $s)
$g.FillEllipse($mej, $ox + 64 * $s, $oy + 58 * $s, 8 * $s, 8 * $s)
$boca = New-Object System.Drawing.Pen $tinta, (2.2 * $s); $boca.StartCap = 'Round'; $boca.EndCap = 'Round'
$g.DrawArc($boca, $ox + 45 * $s, $oy + 59 * $s, 10 * $s, 7 * $s, 20, 140)
# Agua por delante de Kilo
Ola 545 10 200 (Brocha '#174A46' 240)

# Disco
$g.FillEllipse((Brocha '#EEA04C'), 640, 492, 64, 64)
$g.FillEllipse((Brocha '#13252E'), 664, 516, 16, 16)
$g.FillEllipse((Brocha '#152229'), 655, 506, 6, 6); $g.FillEllipse((Brocha '#152229'), 683, 506, 6, 6)

# Texto
$fTitulo = New-Object System.Drawing.Font 'Segoe UI', 92, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$fSub = New-Object System.Drawing.Font 'Segoe UI', 34, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$fEti = New-Object System.Drawing.Font 'Segoe UI', 24, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString('GRATIS · SIN REGISTRARTE', $fEti, (Brocha '#93A5AC'), 80, 92)
$g.DrawString('marea', $fTitulo, (Brocha '#E4EDEF'), 70, 120)
$g.DrawString("Tus semanas de carga y descarga,`ny un registro de todo lo que levantás.", $fSub, (Brocha '#C7D5DA'), 80, 250)

$dest = Join-Path $PSScriptRoot '..\og.png'
$bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "og.png generado"
