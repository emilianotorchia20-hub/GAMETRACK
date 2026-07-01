function getSettings() {
    const settings = localStorage.getItem("settings");
    if (settings) return JSON.parse(settings);

    return {
        bankrollAlertsEnabled: false,
        bankrollLimit: 50000,
        sessionAlertsEnabled: false,
        sessionLossLimit: 10000
    };
}

function saveSettings(settings) {
    localStorage.setItem("settings", JSON.stringify(settings));
}

function collectBackupData() {
    const allData = {};

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        allData[key] = localStorage.getItem(key);
    }

    return allData;
}

function getBackupFileName() {
    return `gametrack_backup_${new Date().toISOString().slice(0, 10)}.json`;
}

function downloadTextFile(fileName, content) {
    const blob = new Blob(
        [content],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

function markLastBackup() {
    localStorage.setItem(
        "gametrack.lastBackupAt",
        new Date().toISOString()
    );
}

function themedAlert(message, options = {}) {
    if (window.gameTrackAlert) {
        return window.gameTrackAlert(message, options);
    }

    return Promise.resolve();
}

function themedConfirm(message, options = {}) {
    if (window.gameTrackConfirm) {
        return window.gameTrackConfirm(message, options);
    }

    return Promise.resolve(false);
}

async function exportData() {
    try {
        const dataStr = JSON.stringify(collectBackupData(), null, 2);

        if (!window.showSaveFilePicker) {
            downloadTextFile(getBackupFileName(), dataStr);
            markLastBackup();
            await themedAlert("Backup exportado", {
                title: "Datos protegidos",
            });
            return;
        }

        const fileHandle = await window.showSaveFilePicker({
            suggestedName: getBackupFileName(),
            types: [{
                description: "JSON Files",
                accept: {
                    "application/json": [".json"]
                }
            }]
        });

        const writable = await fileHandle.createWritable();
        await writable.write(dataStr);
        await writable.close();

        markLastBackup();
        await themedAlert("Backup exportado", {
            title: "Datos protegidos",
        });
    } catch (err) {
        console.log(err);
    }
}

function quickExportData() {
    const dataStr = JSON.stringify(collectBackupData(), null, 2);
    downloadTextFile(getBackupFileName(), dataStr);
    markLastBackup();
}

function importData(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            if (await themedConfirm("Esto reemplazara todos tus datos actuales. Continuar?", {
                title: "Importar backup",
                confirmText: "Importar",
                danger: true,
            })) {
                localStorage.clear();

                for (const key in importedData) {
                    localStorage.setItem(key, importedData[key]);
                }

                await themedAlert("Datos importados con exito. La pagina se recargara.", {
                    title: "Importacion completa",
                });
                window.location.reload();
            }
        } catch (err) {
            themedAlert("El archivo no es un backup valido.", {
                title: "Backup invalido",
                danger: true,
            });
        }
    };

    reader.readAsText(file);
}
