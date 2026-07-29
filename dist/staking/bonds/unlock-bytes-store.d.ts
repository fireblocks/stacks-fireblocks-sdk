export interface UnlockBytesStore {
    save(stxAddress: string, bondIndex: number, unlockBytes: Uint8Array): Promise<void>;
    load(stxAddress: string, bondIndex: number): Promise<Uint8Array | null>;
}
export declare class InMemoryUnlockBytesStore implements UnlockBytesStore {
    private store;
    private key;
    save(stxAddress: string, bondIndex: number, unlockBytes: Uint8Array): Promise<void>;
    load(stxAddress: string, bondIndex: number): Promise<Uint8Array | null>;
}
