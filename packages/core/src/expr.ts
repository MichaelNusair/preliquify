export type Expr<T> = {
  toLiquid(): string;
  toClient(): (ctx: any) => T;
};

export const $ = {
  lit<T>(v: T): Expr<T> {
    return {
      toLiquid: () => JSON.stringify(v),
      toClient: () => () => v,
    };
  },
  var(name: string): Expr<any> {
    return {
      toLiquid: () => name,
      toClient: () => (ctx: any) => {
        const segments = name.split(".");
        let cur = ctx;
        for (const s of segments) cur = cur?.[s];
        return cur;
      },
    };
  },
  not(a: Expr<boolean>): Expr<boolean> {
    return {
      toLiquid: () => `(not ${a.toLiquid()})`,
      toClient: () => (ctx) => !a.toClient()(ctx),
    };
  },
  and(a: Expr<boolean>, b: Expr<boolean>): Expr<boolean> {
    return {
      toLiquid: () => `(${a.toLiquid()}) and (${b.toLiquid()})`,
      toClient: () => (ctx) => a.toClient()(ctx) && b.toClient()(ctx),
    };
  },
  or(a: Expr<boolean>, b: Expr<boolean>): Expr<boolean> {
    return {
      toLiquid: () => `(${a.toLiquid()}) or (${b.toLiquid()})`,
      toClient: () => (ctx) => a.toClient()(ctx) || b.toClient()(ctx),
    };
  },
  eq(a: Expr<any>, b: Expr<any>): Expr<boolean> {
    return {
      toLiquid: () => `${a.toLiquid()} == ${b.toLiquid()}`,
      toClient: () => (ctx) => a.toClient()(ctx) === b.toClient()(ctx),
    };
  },
  contains(collection: Expr<any[]>, item: Expr<any>): Expr<boolean> {
    return {
      toLiquid: () => `${collection.toLiquid()} contains ${item.toLiquid()}`,
      toClient: () => (ctx) =>
        (collection.toClient()(ctx) ?? []).includes(item.toClient()(ctx)),
    };
  },
};
