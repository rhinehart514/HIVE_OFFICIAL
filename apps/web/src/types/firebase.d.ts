declare module 'firebase/storage' {
  export type Storage = any;

  export function getStorage(...args: any[]): Storage;
  export function ref(...args: any[]): any;
  export function uploadBytes(...args: any[]): Promise<any>;
  export function getDownloadURL(...args: any[]): Promise<string>;
  export function deleteObject(...args: any[]): Promise<void>;
  export type FirebaseStorage = Storage;
  export function connectStorageEmulator(storage: Storage, host: string, port: number): void;
}
