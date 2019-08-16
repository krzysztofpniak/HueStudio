const startOffset = 'a'.charCodeAt(0);
const endOffset = 'z'.charCodeAt(0);

const getNthPolyName = n => {
  const b = endOffset - startOffset + 1;
  if (n === 0) {
    return String.fromCharCode(startOffset);
  }

  let digits = '';
  while (n > 0) {
    digits = String.fromCharCode(startOffset + (n % b)) + digits;
    n = Math.floor(n / b);
  }
  return digits;
};

export default getNthPolyName;
