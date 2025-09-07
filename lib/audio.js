const ECHO_DELAY_TIME_MS = 750;

const createEchoDelayEffect = function createEchoDelayEffect(audioContext, delayTimeMilliseconds) {
  const delay = audioContext.createDelay(10);
  delay.delayTime.value = (delayTimeMilliseconds || ECHO_DELAY_TIME_MS) / 1000;

  const dryNode = audioContext.createGain();
  dryNode.gain.value = 1;

  const wetNode = audioContext.createGain();
  wetNode.gain.value = 0;

  const filter = audioContext.createBiquadFilter();
  filter.frequency.value = 1100;
  filter.type = 'bandpass';
  filter.Q.value = 0.1;

  const mixer = audioContext.createGain();

  return {
    getDelayTime() {
      return parseInt(delay.delayTime.value * 1000, 10);
    },
    getValue() {
      return wetNode.gain.value;
    },
    apply(newVal) {
      if (newVal === undefined) {
        newVal = 0.9;
      }
      wetNode.gain.value = newVal;
      return newVal;
    },
    discard() {
      wetNode.gain.value = 0;
      mixer.gain.value = 0;
    },
    volume(newVal) {
      mixer.gain.value = newVal;
    },
    isApplied() {
      return wetNode.gain.value > 0;
    },
    placeBetween(inputNode, outputNode) {
      inputNode.connect(delay);

      delay.connect(wetNode);
      wetNode.connect(filter);
      filter.connect(delay);

      inputNode.connect(dryNode);

      dryNode.connect(mixer);
      wetNode.connect(mixer);

      mixer.connect(outputNode);
    }
  };
}

export { createEchoDelayEffect };
