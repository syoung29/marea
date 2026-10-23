# Servidor local para probar Marea en la compu (sin instalar nada).
# Uso: powershell -ExecutionPolicy Bypass -File tools\servidor.ps1   y abrí http://localhost:8765
param([int]$Puerto = 8765)
if ($env:PORT) { $Puerto = [int]$env:PORT }
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$tipos = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json'; '.webmanifest' = 'application/manifest+json'; '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.ico' = 'image/x-icon' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Puerto/")
$l.Start()
Write-Output "Marea en http://localhost:$Puerto (Ctrl+C para cortar)"
while ($l.IsListening) {
  $ctx = $l.GetContext()
  $ruta = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ($ruta -eq '') { $ruta = 'index.html' }
  $archivo = [IO.Path]::GetFullPath((Join-Path $raiz $ruta))
  if ($archivo.StartsWith($raiz) -and (Test-Path $archivo -PathType Leaf)) {
    $bytes = [IO.File]::ReadAllBytes($archivo)
    $ext = [IO.Path]::GetExtension($archivo).ToLower()
    $ctx.Response.ContentType = if ($tipos[$ext]) { $tipos[$ext] } else { 'application/octet-stream' }
    $ctx.Response.Headers.Add('Cache-Control', 'no-cache')
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else { $ctx.Response.StatusCode = 404 }
  $ctx.Response.Close()
}
