var __PreliquifyBundle_ProductCardSimple = (() => {
  var O,
    p,
    st,
    Ut,
    P,
    ut,
    at,
    dt,
    ct,
    K,
    Q,
    J,
    ft,
    H = {},
    pt = [],
    Ft = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,
    V = Array.isArray;
  function k(e, t) {
    for (var n in t) e[n] = t[n];
    return e;
  }
  function X(e) {
    e && e.parentNode && e.parentNode.removeChild(e);
  }
  function tt(e, t, n) {
    var o,
      u,
      r,
      _ = {};
    for (r in t)
      r == "key" ? (o = t[r]) : r == "ref" ? (u = t[r]) : (_[r] = t[r]);
    if (
      (arguments.length > 2 &&
        (_.children = arguments.length > 3 ? O.call(arguments, 2) : n),
      typeof e == "function" && e.defaultProps != null)
    )
      for (r in e.defaultProps) _[r] === void 0 && (_[r] = e.defaultProps[r]);
    return D(e, _, o, u, null);
  }
  function D(e, t, n, o, u) {
    var r = {
      type: e,
      props: t,
      key: n,
      ref: o,
      __k: null,
      __: null,
      __b: 0,
      __e: null,
      __c: null,
      constructor: void 0,
      __v: u ?? ++st,
      __i: -1,
      __u: 0,
    };
    return (u == null && p.vnode != null && p.vnode(r), r);
  }
  function x(e) {
    return e.children;
  }
  function R(e, t) {
    ((this.props = e), (this.context = t));
  }
  function N(e, t) {
    if (t == null) return e.__ ? N(e.__, e.__i + 1) : null;
    for (var n; t < e.__k.length; t++)
      if ((n = e.__k[t]) != null && n.__e != null) return n.__e;
    return typeof e.type == "function" ? N(e) : null;
  }
  function ht(e) {
    var t, n;
    if ((e = e.__) != null && e.__c != null) {
      for (e.__e = e.__c.base = null, t = 0; t < e.__k.length; t++)
        if ((n = e.__k[t]) != null && n.__e != null) {
          e.__e = e.__c.base = n.__e;
          break;
        }
      return ht(e);
    }
  }
  function G(e) {
    ((!e.__d && (e.__d = !0) && P.push(e) && !W.__r++) ||
      ut != p.debounceRendering) &&
      ((ut = p.debounceRendering) || at)(W);
  }
  function W() {
    for (var e, t, n, o, u, r, _, s = 1; P.length; )
      (P.length > s && P.sort(dt),
        (e = P.shift()),
        (s = P.length),
        e.__d &&
          ((n = void 0),
          (o = void 0),
          (u = (o = (t = e).__v).__e),
          (r = []),
          (_ = []),
          t.__P &&
            (((n = k({}, o)).__v = o.__v + 1),
            p.vnode && p.vnode(n),
            et(
              t.__P,
              n,
              o,
              t.__n,
              t.__P.namespaceURI,
              32 & o.__u ? [u] : null,
              r,
              u ?? N(o),
              !!(32 & o.__u),
              _
            ),
            (n.__v = o.__v),
            (n.__.__k[n.__i] = n),
            qt(r, n, _),
            (o.__e = o.__ = null),
            n.__e != u && ht(n))));
    W.__r = 0;
  }
  function mt(e, t, n, o, u, r, _, s, d, l, c) {
    var i,
      m,
      a,
      C,
      g,
      y,
      f,
      h = (o && o.__k) || pt,
      v = t.length;
    for (d = It(n, t, h, d, v), i = 0; i < v; i++)
      (a = n.__k[i]) != null &&
        ((m = a.__i == -1 ? H : h[a.__i] || H),
        (a.__i = i),
        (y = et(e, a, m, u, r, _, s, d, l, c)),
        (C = a.__e),
        a.ref &&
          m.ref != a.ref &&
          (m.ref && nt(m.ref, null, a), c.push(a.ref, a.__c || C, a)),
        g == null && C != null && (g = C),
        (f = !!(4 & a.__u)) || m.__k === a.__k
          ? (d = gt(a, d, e, f))
          : typeof a.type == "function" && y !== void 0
            ? (d = y)
            : C && (d = C.nextSibling),
        (a.__u &= -7));
    return ((n.__e = g), d);
  }
  function It(e, t, n, o, u) {
    var r,
      _,
      s,
      d,
      l,
      c = n.length,
      i = c,
      m = 0;
    for (e.__k = new Array(u), r = 0; r < u; r++)
      (_ = t[r]) != null && typeof _ != "boolean" && typeof _ != "function"
        ? ((d = r + m),
          ((_ = e.__k[r] =
            typeof _ == "string" ||
            typeof _ == "number" ||
            typeof _ == "bigint" ||
            _.constructor == String
              ? D(null, _, null, null, null)
              : V(_)
                ? D(x, { children: _ }, null, null, null)
                : _.constructor == null && _.__b > 0
                  ? D(_.type, _.props, _.key, _.ref ? _.ref : null, _.__v)
                  : _).__ = e),
          (_.__b = e.__b + 1),
          (s = null),
          (l = _.__i = Mt(_, n, d, i)) != -1 &&
            (i--, (s = n[l]) && (s.__u |= 2)),
          s == null || s.__v == null
            ? (l == -1 && (u > c ? m-- : u < c && m++),
              typeof _.type != "function" && (_.__u |= 4))
            : l != d &&
              (l == d - 1
                ? m--
                : l == d + 1
                  ? m++
                  : (l > d ? m-- : m++, (_.__u |= 4))))
        : (e.__k[r] = null);
    if (i)
      for (r = 0; r < c; r++)
        (s = n[r]) != null &&
          !(2 & s.__u) &&
          (s.__e == o && (o = N(s)), yt(s, s));
    return o;
  }
  function gt(e, t, n, o) {
    var u, r;
    if (typeof e.type == "function") {
      for (u = e.__k, r = 0; u && r < u.length; r++)
        u[r] && ((u[r].__ = e), (t = gt(u[r], t, n, o)));
      return t;
    }
    e.__e != t &&
      (o &&
        (t && e.type && !t.parentNode && (t = N(e)),
        n.insertBefore(e.__e, t || null)),
      (t = e.__e));
    do t = t && t.nextSibling;
    while (t != null && t.nodeType == 8);
    return t;
  }
  function Mt(e, t, n, o) {
    var u,
      r,
      _,
      s = e.key,
      d = e.type,
      l = t[n],
      c = l != null && (2 & l.__u) == 0;
    if ((l === null && e.key == null) || (c && s == l.key && d == l.type))
      return n;
    if (o > (c ? 1 : 0)) {
      for (u = n - 1, r = n + 1; u >= 0 || r < t.length; )
        if (
          (l = t[(_ = u >= 0 ? u-- : r++)]) != null &&
          !(2 & l.__u) &&
          s == l.key &&
          d == l.type
        )
          return _;
    }
    return -1;
  }
  function _t(e, t, n) {
    t[0] == "-"
      ? e.setProperty(t, n ?? "")
      : (e[t] =
          n == null ? "" : typeof n != "number" || Ft.test(t) ? n : n + "px");
  }
  function M(e, t, n, o, u) {
    var r, _;
    t: if (t == "style")
      if (typeof n == "string") e.style.cssText = n;
      else {
        if ((typeof o == "string" && (e.style.cssText = o = ""), o))
          for (t in o) (n && t in n) || _t(e.style, t, "");
        if (n) for (t in n) (o && n[t] == o[t]) || _t(e.style, t, n[t]);
      }
    else if (t[0] == "o" && t[1] == "n")
      ((r = t != (t = t.replace(ct, "$1"))),
        (_ = t.toLowerCase()),
        (t =
          _ in e || t == "onFocusOut" || t == "onFocusIn"
            ? _.slice(2)
            : t.slice(2)),
        e.l || (e.l = {}),
        (e.l[t + r] = n),
        n
          ? o
            ? (n.u = o.u)
            : ((n.u = K), e.addEventListener(t, r ? J : Q, r))
          : e.removeEventListener(t, r ? J : Q, r));
    else {
      if (u == "http://www.w3.org/2000/svg")
        t = t.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if (
        t != "width" &&
        t != "height" &&
        t != "href" &&
        t != "list" &&
        t != "form" &&
        t != "tabIndex" &&
        t != "download" &&
        t != "rowSpan" &&
        t != "colSpan" &&
        t != "role" &&
        t != "popover" &&
        t in e
      )
        try {
          e[t] = n ?? "";
          break t;
        } catch {}
      typeof n == "function" ||
        (n == null || (n === !1 && t[4] != "-")
          ? e.removeAttribute(t)
          : e.setAttribute(t, t == "popover" && n == 1 ? "" : n));
    }
  }
  function lt(e) {
    return function (t) {
      if (this.l) {
        var n = this.l[t.type + e];
        if (t.t == null) t.t = K++;
        else if (t.t < n.u) return;
        return n(p.event ? p.event(t) : t);
      }
    };
  }
  function et(e, t, n, o, u, r, _, s, d, l) {
    var c,
      i,
      m,
      a,
      C,
      g,
      y,
      f,
      h,
      v,
      S,
      b,
      A,
      F,
      I,
      T,
      Y,
      w = t.type;
    if (t.constructor != null) return null;
    (128 & n.__u && ((d = !!(32 & n.__u)), (r = [(s = t.__e = n.__e)])),
      (c = p.__b) && c(t));
    t: if (typeof w == "function")
      try {
        if (
          ((f = t.props),
          (h = "prototype" in w && w.prototype.render),
          (v = (c = w.contextType) && o[c.__c]),
          (S = c ? (v ? v.props.value : c.__) : o),
          n.__c
            ? (y = (i = t.__c = n.__c).__ = i.__E)
            : (h
                ? (t.__c = i = new w(f, S))
                : ((t.__c = i = new R(f, S)),
                  (i.constructor = w),
                  (i.render = Rt)),
              v && v.sub(i),
              (i.props = f),
              i.state || (i.state = {}),
              (i.context = S),
              (i.__n = o),
              (m = i.__d = !0),
              (i.__h = []),
              (i._sb = [])),
          h && i.__s == null && (i.__s = i.state),
          h &&
            w.getDerivedStateFromProps != null &&
            (i.__s == i.state && (i.__s = k({}, i.__s)),
            k(i.__s, w.getDerivedStateFromProps(f, i.__s))),
          (a = i.props),
          (C = i.state),
          (i.__v = t),
          m)
        )
          (h &&
            w.getDerivedStateFromProps == null &&
            i.componentWillMount != null &&
            i.componentWillMount(),
            h &&
              i.componentDidMount != null &&
              i.__h.push(i.componentDidMount));
        else {
          if (
            (h &&
              w.getDerivedStateFromProps == null &&
              f !== a &&
              i.componentWillReceiveProps != null &&
              i.componentWillReceiveProps(f, S),
            (!i.__e &&
              i.shouldComponentUpdate != null &&
              i.shouldComponentUpdate(f, i.__s, S) === !1) ||
              t.__v == n.__v)
          ) {
            for (
              t.__v != n.__v &&
                ((i.props = f), (i.state = i.__s), (i.__d = !1)),
                t.__e = n.__e,
                t.__k = n.__k,
                t.__k.some(function (E) {
                  E && (E.__ = t);
                }),
                b = 0;
              b < i._sb.length;
              b++
            )
              i.__h.push(i._sb[b]);
            ((i._sb = []), i.__h.length && _.push(i));
            break t;
          }
          (i.componentWillUpdate != null && i.componentWillUpdate(f, i.__s, S),
            h &&
              i.componentDidUpdate != null &&
              i.__h.push(function () {
                i.componentDidUpdate(a, C, g);
              }));
        }
        if (
          ((i.context = S),
          (i.props = f),
          (i.__P = e),
          (i.__e = !1),
          (A = p.__r),
          (F = 0),
          h)
        ) {
          for (
            i.state = i.__s,
              i.__d = !1,
              A && A(t),
              c = i.render(i.props, i.state, i.context),
              I = 0;
            I < i._sb.length;
            I++
          )
            i.__h.push(i._sb[I]);
          i._sb = [];
        } else
          do
            ((i.__d = !1),
              A && A(t),
              (c = i.render(i.props, i.state, i.context)),
              (i.state = i.__s));
          while (i.__d && ++F < 25);
        ((i.state = i.__s),
          i.getChildContext != null && (o = k(k({}, o), i.getChildContext())),
          h &&
            !m &&
            i.getSnapshotBeforeUpdate != null &&
            (g = i.getSnapshotBeforeUpdate(a, C)),
          (T = c),
          c != null &&
            c.type === x &&
            c.key == null &&
            (T = Ct(c.props.children)),
          (s = mt(e, V(T) ? T : [T], t, n, o, u, r, _, s, d, l)),
          (i.base = t.__e),
          (t.__u &= -161),
          i.__h.length && _.push(i),
          y && (i.__E = i.__ = null));
      } catch (E) {
        if (((t.__v = null), d || r != null))
          if (E.then) {
            for (
              t.__u |= d ? 160 : 128;
              s && s.nodeType == 8 && s.nextSibling;

            )
              s = s.nextSibling;
            ((r[r.indexOf(s)] = null), (t.__e = s));
          } else {
            for (Y = r.length; Y--; ) X(r[Y]);
            Z(t);
          }
        else ((t.__e = n.__e), (t.__k = n.__k), E.then || Z(t));
        p.__e(E, t, n);
      }
    else
      r == null && t.__v == n.__v
        ? ((t.__k = n.__k), (t.__e = n.__e))
        : (s = t.__e = Dt(n.__e, t, n, o, u, r, _, d, l));
    return ((c = p.diffed) && c(t), 128 & t.__u ? void 0 : s);
  }
  function Z(e) {
    (e && e.__c && (e.__c.__e = !0), e && e.__k && e.__k.forEach(Z));
  }
  function qt(e, t, n) {
    for (var o = 0; o < n.length; o++) nt(n[o], n[++o], n[++o]);
    (p.__c && p.__c(t, e),
      e.some(function (u) {
        try {
          ((e = u.__h),
            (u.__h = []),
            e.some(function (r) {
              r.call(u);
            }));
        } catch (r) {
          p.__e(r, u.__v);
        }
      }));
  }
  function Ct(e) {
    return typeof e != "object" || e == null || (e.__b && e.__b > 0)
      ? e
      : V(e)
        ? e.map(Ct)
        : k({}, e);
  }
  function Dt(e, t, n, o, u, r, _, s, d) {
    var l,
      c,
      i,
      m,
      a,
      C,
      g,
      y = n.props,
      f = t.props,
      h = t.type;
    if (
      (h == "svg"
        ? (u = "http://www.w3.org/2000/svg")
        : h == "math"
          ? (u = "http://www.w3.org/1998/Math/MathML")
          : u || (u = "http://www.w3.org/1999/xhtml"),
      r != null)
    ) {
      for (l = 0; l < r.length; l++)
        if (
          (a = r[l]) &&
          "setAttribute" in a == !!h &&
          (h ? a.localName == h : a.nodeType == 3)
        ) {
          ((e = a), (r[l] = null));
          break;
        }
    }
    if (e == null) {
      if (h == null) return document.createTextNode(f);
      ((e = document.createElementNS(u, h, f.is && f)),
        s && (p.__m && p.__m(t, r), (s = !1)),
        (r = null));
    }
    if (h == null) y === f || (s && e.data == f) || (e.data = f);
    else {
      if (
        ((r = r && O.call(e.childNodes)), (y = n.props || H), !s && r != null)
      )
        for (y = {}, l = 0; l < e.attributes.length; l++)
          y[(a = e.attributes[l]).name] = a.value;
      for (l in y)
        if (((a = y[l]), l != "children")) {
          if (l == "dangerouslySetInnerHTML") i = a;
          else if (!(l in f)) {
            if (
              (l == "value" && "defaultValue" in f) ||
              (l == "checked" && "defaultChecked" in f)
            )
              continue;
            M(e, l, null, a, u);
          }
        }
      for (l in f)
        ((a = f[l]),
          l == "children"
            ? (m = a)
            : l == "dangerouslySetInnerHTML"
              ? (c = a)
              : l == "value"
                ? (C = a)
                : l == "checked"
                  ? (g = a)
                  : (s && typeof a != "function") ||
                    y[l] === a ||
                    M(e, l, a, y[l], u));
      if (c)
        (s ||
          (i && (c.__html == i.__html || c.__html == e.innerHTML)) ||
          (e.innerHTML = c.__html),
          (t.__k = []));
      else if (
        (i && (e.innerHTML = ""),
        mt(
          t.type == "template" ? e.content : e,
          V(m) ? m : [m],
          t,
          n,
          o,
          h == "foreignObject" ? "http://www.w3.org/1999/xhtml" : u,
          r,
          _,
          r ? r[0] : n.__k && N(n, 0),
          s,
          d
        ),
        r != null)
      )
        for (l = r.length; l--; ) X(r[l]);
      s ||
        ((l = "value"),
        h == "progress" && C == null
          ? e.removeAttribute("value")
          : C != null &&
            (C !== e[l] ||
              (h == "progress" && !C) ||
              (h == "option" && C != y[l])) &&
            M(e, l, C, y[l], u),
        (l = "checked"),
        g != null && g != e[l] && M(e, l, g, y[l], u));
    }
    return e;
  }
  function nt(e, t, n) {
    try {
      if (typeof e == "function") {
        var o = typeof e.__u == "function";
        (o && e.__u(), (o && t == null) || (e.__u = e(t)));
      } else e.current = t;
    } catch (u) {
      p.__e(u, n);
    }
  }
  function yt(e, t, n) {
    var o, u;
    if (
      (p.unmount && p.unmount(e),
      (o = e.ref) && ((o.current && o.current != e.__e) || nt(o, null, t)),
      (o = e.__c) != null)
    ) {
      if (o.componentWillUnmount)
        try {
          o.componentWillUnmount();
        } catch (r) {
          p.__e(r, t);
        }
      o.base = o.__P = null;
    }
    if ((o = e.__k))
      for (u = 0; u < o.length; u++)
        o[u] && yt(o[u], t, n || typeof e.type != "function");
    (n || X(e.__e), (e.__c = e.__ = e.__e = void 0));
  }
  function Rt(e, t, n) {
    return this.constructor(e, n);
  }
  function Lt(e, t, n) {
    var o, u, r, _;
    (t == document && (t = document.documentElement),
      p.__ && p.__(e, t),
      (u = (o = typeof n == "function") ? null : (n && n.__k) || t.__k),
      (r = []),
      (_ = []),
      et(
        t,
        (e = ((!o && n) || t).__k = tt(x, null, [e])),
        u || H,
        H,
        t.namespaceURI,
        !o && n ? [n] : u ? null : t.firstChild ? O.call(t.childNodes) : null,
        r,
        !o && n ? n : u ? u.__e : t.firstChild,
        o,
        _
      ),
      qt(r, e, _));
  }
  function vt(e) {
    function t(n) {
      var o, u;
      return (
        this.getChildContext ||
          ((o = new Set()),
          ((u = {})[t.__c] = this),
          (this.getChildContext = function () {
            return u;
          }),
          (this.componentWillUnmount = function () {
            o = null;
          }),
          (this.shouldComponentUpdate = function (r) {
            this.props.value != r.value &&
              o.forEach(function (_) {
                ((_.__e = !0), G(_));
              });
          }),
          (this.sub = function (r) {
            o.add(r);
            var _ = r.componentWillUnmount;
            r.componentWillUnmount = function () {
              (o && o.delete(r), _ && _.call(r));
            };
          })),
        n.children
      );
    }
    return (
      (t.__c = "__cC" + ft++),
      (t.__ = e),
      (t.Provider =
        t.__l =
        (t.Consumer = function (n, o) {
          return n.children(o);
        }).contextType =
          t),
      t
    );
  }
  ((O = pt.slice),
    (p = {
      __e: function (e, t, n, o) {
        for (var u, r, _; (t = t.__); )
          if ((u = t.__c) && !u.__)
            try {
              if (
                ((r = u.constructor) &&
                  r.getDerivedStateFromError != null &&
                  (u.setState(r.getDerivedStateFromError(e)), (_ = u.__d)),
                u.componentDidCatch != null &&
                  (u.componentDidCatch(e, o || {}), (_ = u.__d)),
                _)
              )
                return (u.__E = u);
            } catch (s) {
              e = s;
            }
        throw e;
      },
    }),
    (st = 0),
    (Ut = function (e) {
      return e != null && e.constructor == null;
    }),
    (R.prototype.setState = function (e, t) {
      var n;
      ((n =
        this.__s != null && this.__s != this.state
          ? this.__s
          : (this.__s = k({}, this.state))),
        typeof e == "function" && (e = e(k({}, n), this.props)),
        e && k(n, e),
        e != null && this.__v && (t && this._sb.push(t), G(this)));
    }),
    (R.prototype.forceUpdate = function (e) {
      this.__v && ((this.__e = !0), e && this.__h.push(e), G(this));
    }),
    (R.prototype.render = x),
    (P = []),
    (at =
      typeof Promise == "function"
        ? Promise.prototype.then.bind(Promise.resolve())
        : setTimeout),
    (dt = function (e, t) {
      return e.__v.__b - t.__v.__b;
    }),
    (W.__r = 0),
    (ct = /(PointerCapture)$|Capture$/i),
    (K = 0),
    (Q = lt(!1)),
    (J = lt(!0)),
    (ft = 0));
  var ot,
    $,
    it,
    $t,
    St = 0,
    Et = [],
    L = p,
    wt = L.__b,
    bt = L.__r,
    kt = L.diffed,
    xt = L.__c,
    jt = L.unmount,
    At = L.__;
  function Wt(e, t) {
    (L.__h && L.__h($, e, St || t), (St = 0));
    var n = $.__H || ($.__H = { __: [], __h: [] });
    return (e >= n.__.length && n.__.push({}), n.__[e]);
  }
  function Nt(e) {
    var t = $.context[e.__c],
      n = Wt(ot++, 9);
    return (
      (n.c = e),
      t ? (n.__ == null && ((n.__ = !0), t.sub($)), t.props.value) : e.__
    );
  }
  function Ot() {
    for (var e; (e = Et.shift()); )
      if (e.__P && e.__H)
        try {
          (e.__H.__h.forEach(z), e.__H.__h.forEach(rt), (e.__H.__h = []));
        } catch (t) {
          ((e.__H.__h = []), L.__e(t, e.__v));
        }
  }
  ((L.__b = function (e) {
    (($ = null), wt && wt(e));
  }),
    (L.__ = function (e, t) {
      (e && t.__k && t.__k.__m && (e.__m = t.__k.__m), At && At(e, t));
    }),
    (L.__r = function (e) {
      (bt && bt(e), (ot = 0));
      var t = ($ = e.__c).__H;
      (t &&
        (it === $
          ? ((t.__h = []),
            ($.__h = []),
            t.__.forEach(function (n) {
              (n.__N && (n.__ = n.__N), (n.u = n.__N = void 0));
            }))
          : (t.__h.forEach(z), t.__h.forEach(rt), (t.__h = []), (ot = 0))),
        (it = $));
    }),
    (L.diffed = function (e) {
      kt && kt(e);
      var t = e.__c;
      (t &&
        t.__H &&
        (t.__H.__h.length &&
          ((Et.push(t) !== 1 && $t === L.requestAnimationFrame) ||
            (($t = L.requestAnimationFrame) || Vt)(Ot)),
        t.__H.__.forEach(function (n) {
          (n.u && (n.__H = n.u), (n.u = void 0));
        })),
        (it = $ = null));
    }),
    (L.__c = function (e, t) {
      (t.some(function (n) {
        try {
          (n.__h.forEach(z),
            (n.__h = n.__h.filter(function (o) {
              return !o.__ || rt(o);
            })));
        } catch (o) {
          (t.some(function (u) {
            u.__h && (u.__h = []);
          }),
            (t = []),
            L.__e(o, n.__v));
        }
      }),
        xt && xt(e, t));
    }),
    (L.unmount = function (e) {
      jt && jt(e);
      var t,
        n = e.__c;
      n &&
        n.__H &&
        (n.__H.__.forEach(function (o) {
          try {
            z(o);
          } catch (u) {
            t = u;
          }
        }),
        (n.__H = void 0),
        t && L.__e(t, n.__v));
    }));
  var Pt = typeof requestAnimationFrame == "function";
  function Vt(e) {
    var t,
      n = function () {
        (clearTimeout(o), Pt && cancelAnimationFrame(t), setTimeout(e));
      },
      o = setTimeout(n, 35);
    Pt && (t = requestAnimationFrame(n));
  }
  function z(e) {
    var t = $,
      n = e.__c;
    (typeof n == "function" && ((e.__c = void 0), n()), ($ = t));
  }
  function rt(e) {
    var t = $;
    ((e.__c = e.__()), ($ = t));
  }
  var Tt = vt("client"),
    ie = Tt.Provider,
    j = () => Nt(Tt);
  var U = (e) => e;
  var zt = 0,
    le = Array.isArray;
  function q(e, t, n, o, u, r) {
    t || (t = {});
    var _,
      s,
      d = t;
    if ("ref" in d)
      for (s in ((d = {}), t)) s == "ref" ? (_ = t[s]) : (d[s] = t[s]);
    var l = {
      type: e,
      props: d,
      key: n,
      ref: _,
      __k: null,
      __: null,
      __b: 0,
      __e: null,
      __c: null,
      constructor: void 0,
      __v: --zt,
      __i: -1,
      __u: 0,
      __source: u,
      __self: r,
    };
    if (typeof e == "function" && (_ = e.defaultProps))
      for (s in _) d[s] === void 0 && (d[s] = _[s]);
    return (p.vnode && p.vnode(l), l);
  }
  function Ht(e, t, n = {}) {
    let o = n.componentName || e.displayName || e.name || "Component",
      u =
        n.id ||
        o
          .toLowerCase()
          .replace(/([A-Z])/g, "-$1")
          .replace(/^-/, "");
    function r(s) {
      let d = Object.entries(t);
      if (d.length === 0)
        return j() === "liquid"
          ? q("div", {
              "data-preliq-island": o,
              "data-preliq-id": u,
              "data-preliq-props": U("{}"),
              children: q(e, { ...s }),
            })
          : q(e, { ...s });
      let l = d[0],
        c = String(l[0]),
        i = l[1],
        m = typeof i == "string" ? i : i.liquidVar,
        a = typeof i == "object" && "default" in i ? i.default : void 0,
        C = c.replace(/'/g, "''"),
        g = `{% assign _q = 'a"b' | split: 'a' | last | split: 'b' | first %}`;
      if (
        ((g += "{% assign _json = '{' %}"),
        (g += `{% assign _json = _json | append: _q | append: '${C}' | append: _q | append: ':' %}`),
        (g += `{% assign _val = ${m}`),
        a !== void 0)
      ) {
        let f = typeof a == "string" ? `"${a}"` : String(a);
        g += ` | default: ${f}`;
      }
      ((g += " | json | escape %}"),
        (g += "{% assign _json = _json | append: _val %}"));
      for (let f = 1; f < d.length; f++) {
        let [h, v] = d[f],
          S = typeof v == "string" ? v : v.liquidVar,
          b = typeof v == "object" && "default" in v ? v.default : void 0,
          A = String(h).replace(/'/g, "''");
        if (
          ((g += `{% assign _json = _json | append: ',' | append: _q | append: '${A}' | append: _q | append: ':' %}`),
          (g += `{% assign _val = ${S}`),
          b !== void 0)
        ) {
          let F = typeof b == "string" ? `"${b}"` : String(b);
          g += ` | default: ${F}`;
        }
        ((g += " | json | escape %}"),
          (g += "{% assign _json = _json | append: _val %}"));
      }
      return (
        (g += "{% assign _json = _json | append: '}' %}{{ _json }}"),
        j() === "liquid"
          ? q("div", {
              "data-preliq-island": o,
              "data-preliq-id": u,
              children: [
                q("script", {
                  type: "application/json",
                  "data-preliq-props": "",
                  dangerouslySetInnerHTML: { __html: U(g) },
                }),
                q(e, { ...s }),
              ],
            })
          : q(e, { ...s })
      );
    }
    function _() {
      let s = {};
      for (let [d, l] of Object.entries(t)) {
        let c = typeof l == "string" ? l : l.liquidVar,
          i = typeof l == "object" && "default" in l ? l.default : void 0;
        i !== void 0
          ? (s[d] = U(
              `{{ ${c} | default: ${typeof i == "string" ? `"${i}"` : i} | json | escape }}`
            ))
          : (s[d] = U(`{{ ${c} | json | escape }}`));
      }
      return q(r, { ...s });
    }
    return (
      (_.displayName = `${o}Snippet`),
      (_.__preliquifyComponent = e),
      (_.__preliquifyComponentName = o),
      _
    );
  }
  function Bt({ product: e, collection: t, showPrice: n, customTitle: o }) {
    return q("div", {
      className: "product-card",
      children: [
        q("h3", { children: o || e?.title || "Product Title" }),
        n &&
          q("div", { className: "price", children: ["$", e?.price || "0.00"] }),
        t && q("div", { className: "collection", children: t.title }),
      ],
    });
  }
  var B = Ht(Bt, {
    product: "product",
    collection: "collection",
    showPrice: { liquidVar: "showPrice", default: !0 },
    customTitle: "customTitle",
  });
  typeof window < "u" && (window.preact = { h: tt, render: Lt });
  var Yt = B.__preliquifyComponent || B,
    en = B.__preliquifyComponentName || "ProductCardSimple";
  (function () {
    let e = !1;
    function t() {
      if (!e) {
        if (
          typeof window < "u" &&
          window.__PRELIQUIFY__ &&
          window.__PRELIQUIFY__.register
        ) {
          (window.__PRELIQUIFY__.register("ProductCardSimple", Yt),
            (e = !0),
            window.__PRELIQUIFY__.hydrate &&
              document.body &&
              window.__PRELIQUIFY__.hydrate());
          return;
        }
        setTimeout(t, 10);
      }
    }
    typeof window < "u" &&
      (document.readyState === "loading"
        ? document.addEventListener("DOMContentLoaded", t)
        : t());
  })();
})();
