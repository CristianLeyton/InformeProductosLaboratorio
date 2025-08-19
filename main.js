const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const Firebird = require('node-firebird');
const XLSX = require('xlsx');
const fs = require('fs');

// --- Manejo de rutas de archivos editables ---
const userDataPath = app.getPath('userData');

function getEditableJsonPath(filename) {
    return path.join(userDataPath, filename);
}

function ensureEditableJson(filename, defaultContent) {
    const editablePath = getEditableJsonPath(filename);
    if (!fs.existsSync(editablePath)) {
        // Copiar desde el directorio original (asar o desarrollo)
        const originalPath = path.join(__dirname, filename);
        if (fs.existsSync(originalPath)) {
            fs.copyFileSync(originalPath, editablePath);
        } else {
            fs.writeFileSync(editablePath, JSON.stringify(defaultContent, null, 2));
        }
    }
    return editablePath;
}

// --- Configuración de Firebird desde dbconfig.json ---
const dbConfigDefaults = {
    host: '127.0.0.1',
    port: 3050,
    database: 'C:/winfarma/data/winfarma',
    user: 'SYSDBA',
    password: '.',
    lowercase_keys: false,
    role: null,
    pageSize: 4096
};
const dbConfigPath = ensureEditableJson('dbconfig.json', dbConfigDefaults);
let dbOptions;
try {
    dbOptions = JSON.parse(fs.readFileSync(dbConfigPath, 'utf8'));
    // Validar que sea un objeto y tenga los campos mínimos
    if (!dbOptions || typeof dbOptions !== 'object' || !dbOptions.host) {
        dbOptions = dbConfigDefaults;
    }
} catch (e) {
    dbOptions = dbConfigDefaults;
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1366,
        height: 768,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Crear el menú personalizado
    const menu = Menu.buildFromTemplate([
        {
            label: 'Archivo',
            submenu: [
                {
                    label: 'Editar conexión a base de datos',
                    click: () => {
                        const dbConfigPath = getEditableJsonPath('dbconfig.json');
                        if (fs.existsSync(dbConfigPath)) {
                            shell.openPath(dbConfigPath);
                        } else {
                            dialog.showErrorBox('Error', 'No existe dbconfig.json');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        mainWindow.reload();
                    },
                },
                {
                    label: 'DevTools',
                    accelerator: 'F12',
                    click: () => {
                        mainWindow.webContents.openDevTools();
                    },
                },
                {
                    label: 'Exit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    },
                },
            ],
        },
    ]);

    // Cambiar el menú superior
    mainWindow.setMenu(menu);

    mainWindow.loadFile('index.html');
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Función para conectar a la base de datos
function conectarDB() {
    return new Promise((resolve, reject) => {
        Firebird.attach(dbOptions, (err, db) => {
            if (err) {
                reject(err);
            } else {
                resolve(db);
            }
        });
    });
}

// Función para obtener laboratorios
async function obtenerLaboratorios() {
    const db = await conectarDB();
    return new Promise((resolve, reject) => {
        db.query('SELECT ID, DESCRIPCION FROM LABORATORIOS ORDER BY DESCRIPCION', [], (err, result) => {
            db.detach();
            if (err) reject(err);
            else resolve(result);
        });
    });
}

ipcMain.handle('obtener-laboratorios', async () => {
    try {
        const labs = await obtenerLaboratorios();
        return { success: true, data: labs };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// --- Preferencias (laboratorios seleccionados y columnas visibles) ---
const defaultPreferencias = {
    selectedLabIds: [],
    visibleColumns: [
        'NOMBRE',
        'PRESENTACION',
        'PRECIO',
        'TROQUEL',
        'CODIGO',
        'LABORATORIO',
        'STOCKACTUAL',
        'FRACCIONADOS',
        'CANTIDADDESEADA',
        'STOCKMINIMO',
        'MONODROGA'
    ]
};
const prefsPath = ensureEditableJson('preferencias.json', defaultPreferencias);

ipcMain.handle('get-preferencias', async () => {
    try {
        const raw = fs.readFileSync(prefsPath, 'utf8');
        const prefs = JSON.parse(raw);
        return { success: true, data: prefs };
    } catch (error) {
        return { success: false, error: error.message, data: defaultPreferencias };
    }
});

ipcMain.handle('set-preferencias', async (_evt, prefs) => {
    try {
        const current = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf8')) : defaultPreferencias;
        const merged = { ...current, ...prefs };
        fs.writeFileSync(prefsPath, JSON.stringify(merged, null, 2));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// --- Informe por laboratorios ---
async function obtenerInformePorLaboratorios(labIds) {
    if (!Array.isArray(labIds) || labIds.length === 0) {
        return [];
    }
    const placeholders = labIds.map(() => '?').join(',');
    const sql = `
        SELECT 
            p.NOMBRE,
            p.PRESENTACION,
            p.PRECIO,
            p.TROQUEL,
            p.CODIGO,
            l.DESCRIPCION AS LABORATORIO,
            COALESCE(s.STOCKACTUAL, 0) AS STOCKACTUAL,
            COALESCE(s.FRACCIONADOS, 0) AS FRACCIONADOS,
            COALESCE(s.CANTIDADDESEADA, 0) AS CANTIDADDESEADA,
            COALESCE(s.STOCKMINIMO, 0) AS STOCKMINIMO,
            m.DESCRIPCION AS MONODROGA
        FROM PRODUCTO p
        LEFT JOIN LABORATORIOS l ON l.ID = p.LABORATORIO
        LEFT JOIN STOCK s ON s.ACTUALIZADOR = p.ACTUALIZADOR AND s.PRODUCTO = p.ID
        LEFT JOIN MONODROGAS m ON m.ID = p.MONODROGA
        WHERE p.LABORATORIO IN (${placeholders})
        ORDER BY l.DESCRIPCION, p.NOMBRE, p.PRESENTACION
    `;
    const db = await conectarDB();
    return new Promise((resolve, reject) => {
        db.query(sql, labIds, (err, result) => {
            db.detach();
            if (err) reject(err);
            else resolve(result);
        });
    });
}

ipcMain.handle('generar-informe', async (_evt, labIds) => {
    try {
        const rows = await obtenerInformePorLaboratorios(labIds);
        return { success: true, data: rows };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// --- Exportar a Excel ---
ipcMain.handle('exportar-excel', async (_evt, payload) => {
    try {
        const { rows, columns } = payload; // columns: [{ key, label }]
        const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
            title: 'Guardar informe',
            defaultPath: `informe_productos_${new Date().toISOString().slice(0, 10)}.xlsx`,
            filters: [{ name: 'Excel', extensions: ['xlsx'] }]
        });
        if (canceled || !filePath) {
            return { success: false, error: 'cancelado' };
        }

        const exportRows = rows.map((row) => {
            const out = {};
            for (const col of columns) {
                out[col.label] = row[col.key];
            }
            return out;
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportRows, { header: columns.map(c => c.label) });
        XLSX.utils.book_append_sheet(wb, ws, 'Informe');
        XLSX.writeFile(wb, filePath);
        return { success: true, path: filePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});