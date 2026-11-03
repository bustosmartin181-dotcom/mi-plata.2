# Guía de Compilación de APK en GitHub Actions (Sin Android Studio)

Esta configuración te permite compilar automáticamente el archivo `.apk` de **Mi Plata** en los servidores gratuitos de GitHub (en la nube) y descargarlo directo a tu celular Android o computadora.

---

## Pasos Rápidos (en 3 minutos):

### 1. Crear el repositorio en GitHub
1. Ve a [GitHub](https://github.com) y haz clic en **«New repository»** (Nuevo repositorio).
2. Nómbralo por ejemplo: `mi-plata-app`.
3. Déjalo como **Público** o **Privado** y haz clic en **«Create repository»**.

### 2. Subir los archivos del proyecto
Sube todos los archivos (o descomprime el ZIP descargado desde el botón de la app) en este repositorio.
Asegúrate de incluir la carpeta:
```text
.github/workflows/build-apk.yml
```
junto con `package.json`, `capacitor.config.json`, `index.html` y la carpeta `src/`.

### 3. Ejecutar la compilación automática
1. En tu repositorio de GitHub, ve a la pestaña **«Actions»** en la parte superior.
2. En el menú de la izquierda verás: **«Compilar APK Android (Mi Plata)»**.
3. Haz clic en **«Run workflow»** (botón derecho) y luego en el botón verde **«Run workflow»**.
4. GitHub comenzará a compilar el APK en una máquina virtual de Ubuntu con Android SDK instalado. El proceso toma unos 2 a 3 minutos.

### 4. Descargar el archivo APK
1. Una vez termine (aparecerá un círculo verde con un tilde ✓), haz clic en la ejecución.
2. Al final de la página verás la sección **Artifacts** con el archivo:
   ```text
   MiPlata-Android-APK (app-debug.apk)
   ```
3. Haz clic para descargarlo, pásalo a tu celular Android, ¡e instálalo!
