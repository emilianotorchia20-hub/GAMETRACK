const audioSettingsForm =
  document.getElementById("rouletteAudioSettings");

const audioEnabledInput =
  document.getElementById("rouletteAudioEnabled");

const audioMutedInput =
  document.getElementById("rouletteAudioMuted");

const audioMasterInput =
  document.getElementById("rouletteMasterVolume");

const audioEffectsInput =
  document.getElementById("rouletteEffectsVolume");

const audioMasterValue =
  document.getElementById("rouletteMasterVolumeValue");

const audioEffectsValue =
  document.getElementById("rouletteEffectsVolumeValue");

const audioStatusIcon =
  document.getElementById("rouletteAudioStatusIcon");

const localAudioDefaults = {
  enabled: true,
  muted: false,
  masterVolume: 0.55,
  effectsVolume: 0.72
};

function clampSettingVolume(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function getAudioSettingsApi() {
  const api =
    window.rouletteAudioSettings;

  if (
    api &&
    typeof api.read === "function" &&
    typeof api.save === "function"
  ) {
    return api;
  }

  return null;
}

function readAudioSettings() {
  if (getAudioSettingsApi()) {
    return getAudioSettingsApi().read();
  }

  try {
    const stored =
      JSON.parse(localStorage.getItem("rouletteAudioSettings"));

    return {
      ...localAudioDefaults,
      ...(stored || {}),
      masterVolume: clampSettingVolume(stored?.masterVolume ?? localAudioDefaults.masterVolume),
      effectsVolume: clampSettingVolume(stored?.effectsVolume ?? localAudioDefaults.effectsVolume)
    };
  } catch (error) {
    console.warn("No se pudo cargar la configuracion de audio.", error);
    return { ...localAudioDefaults };
  }
}

function saveAudioSettings(settings) {
  if (getAudioSettingsApi()) {
    getAudioSettingsApi().save(settings);
    return;
  }

  localStorage.setItem(
    "rouletteAudioSettings",
    JSON.stringify(settings)
  );
}

function updateVolumeLabels() {
  audioMasterValue.textContent =
    `${audioMasterInput.value}%`;

  audioEffectsValue.textContent =
    `${audioEffectsInput.value}%`;
}

function renderAudioSettings(settings) {
  if (!audioSettingsForm) return;

  audioEnabledInput.checked =
    settings.enabled;

  audioMutedInput.checked =
    settings.muted;

  audioMasterInput.value =
    String(Math.round(settings.masterVolume * 100));

  audioEffectsInput.value =
    String(Math.round(settings.effectsVolume * 100));

  updateVolumeLabels();

  audioStatusIcon.textContent =
    settings.enabled && !settings.muted ? "ON" : "OFF";

  audioSettingsForm.dataset.audioState =
    settings.enabled && !settings.muted ? "enabled" : "muted";
}

function updateRouletteAudioSettings(partial) {
  const settings = {
    ...readAudioSettings(),
    ...partial
  };

  saveAudioSettings(settings);
  renderAudioSettings(settings);

  window.rouletteAudio?.setEnabled(settings.enabled);
  window.rouletteAudio?.setMuted(settings.muted);
  window.rouletteAudio?.setMasterVolume(settings.masterVolume);
  window.rouletteAudio?.setEffectsVolume(settings.effectsVolume);
}

if (
  audioSettingsForm &&
  audioEnabledInput &&
  audioMutedInput &&
  audioMasterInput &&
  audioEffectsInput &&
  audioMasterValue &&
  audioEffectsValue &&
  audioStatusIcon
) {
  renderAudioSettings(readAudioSettings());

  audioEnabledInput.addEventListener("change", () => {
    updateRouletteAudioSettings({
      enabled: audioEnabledInput.checked
    });
  });

  audioMutedInput.addEventListener("change", () => {
    updateRouletteAudioSettings({
      muted: audioMutedInput.checked
    });
  });

  audioMasterInput.addEventListener("input", () => {
    updateVolumeLabels();

    updateRouletteAudioSettings({
      masterVolume: clampSettingVolume(Number(audioMasterInput.value) / 100)
    });
  });

  audioEffectsInput.addEventListener("input", () => {
    updateVolumeLabels();

    updateRouletteAudioSettings({
      effectsVolume: clampSettingVolume(Number(audioEffectsInput.value) / 100)
    });
  });
}
