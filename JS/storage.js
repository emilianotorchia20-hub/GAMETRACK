function getSettings() {
    const settings = localStorage.getItem("settings");
    if(settings){
        return JSON.parse(settings);
    }
    return {
        bankrollAlertsEnabled: false,
        bankrollLimit: 50000,
        sessionAlertsEnabled: false,
        sessionLossLimit: 10000
    };
}

function saveSettings(settings){
    localStorage.setItem("settings", JSON.stringify(settings));
}

// --- NUEVAS FUNCIONES DE BACKUP (Copiar desde aquí) ---

/**
 * Exporta todo el contenido de localStorage a un archivo .json
 */
async function exportData() {

    try {

        const allData = {};

        // 📦 Obtener localStorage
        for (let i = 0; i < localStorage.length; i++) {

            const key = localStorage.key(i);

            allData[key] =
                localStorage.getItem(key);

        }

        // 📄 JSON bonito
        const dataStr =
            JSON.stringify(allData, null, 2);

        // 💾 Selector nativo
        const fileHandle =
            await window.showSaveFilePicker({

                suggestedName:
                    `gametrack_backup_${
                        new Date()
                            .toISOString()
                            .slice(0,10)
                    }.json`,

                types: [{

                    description: "JSON Files",

                    accept: {
                        "application/json": [".json"]
                    }

                }]

            });

        // ✍ escribir archivo
        const writable =
            await fileHandle.createWritable();

        await writable.write(dataStr);

        await writable.close();

        alert("✅ Backup exportado");

    }

    catch (err) {

        console.log(err);

    }

}
/**
 * Lee un archivo .json y restaura el localStorage
 * @param {File} file - El archivo obtenido de un input type="file"
 */
function importData(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Opcional: Limpiar lo actual antes de importar para evitar basura
            if (confirm("¿Estás seguro? Esto reemplazará todos tus datos actuales.")) {
                localStorage.clear();
                
                for (const key in importedData) {
                    localStorage.setItem(key, importedData[key]);
                }
                
                alert("¡Datos importados con éxito! La página se recargará.");
                window.location.reload();
            }
        } catch (err) {
            alert("Error: El archivo no es un backup válido.");
        }
    };
    reader.readAsText(file);
}