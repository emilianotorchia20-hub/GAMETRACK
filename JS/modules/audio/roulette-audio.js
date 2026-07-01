const ROULETTE_AUDIO_SETTINGS_KEY = "rouletteAudioSettings";

const ROULETTE_AUDIO_DEFAULTS = {
  enabled: true,
  muted: false,
  masterVolume: 0.55,
  effectsVolume: 0.72
};

function clampAudioValue(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function readRouletteAudioSettings() {
  try {
    const stored =
      JSON.parse(localStorage.getItem(ROULETTE_AUDIO_SETTINGS_KEY));

    return {
      ...ROULETTE_AUDIO_DEFAULTS,
      ...(stored || {}),
      masterVolume: clampAudioValue(stored?.masterVolume ?? ROULETTE_AUDIO_DEFAULTS.masterVolume),
      effectsVolume: clampAudioValue(stored?.effectsVolume ?? ROULETTE_AUDIO_DEFAULTS.effectsVolume)
    };
  } catch (error) {
    console.warn("No se pudo leer la configuracion de audio.", error);
    return { ...ROULETTE_AUDIO_DEFAULTS };
  }
}

function saveRouletteAudioSettings(settings) {
  localStorage.setItem(
    ROULETTE_AUDIO_SETTINGS_KEY,
    JSON.stringify(settings)
  );

  window.dispatchEvent(
    new CustomEvent(
      "roulette-audio-settings-change",
      { detail: settings }
    )
  );
}

function createRouletteAudioManager() {
  let audioContext = null;
  let masterGain = null;
  let effectsGain = null;
  let wheelLoop = null;
  let ballLoop = null;
  let settings = readRouletteAudioSettings();
  let unlocked = false;
  let lastSeparatorIndex = null;
  let lastClickAt = 0;
  let dropPlayed = false;
  let resultPlayed = false;
  let clickCursor = 0;

  const clickFrequencies = [1900, 2300, 1720];
  const bounceFrequencies = [420, 510, 380, 560];

  function ensureContext() {
    if (audioContext) return audioContext;

    const AudioCtor =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioCtor) {
      console.warn("Web Audio API no esta disponible.");
      return null;
    }

    audioContext = new AudioCtor();
    masterGain = audioContext.createGain();
    effectsGain = audioContext.createGain();

    masterGain.gain.value =
      getEffectiveMasterVolume();

    effectsGain.gain.value =
      settings.effectsVolume;

    effectsGain.connect(masterGain);
    masterGain.connect(audioContext.destination);

    return audioContext;
  }

  function getEffectiveMasterVolume() {
    return settings.enabled && !settings.muted
      ? settings.masterVolume
      : 0;
  }

  async function unlock() {
    const context = ensureContext();
    if (!context) return false;

    try {
      if (context.state === "suspended") {
        await context.resume();
      }

      unlocked = true;
      return true;
    } catch (error) {
      console.warn("No se pudo desbloquear el audio de la ruleta.", error);
      return false;
    }
  }

  function createNoiseBuffer(duration = 1) {
    const context = ensureContext();
    if (!context) return null;

    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(
      1,
      Math.floor(sampleRate * duration),
      sampleRate
    );

    const data = buffer.getChannelData(0);
    let previous = 0;

    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.92 + white * 0.08;
      data[i] = previous;
    }

    return buffer;
  }

  function startLoop(type) {
    const context = ensureContext();
    if (!context || !effectsGain || !unlocked || getEffectiveMasterVolume() === 0) return null;

    const source = context.createBufferSource();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const buffer = createNoiseBuffer(type === "wheel" ? 1.35 : 0.9);

    if (!buffer) return null;

    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = type === "wheel" ? 0.82 : 1.15;
    filter.type = type === "wheel" ? "lowpass" : "bandpass";
    filter.frequency.value = type === "wheel" ? 520 : 1450;
    filter.Q.value = type === "wheel" ? 0.8 : 2.1;
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(effectsGain);

    source.start();

    return {
      source,
      gain,
      filter,
      type
    };
  }

  function stopLoop(loop, fadeSeconds = 0.45) {
    if (!loop || !audioContext) return;

    const now = audioContext.currentTime;
    loop.gain.gain.cancelScheduledValues(now);
    loop.gain.gain.setValueAtTime(loop.gain.gain.value, now);
    loop.gain.gain.linearRampToValueAtTime(0, now + fadeSeconds);

    window.setTimeout(() => {
      try {
        loop.source.stop();
        loop.source.disconnect();
        loop.gain.disconnect();
        loop.filter.disconnect();
      } catch (error) {
        console.warn("No se pudo detener un loop de audio.", error);
      }
    }, Math.round(fadeSeconds * 1000) + 80);
  }

  function beginSpin() {
    dropPlayed = false;
    resultPlayed = false;
    lastSeparatorIndex = null;
    lastClickAt = 0;

    if (!settings.enabled || settings.muted) return;

    void unlock().then((canPlay) => {
      if (!canPlay || !audioContext) return;

      stopLoop(wheelLoop, 0.12);
      stopLoop(ballLoop, 0.12);

      wheelLoop = startLoop("wheel");
      ballLoop = startLoop("ball");
    });
  }

  function updateLoop(loop, angularVelocity, config) {
    if (!loop || !audioContext) return;

    const speed =
      clampAudioValue(Math.abs(angularVelocity) / config.maxVelocity);

    const now = audioContext.currentTime;
    const targetVolume =
      config.minVolume + (config.maxVolume - config.minVolume) * speed;
    const targetRate =
      config.minRate + (config.maxRate - config.minRate) * speed;
    const targetFrequency =
      config.minFrequency + (config.maxFrequency - config.minFrequency) * speed;

    loop.gain.gain.setTargetAtTime(targetVolume, now, 0.06);
    loop.source.playbackRate.setTargetAtTime(targetRate, now, 0.08);
    loop.filter.frequency.setTargetAtTime(targetFrequency, now, 0.1);
  }

  function playPercussiveSound({
    frequency,
    duration,
    volume,
    type = "triangle",
    noise = false,
    filterFrequency = 1800
  }) {
    const context = ensureContext();
    if (!context || !effectsGain || !unlocked || getEffectiveMasterVolume() === 0) return;

    const now = context.currentTime;
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const outputVolume =
      volume * settings.effectsVolume * (0.94 + Math.random() * 0.12);

    filter.type = "bandpass";
    filter.frequency.value = filterFrequency * (0.94 + Math.random() * 0.12);
    filter.Q.value = 3.4;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, outputVolume), now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    gain.connect(effectsGain);

    if (noise) {
      const source = context.createBufferSource();
      source.buffer = createNoiseBuffer(0.08);
      source.playbackRate.value = 0.8 + Math.random() * 0.6;
      source.connect(filter);
      filter.connect(gain);
      source.start(now);
      source.stop(now + duration);
      return;
    }

    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency * (0.92 + Math.random() * 0.16);
    oscillator.connect(filter);
    filter.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  function triggerSeparatorClick(intensity = 0.5) {
    clickCursor =
      (clickCursor + 1) % clickFrequencies.length;

    playPercussiveSound({
      frequency: clickFrequencies[clickCursor],
      duration: 0.026 + intensity * 0.018,
      volume: 0.035 + intensity * 0.055,
      type: "square",
      filterFrequency: 2300 + intensity * 900
    });
  }

  function triggerBounce(intensity = 0.65) {
    const index =
      Math.floor(Math.random() * bounceFrequencies.length);

    playPercussiveSound({
      frequency: bounceFrequencies[index],
      duration: 0.08 + intensity * 0.06,
      volume: 0.08 + intensity * 0.12,
      type: "triangle",
      noise: Math.random() > 0.45,
      filterFrequency: 900 + intensity * 900
    });
  }

  function triggerBallDrop() {
    if (dropPlayed) return;
    dropPlayed = true;

    playPercussiveSound({
      frequency: 260,
      duration: 0.14,
      volume: 0.18,
      type: "sine",
      noise: true,
      filterFrequency: 720
    });

    window.setTimeout(() => {
      playPercussiveSound({
        frequency: 180,
        duration: 0.18,
        volume: 0.07,
        type: "sine",
        filterFrequency: 460
      });
    }, 80);
  }

  function playResultSound() {
    if (resultPlayed) return;
    resultPlayed = true;

    const notes = [523.25, 659.25, 783.99];

    notes.forEach((note, index) => {
      window.setTimeout(() => {
        playPercussiveSound({
          frequency: note,
          duration: 0.16,
          volume: 0.07 - index * 0.01,
          type: "sine",
          filterFrequency: 1200 + index * 320
        });
      }, index * 70);
    });
  }

  function updateSpin(data) {
    if (!settings.enabled || settings.muted) return;

    updateLoop(wheelLoop, data.wheelAngularVelocity, {
      maxVelocity: 2.5,
      minVolume: 0.015,
      maxVolume: 0.13,
      minRate: 0.72,
      maxRate: 1.24,
      minFrequency: 260,
      maxFrequency: 860
    });

    updateLoop(ballLoop, data.ballAngularVelocity, {
      maxVelocity: 4.2,
      minVolume: 0.012,
      maxVolume: 0.15,
      minRate: 0.82,
      maxRate: 1.38,
      minFrequency: 900,
      maxFrequency: 2350
    });

    updateSeparatorClicks(data);
  }

  function updateSeparatorClicks(data) {
    if (!audioContext || !Number.isFinite(data.ballAngle)) return;

    const normalized =
      normalizeAngle(data.ballAngle);
    const separatorIndex =
      Math.floor(normalized / SLOT_ANGLE);
    const speed =
      Math.abs(data.ballAngularVelocity);
    const now =
      audioContext.currentTime;
    const minGap =
      Math.max(0.018, 0.085 - speed * 0.014);

    if (
      lastSeparatorIndex !== null &&
      separatorIndex !== lastSeparatorIndex &&
      now - lastClickAt > minGap
    ) {
      const finalPresence =
        data.phase === "bouncing" ? 0.22 : 0;
      const intensity =
        clampAudioValue(speed / 4.2 + finalPresence, 0.12, 1);

      triggerSeparatorClick(intensity);
      lastClickAt = now;
    }

    lastSeparatorIndex = separatorIndex;
  }

  function finishSpin() {
    stopLoop(wheelLoop, 0.85);
    stopLoop(ballLoop, 0.55);
    wheelLoop = null;
    ballLoop = null;
  }

  function setMasterVolume(value) {
    settings.masterVolume =
      clampAudioValue(value);
    saveRouletteAudioSettings(settings);
    syncGains();
  }

  function setEffectsVolume(value) {
    settings.effectsVolume =
      clampAudioValue(value);
    saveRouletteAudioSettings(settings);
    syncGains();
  }

  function setMuted(value) {
    settings.muted =
      Boolean(value);
    saveRouletteAudioSettings(settings);
    syncGains();

    if (settings.muted) {
      finishSpin();
    }
  }

  function setEnabled(value) {
    settings.enabled =
      Boolean(value);
    saveRouletteAudioSettings(settings);
    syncGains();

    if (!settings.enabled) {
      finishSpin();
    }
  }

  function syncGains() {
    if (!audioContext || !masterGain || !effectsGain) return;

    const now =
      audioContext.currentTime;

    masterGain.gain.setTargetAtTime(
      getEffectiveMasterVolume(),
      now,
      0.08
    );

    effectsGain.gain.setTargetAtTime(
      settings.effectsVolume,
      now,
      0.08
    );
  }

  function stopAllSounds() {
    finishSpin();
    dropPlayed = false;
    resultPlayed = false;
  }

  function destroy() {
    stopAllSounds();

    if (audioContext) {
      audioContext.close().catch((error) => {
        console.warn("No se pudo cerrar el AudioContext.", error);
      });
    }

    audioContext = null;
    masterGain = null;
    effectsGain = null;
  }

  window.addEventListener("roulette-audio-settings-change", (event) => {
    settings = {
      ...ROULETTE_AUDIO_DEFAULTS,
      ...(event.detail || {})
    };
    syncGains();
  });

  window.addEventListener("blur", () => {
    if (masterGain && audioContext) {
      masterGain.gain.setTargetAtTime(
        getEffectiveMasterVolume() * 0.35,
        audioContext.currentTime,
        0.18
      );
    }
  });

  window.addEventListener("focus", syncGains);
  window.addEventListener("pagehide", stopAllSounds);

  return {
    beginSpin,
    updateSpin,
    triggerBounce,
    triggerBallDrop,
    playResultSound,
    finishSpin,
    stopAllSounds,
    destroy,
    unlock,
    setMasterVolume,
    setEffectsVolume,
    setMuted,
    setEnabled,
    getSettings: () => ({ ...settings }),
    saveSettings: saveRouletteAudioSettings
  };
}

window.rouletteAudioSettings = {
  key: ROULETTE_AUDIO_SETTINGS_KEY,
  defaults: ROULETTE_AUDIO_DEFAULTS,
  read: readRouletteAudioSettings,
  save: saveRouletteAudioSettings
};

window.rouletteAudio =
  window.rouletteAudio || createRouletteAudioManager();
