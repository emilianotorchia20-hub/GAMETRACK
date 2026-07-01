const bankrollAlertsCheckbox =
  document.getElementById(
    "bankrollAlertsEnabled"
  );

const bankrollLimitInput =
  document.getElementById(
    "bankrollLimit"
  );

const sessionAlertsCheckbox =
  document.getElementById(
    "sessionAlertsEnabled"
  );

const sessionLossLimitInput =
  document.getElementById(
    "sessionLossLimit"
  );

if (

  bankrollAlertsCheckbox &&
  bankrollLimitInput &&
  sessionAlertsCheckbox &&
  sessionLossLimitInput

) {

  const settings =
    getSettings();

  // ðŸ’° bankroll
  bankrollAlertsCheckbox.checked =
    settings.bankrollAlertsEnabled;

  bankrollLimitInput.value =
    settings.bankrollLimit;

  // ðŸ“‰ sesiÃ³n
  sessionAlertsCheckbox.checked =
    settings.sessionAlertsEnabled;

  sessionLossLimitInput.value =
    settings.sessionLossLimit;

  // ðŸ’° guardar bankroll
  bankrollAlertsCheckbox
    .addEventListener(
      "change",
      () => {

        settings
          .bankrollAlertsEnabled =
            bankrollAlertsCheckbox.checked;

        saveSettings(settings);

      }
    );

  bankrollLimitInput
    .addEventListener(
      "input",
      () => {

        settings.bankrollLimit =
          Number(
            bankrollLimitInput.value
          );

        saveSettings(settings);

      }
    );

  // ðŸ“‰ guardar sesiÃ³n
  sessionAlertsCheckbox
    .addEventListener(
      "change",
      () => {

        settings
          .sessionAlertsEnabled =
            sessionAlertsCheckbox.checked;

        saveSettings(settings);

      }
    );

  sessionLossLimitInput
    .addEventListener(
      "input",
      () => {

        settings.sessionLossLimit =
          Number(
            sessionLossLimitInput.value
          );

        saveSettings(settings);

      }
    );

}

// ðŸš¨ verificar alertas
window.checkBankrollLimit?.();
// ==========================
// ðŸ‘‘ DASHBOARD REAL
// ==========================
