@echo off
echo ========================================
echo    CREANDO INSTALADOR/ZIP
echo ========================================
echo.
echo Opciones disponibles:
echo.
echo 1. Crear ZIP comprimido (recomendado)
echo 2. Crear instalador con NSIS (si esta instalado)
echo.
set /p choice="Elige una opcion (1 o 2): "

if "%choice%"=="1" goto :create_zip
if "%choice%"=="2" goto :create_nsis
goto :invalid

:create_zip
echo.
echo Creando ZIP comprimido...
powershell -command "Compress-Archive -Path 'dist-package\informeproductoslaboratorio-win32-x64\*' -DestinationPath 'Informe_Productos_Laboratorio_Portable.zip' -Force"
echo.
echo ZIP creado: Informe_Productos_Laboratorio_Portable.zip
echo Tamaño: 
powershell -command "Get-ChildItem 'Informe_Productos_Laboratorio_Portable.zip' | Select-Object Name, @{Name='Size(MB)';Expression={[math]::Round($_.Length/1MB,2)}}"
goto :end

:create_nsis
echo.
echo Verificando si NSIS esta instalado...
where makensis >nul 2>&1
if %errorlevel% neq 0 (
    echo NSIS no esta instalado o no esta en el PATH
    echo Descargalo desde: https://nsis.sourceforge.io/Download
    goto :end
)
echo.
echo Creando instalador con NSIS...
makensis installer.nsi
echo.
echo Instalador creado exitosamente!
goto :end

:invalid
echo Opcion invalida. Por favor elige 1 o 2.

:end
echo.
echo Presiona cualquier tecla para continuar...
pause >nul
