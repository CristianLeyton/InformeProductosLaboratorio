# Informe de Productos por Laboratorio

Aplicación Electron para generar informes de productos organizados por laboratorio, con funcionalidades de búsqueda, filtrado de columnas y exportación a Excel.

## 🚀 Instalación

### Opción 1: Versión Portable (Recomendado)

1. Descarga el archivo `Informe_Productos_Laboratorio_Portable.zip`
2. Extrae el contenido en cualquier carpeta
3. Ejecuta `informeproductoslaboratorio.exe`

### Opción 2: Instalador NSIS (Opcional)

1. Descarga el archivo `Informe_Productos_Laboratorio_Setup.exe`
2. Ejecuta el instalador como administrador
3. Sigue las instrucciones del asistente de instalación

### Opción 3: Aplicación Desempaquetada

1. Ve a la carpeta `dist-package/informeproductoslaboratorio-win32-x64/`
2. Ejecuta `informeproductoslaboratorio.exe` directamente

## ⚙️ Configuración de Base de Datos

Antes de usar la aplicación, configura la conexión a tu base de datos Firebird:

1. Abre la aplicación
2. Ve al menú **Archivo** → **Editar conexión a base de datos**
3. Modifica el archivo `dbconfig.json` con tus datos:

   ```json
   {
     "host": "127.0.0.1",
     "port": 3050,
     "database": "C:/ruta/a/tu/base.fdb",
     "user": "SYSDBA",
     "password": "tu_password",
     "lowercase_keys": false,
     "role": null,
     "pageSize": 4096
   }
   ```

4. Guarda el archivo y reinicia la aplicación

## 📋 Uso de la Aplicación

### 1. Seleccionar Laboratorios

- Escribe el nombre del laboratorio en el campo de búsqueda
- Selecciona de las sugerencias que aparecen
- Haz clic en "Agregar" para incluirlo en el informe
- Puedes agregar múltiples laboratorios

### 2. Configurar Columnas

- Marca/desmarca las columnas que quieres ver en el informe
- Las preferencias se guardan automáticamente

### 3. Generar Informe

- Haz clic en "Generar Informe" para obtener los datos
- Los resultados se muestran en la tabla inferior

### 4. Exportar a Excel

- Haz clic en "Exportar a Excel"
- Elige la ubicación para guardar el archivo
- Solo se exportan las columnas visibles

## 🔧 Desarrollo

### Requisitos

- Node.js 16+
- npm

### Instalación de dependencias

```bash
npm install
```

### Ejecutar en desarrollo

```bash
npm run dev
```

### Construir CSS

```bash
npm run build:css
```

### Empaquetar aplicación

```bash
# Empaquetar para Windows
npm run pack:win

# Empaquetar con archivo ASAR (recomendado)
npm run pack:win-portable

# Empaquetar para todas las plataformas
npm run pack
```

## 📁 Estructura del Proyecto

```
InformeProductosLaboratorio/
├── main.js              # Proceso principal de Electron
├── preload.js           # API segura para el renderer
├── renderer.js          # Lógica de la interfaz
├── index.html           # Interfaz de usuario
├── src/input.css        # Estilos de Tailwind CSS
├── dist/output.css      # CSS compilado
├── dbconfig.json        # Configuración de base de datos
├── package.json         # Dependencias y scripts
├── dist-package/        # Aplicación empaquetada
├── installer.nsi        # Script de instalación NSIS
└── LICENSE              # Archivo de licencia
```

## 🎨 Características

- ✅ Búsqueda inteligente de laboratorios
- ✅ Selección múltiple de laboratorios
- ✅ Columnas configurables
- ✅ Preferencias persistentes
- ✅ Exportación a Excel
- ✅ Interfaz moderna con Tailwind CSS
- ✅ Conexión a base de datos Firebird
- ✅ Aplicación completamente portable

## 🐛 Solución de Problemas

### Error de conexión a base de datos

- Verifica que Firebird esté ejecutándose
- Confirma la ruta de la base de datos
- Verifica credenciales de usuario

### La aplicación no inicia

- Asegúrate de tener permisos de administrador
- Verifica que no haya antivirus bloqueando la ejecución
- Asegúrate de que todos los archivos estén en la misma carpeta

### Problemas de empaquetado

- Ejecuta `npm run build:css` antes de empaquetar
- Verifica que todas las dependencias estén instaladas
- Usa `npm run pack:win-portable` para la mejor compatibilidad

## 📦 Distribución

### Archivos Generados

- **`Informe_Productos_Laboratorio_Portable.zip`** (123MB) - Versión portable comprimida
- **`dist-package/informeproductoslaboratorio-win32-x64/`** - Carpeta completa de la aplicación
- **`installer.nsi`** - Script para crear instalador con NSIS

### Para Distribuir

1. **Envíales el ZIP** para uso inmediato
2. **O la carpeta completa** para instalación manual
3. **O crea un instalador** usando NSIS con `installer.nsi`

## 📞 Soporte

Para soporte técnico o reportar problemas, contacta al equipo de desarrollo.

---

**Versión:** 1.0.0  
**Desarrollado por:** CDL  
**Última actualización:** Empaquetado con electron-packager - Versión portable funcional
