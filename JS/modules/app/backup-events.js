const exportBtn =
    document.getElementById(
        "exportDataBtn"
    );

if (exportBtn) {

    exportBtn.addEventListener(
        "click",
        async () => {

            await exportData();
            window.renderSettingsDataHealth?.();

        }
    );

}

// ==========================
// ðŸ“¥ IMPORTAR DATOS
// ==========================

const importInput =
    document.getElementById(
        "importFile"
    );

if (importInput) {

    importInput.addEventListener(
        "change",
        (e) => {

            const file =
                e.target.files[0];

            importData(file);

        }
    );

}

const quickBackupBtn =
    document.getElementById(
        "quickBackupBtn"
    );

if (quickBackupBtn) {

    quickBackupBtn.addEventListener(
        "click",
        () => {

            quickExportData();
            window.renderSettingsDataHealth?.();
            window.gameTrackAlert?.(
                "Backup rapido descargado.",
                {
                    title: "Datos protegidos"
                }
            );

        }
    );

}
