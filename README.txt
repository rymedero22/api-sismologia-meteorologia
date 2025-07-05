REQUERIMIENTOS (Windows) – Proyecto API Meteorología & Sismología
=================================================================

1. SOFTWARE PREVIO

Comprueba en PowerShell:
    node -v
    npm -v
    docker -v
    git --version


3. VARIABLES DE ENTORNO
-----------------------
1 Copia el archivo de ejemplo y edítalo:
copy .env.template .env



INSTALAR DEPENDENCIAS NODE
-----------------------------
npm install
*(genera la carpeta `node_modules/`, ignorada por Git)*

 LEVANTAR TODA LA APLICACIÓN (DB + GUI + API)
-----------------------------------------------
docker compose up -d --build

* Primer arranque: Docker descargará las imágenes (≈ 400 MB).
* Se crean tres contenedores:
    • mongo (27017)  
    • mongo-express (8081)  
    • api (3000)

Ver estado:
```powershell
docker compose ps
```

