# Run from the frontend folder:  powershell -ExecutionPolicy Bypass -File .\cleanup.ps1
$remove = @(
  "src\pages\SignUp.jsx",
  "src\components\Sidebar.jsx",
  "src\components\layout\SearchBar.jsx",
  "src\hooks",
  "src\context",
  "src\services\authService.js",
  "src\services\cartService.js",
  "src\services\productService.js",
  "src\styles\globals.css",
  "src\index.css",
  "frontend"
)
foreach ($p in $remove) {
  if (Test-Path $p) { Remove-Item $p -Recurse -Force; Write-Host "Removed $p" }
}
Write-Host "Done. Now run: npm install"
