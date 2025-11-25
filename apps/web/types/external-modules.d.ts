// Minimal module declarations for test tooling and external dependencies

declare module '@vitejs/plugin-react' {
  const plugin: any;
  export default plugin;
}

declare module 'ioredis' {
  export default class Redis {
    constructor(...args: any[]);
    on(event: string, listener: (...args: any[]) => void): this;
    connect(): Promise<void>;
    quit(): Promise<void>;
    disconnect(): void;
    [key: string]: any;
  }
}

