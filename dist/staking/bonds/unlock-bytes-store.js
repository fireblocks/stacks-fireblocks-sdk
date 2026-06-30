"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryUnlockBytesStore = void 0;
class InMemoryUnlockBytesStore {
    constructor() {
        this.store = new Map();
    }
    key(stxAddress, bondIndex) {
        return `${stxAddress}:${bondIndex}`;
    }
    async save(stxAddress, bondIndex, unlockBytes) {
        this.store.set(this.key(stxAddress, bondIndex), unlockBytes);
    }
    async load(stxAddress, bondIndex) {
        var _a;
        return (_a = this.store.get(this.key(stxAddress, bondIndex))) !== null && _a !== void 0 ? _a : null;
    }
}
exports.InMemoryUnlockBytesStore = InMemoryUnlockBytesStore;
