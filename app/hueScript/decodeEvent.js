const eventNames = ['initial_press', 'repeat', 'short_release', 'long_release'];

const decodeEvent = event => {
  const e = +event;
  const eventCode = e % 10;

  const buttonCode = Math.floor(e / 1000);

  return [`button${buttonCode}`, eventNames[eventCode]];
};

export default decodeEvent;
