@echo off
REM Script para generar keystore para firmar APK y Bundle de PetCare
REM Ejecutar desde la carpeta android del proyecto

echo ========================================
echo Generador de Keystore para PetCare
echo ========================================
echo.

REM Variable para almacenar la ruta de keytool
set KEYTOOL_PATH=

REM Buscar keytool en el PATH primero
where keytool >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set KEYTOOL_PATH=keytool
    goto :found_keytool
)

REM Buscar en JAVA_HOME si está configurado
if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\keytool.exe" (
        set KEYTOOL_PATH="%JAVA_HOME%\bin\keytool.exe"
        goto :found_keytool
    )
)

REM Buscar en ubicaciones comunes de Java JDK
for /d %%i in ("C:\Program Files\Java\jdk*") do (
    if exist "%%i\bin\keytool.exe" (
        set KEYTOOL_PATH="%%i\bin\keytool.exe"
        goto :found_keytool
    )
)

REM Buscar en Program Files (x86)
for /d %%i in ("C:\Program Files (x86)\Java\jdk*") do (
    if exist "%%i\bin\keytool.exe" (
        set KEYTOOL_PATH="%%i\bin\keytool.exe"
        goto :found_keytool
    )
)

REM Buscar en Android Studio (que incluye JDK)
if exist "%LOCALAPPDATA%\Android\Sdk\jbr\bin\keytool.exe" (
    set KEYTOOL_PATH="%LOCALAPPDATA%\Android\Sdk\jbr\bin\keytool.exe"
    goto :found_keytool
)

REM Si no se encontró, mostrar error y opciones
echo ERROR: keytool no encontrado
echo.
echo El script busco en las siguientes ubicaciones:
echo   - PATH del sistema
echo   - JAVA_HOME
echo   - C:\Program Files\Java\jdk*
echo   - C:\Program Files (x86)\Java\jdk*
echo   - Android Studio SDK
echo.
echo OPCIONES:
echo.
echo 1. Instalar JDK 8 o superior desde:
echo    https://www.oracle.com/java/technologies/downloads/
echo.
echo 2. Si ya tienes JDK instalado, encontrar keytool manualmente:
echo    Busca en: C:\Program Files\Java\jdk*\bin\keytool.exe
echo    Luego ejecuta manualmente:
echo    "C:\Program Files\Java\jdk1.8.0_XXX\bin\keytool.exe" -genkey -v -keystore petcare-release-key.keystore -alias petcare_key -keyalg RSA -keysize 2048 -validity 10000
echo.
echo 3. Usar Android Studio directamente:
echo    Build ^> Generate Signed Bundle / APK
echo    Android Studio tiene su propio JDK integrado
echo.
pause
exit /b 1

:found_keytool
echo keytool encontrado en: %KEYTOOL_PATH%
echo.
echo Generando keystore...
echo.
echo IMPORTANTE: Guarda las contraseñas que ingreses en un lugar seguro
echo Si pierdes el keystore o las contraseñas, NO podras actualizar tu app en Google Play Store
echo.

%KEYTOOL_PATH% -genkey -v -keystore petcare-release-key.keystore -alias petcare_key -keyalg RSA -keysize 2048 -validity 10000

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Keystore generado exitosamente!
    echo ========================================
    echo.
    echo Archivo creado: petcare-release-key.keystore
    echo.
    echo IMPORTANTE: Ahora debes:
    echo 1. Crear el archivo keystore.properties con tus credenciales
    echo 2. Ver la guia en GUIA_KEYSTORE.md para mas detalles
    echo.
) else (
    echo.
    echo ERROR: No se pudo generar el keystore
    echo Verifica los errores arriba
    echo.
)

pause

