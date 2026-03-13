import { _vi } from 'vitest';

type DocData = Record<string, unknown>;

let idCounter = 0;
const genId = () => `id_${++idCounter}`;

function getNested(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}

function setNested(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!current[k] || typeof current[k] !== 'object') current[k] = {};
    current = current[k] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

function normalizeComparable(value: unknown): unknown {
  if (value == null) return value;

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'object' && 'toDate' in value && typeof (value as Record<string, unknown>).toDate === 'function') {
    const date = (value as { toDate: () => unknown }).toDate();
    return date instanceof Date ? date.getTime() : date;
  }

  return value;
}

function compareValues(a: unknown, b: unknown): number {
  const av = normalizeComparable(a);
  const bv = normalizeComparable(b);

  if (av === bv) return 0;
  if (av == null && bv != null) return -1;
  if (av != null && bv == null) return 1;
  return (av as number | string) > (bv as number | string) ? 1 : -1;
}

interface FieldOp {
  __op: string;
  value?: number;
  elements?: unknown[];
}

function isFieldOp(v: unknown): v is FieldOp {
  return typeof v === 'object' && v !== null && '__op' in v;
}

function applyUpdate(target: Record<string, unknown>, updates: DocData) {
  for (const [k, v] of Object.entries(updates)) {
    if (k.includes('.')) {
      const prev = getNested(target, k);
      if (isFieldOp(v) && v.__op === 'inc') {
        const next = (typeof prev === 'number' ? prev : 0) + (v.value ?? 0);
        setNested(target, k, next);
      } else if (isFieldOp(v) && v.__op === 'arrayUnion') {
        const existing = Array.isArray(prev) ? prev : [];
        setNested(target, k, [...existing, ...(v.elements ?? [])]);
      } else {
        setNested(target, k, v);
      }
    } else if (isFieldOp(v) && v.__op === 'inc') {
      target[k] = (typeof target[k] === 'number' ? target[k] : 0) + (v.value ?? 0);
    } else if (isFieldOp(v) && v.__op === 'arrayUnion') {
      const existing = Array.isArray(target[k]) ? target[k] : [];
      target[k] = [...existing, ...(v.elements ?? [])];
    } else {
      target[k] = v;
    }
  }
}

class InMemoryDocRef {
  constructor(private store: Map<string, DocData>, public id: string, private path: string) {}
  async get() {
    const data = this.store.get(this.id);
    return { exists: !!data, id: this.id, data: () => data };
  }
  async set(data: DocData) { this.store.set(this.id, { ...data }); }
  async update(data: DocData) {
    const existing = this.store.get(this.id) || {};
    applyUpdate(existing, data);
    this.store.set(this.id, existing);
  }
  collection(sub: string) {
    return getCollection(`${this.path}/${this.id}/${sub}`);
  }
}

class InMemoryQuery {
  private filters: Array<{ field: string; op: string; value: unknown }> = [];
  private order?: { field: string; dir: 'asc'|'desc' };
  private _limit?: number;
  private _offset?: number;
  constructor(private coll: InMemoryCollection) {}
  where(field: string, op: string, value: unknown) { this.filters.push({ field, op, value }); return this; }
  orderBy(field: string, dir: 'asc'|'desc' = 'asc') { this.order = { field, dir }; return this; }
  limit(n: number) { this._limit = n; return this; }
  offset(n: number) { this._offset = n; return this; }
  private resolveItems() {
    let items = this.coll.allDocs();
    for (const f of this.filters) {
      if (f.op === '==') {
        items = items.filter(d => compareValues(getNested(d.data, f.field), f.value) === 0);
      } else if (f.op === '>=') {
        items = items.filter(d => compareValues(getNested(d.data, f.field), f.value) >= 0);
      } else if (f.op === '>') {
        items = items.filter(d => compareValues(getNested(d.data, f.field), f.value) > 0);
      } else if (f.op === '<=') {
        items = items.filter(d => compareValues(getNested(d.data, f.field), f.value) <= 0);
      } else if (f.op === '<') {
        items = items.filter(d => compareValues(getNested(d.data, f.field), f.value) < 0);
      } else if (f.op === 'in') {
        items = items.filter(d => (Array.isArray(f.value) ? f.value : []).includes(getNested(d.data, f.field)));
      } else if (f.op === 'array-contains') {
        items = items.filter(d => {
          const arr = getNested(d.data, f.field);
          return Array.isArray(arr) && arr.includes(f.value);
        });
      }
    }
    if (this.order) {
      const { field, dir } = this.order;
      items = items.sort((a, b) => {
        const av = getNested(a.data, field);
        const bv = getNested(b.data, field);
        return compareValues(av, bv) * (dir === 'asc' ? 1 : -1);
      });
    }
    if (this._offset) items = items.slice(this._offset);
    if (this._limit != null) items = items.slice(0, this._limit);
    return items;
  }
  count() {
    return {
      get: async () => {
        const items = this.resolveItems();
        return { data: () => ({ count: items.length }) };
      }
    };
  }
  async get() {
    const items = this.resolveItems();
    return {
      size: items.length,
      empty: items.length === 0,
      docs: items.map(it => ({ id: it.id, data: () => it.data, ref: this.coll.doc(it.id) }))
    };
  }
}

export class InMemoryCollection {
  private store: Map<string, DocData> = new Map();
  constructor(private path: string) {}
  doc(id?: string) { return new InMemoryDocRef(this.store, id ?? genId(), this.path); }
  async get() {
    const docs = this.allDocs().map(d => ({ id: d.id, data: () => d.data }));
    return { docs };
  }
  where(field: string, op: string, value: unknown) { return new InMemoryQuery(this).where(field, op, value); }
  orderBy(field: string, dir: 'asc'|'desc' = 'asc') { return new InMemoryQuery(this).orderBy(field, dir); }
  limit(n: number) { return new InMemoryQuery(this).limit(n); }
  offset(n: number) { return new InMemoryQuery(this).offset(n); }
  async add(data: DocData) { const ref = this.doc(); await ref.set(data); return { id: ref.id, get: () => ref.get() }; }
  allDocs(): Array<{ id: string; data: DocData }> {
    return Array.from(this.store.entries()).map(([id, data]) => ({ id, data }));
  }
}

const collections: Record<string, InMemoryCollection> = {};
export const getCollection = (path: string) => (collections[path] ||= new InMemoryCollection(path));
export const resetCollections = () => { for (const k of Object.keys(collections)) delete collections[k]; idCounter = 0; };

export const dbAdminMock = {
  collection: (name: string) => getCollection(name),
  getAll: async (...refs: Array<{ get: () => Promise<unknown> }>) => Promise.all(refs.map(ref => ref.get())),
  batch: () => {
    return {
      set: (ref: InMemoryDocRef, data: DocData) => ref.set(data),
      update: (ref: InMemoryDocRef, data: DocData) => ref.update(data),
      delete: (_ref: InMemoryDocRef) => {},
      commit: async () => {}
    };
  },
  runTransaction: async <T>(callback: (transaction: Record<string, unknown>) => Promise<T>): Promise<T> => {
    // Simple transaction mock that executes operations immediately
    const transaction: Record<string, unknown> = {
      get: async (ref: InMemoryDocRef) => ref.get(),
      set: (ref: InMemoryDocRef, data: DocData) => { ref.set(data); return transaction; },
      update: (ref: InMemoryDocRef, data: DocData) => { ref.update(data); return transaction; },
      delete: (_ref: InMemoryDocRef) => { return transaction; },
    };
    return await callback(transaction);
  }
};

export const adminMock = {
  firestore: {
    FieldValue: {
      serverTimestamp: () => new Date(),
      increment: (n: number) => ({ __op: 'inc', value: n }),
      arrayUnion: (...elements: unknown[]) => ({ __op: 'arrayUnion', elements })
    }
  }
};
