export interface UnlockBytesStore {
  save(stxAddress: string, bondIndex: number, unlockBytes: Uint8Array): Promise<void>;
  load(stxAddress: string, bondIndex: number): Promise<Uint8Array | null>;
}

export class InMemoryUnlockBytesStore implements UnlockBytesStore {
  private store = new Map<string, Uint8Array>();

  private key(stxAddress: string, bondIndex: number): string {
    return `${stxAddress}:${bondIndex}`;
  }

  async save(stxAddress: string, bondIndex: number, unlockBytes: Uint8Array): Promise<void> {
    this.store.set(this.key(stxAddress, bondIndex), unlockBytes);
  }

  async load(stxAddress: string, bondIndex: number): Promise<Uint8Array | null> {
    return this.store.get(this.key(stxAddress, bondIndex)) ?? null;
  }
}
