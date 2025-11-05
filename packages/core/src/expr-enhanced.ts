import type { Expr, EnhancedExpressionBuilder } from "./types.js";

export const $$: EnhancedExpressionBuilder = {
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

  neq(a: Expr<any>, b: Expr<any>): Expr<boolean> {
    return {
      toLiquid: () => `${a.toLiquid()} != ${b.toLiquid()}`,
      toClient: () => (ctx) => a.toClient()(ctx) !== b.toClient()(ctx),
    };
  },

  gt(a: Expr<number>, b: Expr<number>): Expr<boolean> {
    return {
      toLiquid: () => `${a.toLiquid()} > ${b.toLiquid()}`,
      toClient: () => (ctx) => a.toClient()(ctx) > b.toClient()(ctx),
    };
  },

  gte(a: Expr<number>, b: Expr<number>): Expr<boolean> {
    return {
      toLiquid: () => `${a.toLiquid()} >= ${b.toLiquid()}`,
      toClient: () => (ctx) => a.toClient()(ctx) >= b.toClient()(ctx),
    };
  },

  lt(a: Expr<number>, b: Expr<number>): Expr<boolean> {
    return {
      toLiquid: () => `${a.toLiquid()} < ${b.toLiquid()}`,
      toClient: () => (ctx) => a.toClient()(ctx) < b.toClient()(ctx),
    };
  },

  lte(a: Expr<number>, b: Expr<number>): Expr<boolean> {
    return {
      toLiquid: () => `${a.toLiquid()} <= ${b.toLiquid()}`,
      toClient: () => (ctx) => a.toClient()(ctx) <= b.toClient()(ctx),
    };
  },

  contains(collection: Expr<any>, item: Expr<any>): Expr<boolean> {
    return {
      toLiquid: () => `${collection.toLiquid()} contains ${item.toLiquid()}`,
      toClient: () => (ctx) => {
        const coll = collection.toClient()(ctx);
        const val = item.toClient()(ctx);
        if (Array.isArray(coll)) return coll.includes(val);
        if (typeof coll === "string") return coll.includes(val);
        return false;
      },
    };
  },

  size(collection: Expr<any>): Expr<number> {
    return {
      toLiquid: () => `${collection.toLiquid()}.size`,
      toClient: () => (ctx) => {
        const coll = collection.toClient()(ctx);
        if (Array.isArray(coll)) return coll.length;
        if (typeof coll === "string") return coll.length;
        if (coll && typeof coll === "object") return Object.keys(coll).length;
        return 0;
      },
    };
  },

  first(array: Expr<any[]>): Expr<any> {
    return {
      toLiquid: () => `${array.toLiquid()}.first`,
      toClient: () => (ctx) => {
        const arr = array.toClient()(ctx);
        return Array.isArray(arr) ? arr[0] : undefined;
      },
    };
  },

  last(array: Expr<any[]>): Expr<any> {
    return {
      toLiquid: () => `${array.toLiquid()}.last`,
      toClient: () => (ctx) => {
        const arr = array.toClient()(ctx);
        return Array.isArray(arr) ? arr[arr.length - 1] : undefined;
      },
    };
  },

  isNil(value: Expr<any>): Expr<boolean> {
    return {
      toLiquid: () => `${value.toLiquid()} == nil`,
      toClient: () => (ctx) => {
        const val = value.toClient()(ctx);
        return val === null || val === undefined;
      },
    };
  },

  isBlank(value: Expr<any>): Expr<boolean> {
    return {
      toLiquid: () => `${value.toLiquid()} == blank`,
      toClient: () => (ctx) => {
        const val = value.toClient()(ctx);
        if (val === null || val === undefined) return true;
        if (val === "") return true;
        if (Array.isArray(val) && val.length === 0) return true;
        if (typeof val === "object" && Object.keys(val).length === 0)
          return true;
        return false;
      },
    };
  },

  plus(a: Expr<number>, b: Expr<number>): Expr<number> {
    return {
      toLiquid: () => `${a.toLiquid()} | plus: ${b.toLiquid()}`,
      toClient: () => (ctx) => a.toClient()(ctx) + b.toClient()(ctx),
    };
  },

  minus(a: Expr<number>, b: Expr<number>): Expr<number> {
    return {
      toLiquid: () => `${a.toLiquid()} | minus: ${b.toLiquid()}`,
      toClient: () => (ctx) => a.toClient()(ctx) - b.toClient()(ctx),
    };
  },

  times(a: Expr<number>, b: Expr<number>): Expr<number> {
    return {
      toLiquid: () => `${a.toLiquid()} | times: ${b.toLiquid()}`,
      toClient: () => (ctx) => a.toClient()(ctx) * b.toClient()(ctx),
    };
  },

  dividedBy(a: Expr<number>, b: Expr<number>): Expr<number> {
    return {
      toLiquid: () => `${a.toLiquid()} | divided_by: ${b.toLiquid()}`,
      toClient: () => (ctx) => a.toClient()(ctx) / b.toClient()(ctx),
    };
  },

  modulo(a: Expr<number>, b: Expr<number>): Expr<number> {
    return {
      toLiquid: () => `${a.toLiquid()} | modulo: ${b.toLiquid()}`,
      toClient: () => (ctx) => a.toClient()(ctx) % b.toClient()(ctx),
    };
  },

  abs(value: Expr<number>): Expr<number> {
    return {
      toLiquid: () => `${value.toLiquid()} | abs`,
      toClient: () => (ctx) => Math.abs(value.toClient()(ctx)),
    };
  },

  ceil(value: Expr<number>): Expr<number> {
    return {
      toLiquid: () => `${value.toLiquid()} | ceil`,
      toClient: () => (ctx) => Math.ceil(value.toClient()(ctx)),
    };
  },

  floor(value: Expr<number>): Expr<number> {
    return {
      toLiquid: () => `${value.toLiquid()} | floor`,
      toClient: () => (ctx) => Math.floor(value.toClient()(ctx)),
    };
  },

  round(value: Expr<number>, decimals?: Expr<number>): Expr<number> {
    return {
      toLiquid: () =>
        decimals
          ? `${value.toLiquid()} | round: ${decimals.toLiquid()}`
          : `${value.toLiquid()} | round`,
      toClient: () => (ctx) => {
        const val = value.toClient()(ctx);
        const dec = decimals?.toClient()(ctx);
        if (dec) {
          const factor = Math.pow(10, dec);
          return Math.round(val * factor) / factor;
        }
        return Math.round(val);
      },
    };
  },

  append(str: Expr<string>, suffix: Expr<string>): Expr<string> {
    return {
      toLiquid: () => `${str.toLiquid()} | append: ${suffix.toLiquid()}`,
      toClient: () => (ctx) =>
        String(str.toClient()(ctx)) + String(suffix.toClient()(ctx)),
    };
  },

  prepend(str: Expr<string>, prefix: Expr<string>): Expr<string> {
    return {
      toLiquid: () => `${str.toLiquid()} | prepend: ${prefix.toLiquid()}`,
      toClient: () => (ctx) =>
        String(prefix.toClient()(ctx)) + String(str.toClient()(ctx)),
    };
  },

  downcase(str: Expr<string>): Expr<string> {
    return {
      toLiquid: () => `${str.toLiquid()} | downcase`,
      toClient: () => (ctx) => String(str.toClient()(ctx)).toLowerCase(),
    };
  },

  upcase(str: Expr<string>): Expr<string> {
    return {
      toLiquid: () => `${str.toLiquid()} | upcase`,
      toClient: () => (ctx) => String(str.toClient()(ctx)).toUpperCase(),
    };
  },

  capitalize(str: Expr<string>): Expr<string> {
    return {
      toLiquid: () => `${str.toLiquid()} | capitalize`,
      toClient: () => (ctx) => {
        const s = String(str.toClient()(ctx));
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      },
    };
  },

  strip(str: Expr<string>): Expr<string> {
    return {
      toLiquid: () => `${str.toLiquid()} | strip`,
      toClient: () => (ctx) => String(str.toClient()(ctx)).trim(),
    };
  },

  stripNewlines(str: Expr<string>): Expr<string> {
    return {
      toLiquid: () => `${str.toLiquid()} | strip_newlines`,
      toClient: () => (ctx) => String(str.toClient()(ctx)).replace(/\n/g, ""),
    };
  },

  truncate(
    str: Expr<string>,
    length: Expr<number>,
    ellipsis?: Expr<string>
  ): Expr<string> {
    return {
      toLiquid: () =>
        ellipsis
          ? `${str.toLiquid()} | truncate: ${length.toLiquid()}, ${ellipsis.toLiquid()}`
          : `${str.toLiquid()} | truncate: ${length.toLiquid()}`,
      toClient: () => (ctx) => {
        const s = String(str.toClient()(ctx));
        const len = length.toClient()(ctx);
        const ell = ellipsis?.toClient()(ctx) || "...";
        return s.length > len ? s.substring(0, len - ell.length) + ell : s;
      },
    };
  },

  replace(
    str: Expr<string>,
    search: Expr<string>,
    replacement: Expr<string>
  ): Expr<string> {
    return {
      toLiquid: () =>
        `${str.toLiquid()} | replace: ${search.toLiquid()}, ${replacement.toLiquid()}`,
      toClient: () => (ctx) => {
        const s = String(str.toClient()(ctx));
        const find = String(search.toClient()(ctx));
        const repl = String(replacement.toClient()(ctx));
        return s.split(find).join(repl);
      },
    };
  },

  split(str: Expr<string>, delimiter: Expr<string>): Expr<string[]> {
    return {
      toLiquid: () => `${str.toLiquid()} | split: ${delimiter.toLiquid()}`,
      toClient: () => (ctx) => {
        const s = String(str.toClient()(ctx));
        const delim = String(delimiter.toClient()(ctx));
        return s.split(delim);
      },
    };
  },

  join(array: Expr<any[]>, separator: Expr<string>): Expr<string> {
    return {
      toLiquid: () => `${array.toLiquid()} | join: ${separator.toLiquid()}`,
      toClient: () => (ctx) => {
        const arr = array.toClient()(ctx);
        const sep = separator.toClient()(ctx);
        return Array.isArray(arr) ? arr.join(sep) : "";
      },
    };
  },

  sort(array: Expr<any[]>, property?: Expr<string>): Expr<any[]> {
    return {
      toLiquid: () =>
        property
          ? `${array.toLiquid()} | sort: ${property.toLiquid()}`
          : `${array.toLiquid()} | sort`,
      toClient: () => (ctx) => {
        const arr = array.toClient()(ctx);
        if (!Array.isArray(arr)) return [];

        const prop = property?.toClient()(ctx);
        if (prop) {
          return [...arr].sort((a, b) => {
            const aVal = a[prop];
            const bVal = b[prop];
            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
            return 0;
          });
        }
        return [...arr].sort();
      },
    };
  },

  reverse(array: Expr<any[]>): Expr<any[]> {
    return {
      toLiquid: () => `${array.toLiquid()} | reverse`,
      toClient: () => (ctx) => {
        const arr = array.toClient()(ctx);
        return Array.isArray(arr) ? [...arr].reverse() : [];
      },
    };
  },

  uniq(array: Expr<any[]>): Expr<any[]> {
    return {
      toLiquid: () => `${array.toLiquid()} | uniq`,
      toClient: () => (ctx) => {
        const arr = array.toClient()(ctx);
        return Array.isArray(arr) ? [...new Set(arr)] : [];
      },
    };
  },

  compact(array: Expr<any[]>): Expr<any[]> {
    return {
      toLiquid: () => `${array.toLiquid()} | compact`,
      toClient: () => (ctx) => {
        const arr = array.toClient()(ctx);
        return Array.isArray(arr) ? arr.filter((v) => v != null) : [];
      },
    };
  },

  map(array: Expr<any[]>, property: Expr<string>): Expr<any[]> {
    return {
      toLiquid: () => `${array.toLiquid()} | map: ${property.toLiquid()}`,
      toClient: () => (ctx) => {
        const arr = array.toClient()(ctx);
        const prop = property.toClient()(ctx);
        return Array.isArray(arr) ? arr.map((item) => item?.[prop]) : [];
      },
    };
  },

  where(
    array: Expr<any[]>,
    property: Expr<string>,
    value?: Expr<any>
  ): Expr<any[]> {
    return {
      toLiquid: () =>
        value
          ? `${array.toLiquid()} | where: ${property.toLiquid()}, ${value.toLiquid()}`
          : `${array.toLiquid()} | where: ${property.toLiquid()}`,
      toClient: () => (ctx) => {
        const arr = array.toClient()(ctx);
        if (!Array.isArray(arr)) return [];

        const prop = property.toClient()(ctx);
        const val = value?.toClient()(ctx);

        if (val !== undefined) {
          return arr.filter((item) => item?.[prop] === val);
        }
        return arr.filter((item) => item?.[prop]);
      },
    };
  },

  date(value: Expr<any>, format: Expr<string>): Expr<string> {
    return {
      toLiquid: () => `${value.toLiquid()} | date: ${format.toLiquid()}`,
      toClient: () => (ctx) => {
        const val = value.toClient()(ctx);
        const fmt = format.toClient()(ctx);
        try {
          const date = new Date(val);
          // Basic format support for common patterns
          let result = fmt;
          const replacements: Record<string, string> = {
            "%Y": date.getFullYear().toString(),
            "%m": (date.getMonth() + 1).toString().padStart(2, "0"),
            "%d": date.getDate().toString().padStart(2, "0"),
            "%H": date.getHours().toString().padStart(2, "0"),
            "%M": date.getMinutes().toString().padStart(2, "0"),
            "%S": date.getSeconds().toString().padStart(2, "0"),
            "%B": date.toLocaleString("en-US", { month: "long" }),
            "%b": date.toLocaleString("en-US", { month: "short" }),
            "%A": date.toLocaleString("en-US", { weekday: "long" }),
            "%a": date.toLocaleString("en-US", { weekday: "short" }),
          };

          for (const [pattern, value] of Object.entries(replacements)) {
            result = result.replace(pattern, value);
          }
          return result;
        } catch {
          return String(val);
        }
      },
    };
  },

  default(value: Expr<any>, fallback: Expr<any>): Expr<any> {
    return {
      toLiquid: () => `${value.toLiquid()} | default: ${fallback.toLiquid()}`,
      toClient: () => (ctx) => {
        const val = value.toClient()(ctx);
        const fb = fallback.toClient()(ctx);
        return val === null || val === undefined || val === "" ? fb : val;
      },
    };
  },

  money(value: Expr<number>): Expr<string> {
    return {
      toLiquid: () => `${value.toLiquid()} | money`,
      toClient: () => (ctx) => {
        const val = value.toClient()(ctx);
        return `$${(val / 100).toFixed(2)}`;
      },
    };
  },

  moneyWithoutCurrency(value: Expr<number>): Expr<string> {
    return {
      toLiquid: () => `${value.toLiquid()} | money_without_currency`,
      toClient: () => (ctx) => {
        const val = value.toClient()(ctx);
        return (val / 100).toFixed(2);
      },
    };
  },

  handle(value: Expr<string>): Expr<string> {
    return {
      toLiquid: () => `${value.toLiquid()} | handle`,
      toClient: () => (ctx) => {
        const val = String(value.toClient()(ctx));
        return val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      },
    };
  },

  pluralize(
    count: Expr<number>,
    singular: Expr<string>,
    plural: Expr<string>
  ): Expr<string> {
    return {
      toLiquid: () =>
        `${count.toLiquid()} | pluralize: ${singular.toLiquid()}, ${plural.toLiquid()}`,
      toClient: () => (ctx) => {
        const num = count.toClient()(ctx);
        const sing = singular.toClient()(ctx);
        const plur = plural.toClient()(ctx);
        return num === 1 ? sing : plur;
      },
    };
  },
};

export { $ } from "./expr.js";
export { $$ as $enhanced };
