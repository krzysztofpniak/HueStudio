import decodeEvent from '../../app/hueScript/decodeEvent';

describe('decodeEvent', () => {
  it('should decode', () => {
    expect(decodeEvent(1000)).toEqual(['button1', 'initial_press']);
    expect(decodeEvent(1001)).toEqual(['button1', 'repeat']);
    expect(decodeEvent(1002)).toEqual(['button1', 'short_release']);
    expect(decodeEvent(1003)).toEqual(['button1', 'long_release']);
    expect(decodeEvent(2000)).toEqual(['button2', 'initial_press']);
    expect(decodeEvent(2001)).toEqual(['button2', 'repeat']);
    expect(decodeEvent(2002)).toEqual(['button2', 'short_release']);
    expect(decodeEvent(2003)).toEqual(['button2', 'long_release']);
    expect(decodeEvent(3000)).toEqual(['button3', 'initial_press']);
    expect(decodeEvent(3001)).toEqual(['button3', 'repeat']);
    expect(decodeEvent(3002)).toEqual(['button3', 'short_release']);
    expect(decodeEvent(3003)).toEqual(['button3', 'long_release']);
    expect(decodeEvent(4000)).toEqual(['button4', 'initial_press']);
    expect(decodeEvent(4001)).toEqual(['button4', 'repeat']);
    expect(decodeEvent(4002)).toEqual(['button4', 'short_release']);
    expect(decodeEvent(4003)).toEqual(['button4', 'long_release']);
  });
});
