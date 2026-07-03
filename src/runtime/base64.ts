export function toUint8Array(data: string | Uint8Array): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(data, "base64"));
  }

  const decoded = atob(data);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
}

export function bitAt(bytes: Uint8Array, bitPosition: number): number {
  return (bytes[bitPosition >> 3] >> (7 - (bitPosition & 7))) & 1;
}
