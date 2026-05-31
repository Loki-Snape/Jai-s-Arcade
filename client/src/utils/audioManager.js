const managedAudio = new Set();

function stopAudio(audio) {
  if (!audio) {
    return;
  }

  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (_error) {
    // Ignore media shutdown errors.
  }
}

export function registerManagedAudio(audio) {
  if (!audio) {
    return () => {};
  }

  managedAudio.add(audio);

  return () => {
    managedAudio.delete(audio);
  };
}

export function stopAllManagedAudio() {
  managedAudio.forEach((audio) => {
    stopAudio(audio);
  });
}

export function playManagedAudio(audio, { loop = false, volume = 1 } = {}) {
  if (!audio) {
    return Promise.resolve();
  }

  audio.loop = loop;
  audio.volume = volume;
  registerManagedAudio(audio);

  const attemptPlay = () => {
    audio.currentTime = 0;
    return audio.play();
  };

  try {
    const playResult = attemptPlay();
    return Promise.resolve(playResult);
  } catch (_error) {
    return Promise.reject(_error);
  }
}