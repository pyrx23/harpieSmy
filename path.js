var Path = {
  version: "0.8.4",
  map: function (a) {
    if (Path.routes.defined.hasOwnProperty(a)) {
      return Path.routes.defined[a];
    } else {
      return new Path.core.route(a);
    }
  },
  root: function (a) {
    Path.routes.root = a;
  },
  rescue: function (a) {
    Path.routes.rescue = a;
  },
  history: {
    initial: {},
    pushState: function (a, b, c) {
      if (Path.history.supported) {
        if (Path.dispatch(c)) {
          history.pushState(a, b, c);
        }
      } else {
        if (Path.history.fallback) {
          window.location.hash = "#" + c;
        }
      }
    },
    popState: function (a) {
      var b =
        !Path.history.initial.popped &&
        location.href == Path.history.initial.URL;
      Path.history.initial.popped = true;
      if (b) return;
      Path.dispatch(document.location.pathname);
    },
    listen: function (a) {
      Path.history.supported = !!(window.history && window.history.pushState);
      Path.history.fallback = a;
      if (Path.history.supported) {
        (Path.history.initial.popped = "state" in window.history),
          (Path.history.initial.URL = location.href);
        window.onpopstate = Path.history.popState;
      } else {
        if (Path.history.fallback) {
          for (route in Path.routes.defined) {
            if (route.charAt(0) != "#") {
              Path.routes.defined["#" + route] = Path.routes.defined[route];
              Path.routes.defined["#" + route].path = "#" + route;
            }
          }
          Path.listen();
        }
      }
    },
  },
  match: function (a, b) {
    var c = {},
      d = null,
      e,
      f,
      g,
      h,
      i;
    for (d in Path.routes.defined) {
      if (d !== null && d !== undefined) {
        d = Path.routes.defined[d];
        e = d.partition();
        for (h = 0; h < e.length; h++) {
          f = e[h];
          i = a;
          if (f.search(/:/) > 0) {
            for (g = 0; g < f.split("/").length; g++) {
              if (
                g < i.split("/").length &&
                f.split("/")[g].charAt(0) === ":"
              ) {
                c[f.split("/")[g].replace(/:/, "")] = i.split("/")[g];
                i = i.replace(i.split("/")[g], f.split("/")[g]);
              }
            }
          }
          if (f === i) {
            if (b) {
              d.params = c;
            }
            return d;
          }
        }
      }
    }
    return null;
  },
  dispatch: function (a) {
    var b, c;
    if (Path.routes.current !== a) {
      Path.routes.previous = Path.routes.current;
      Path.routes.current = a;
      c = Path.match(a, true);
      if (Path.routes.previous) {
        b = Path.match(Path.routes.previous);
        if (b !== null && b.do_exit !== null) {
          b.do_exit();
        }
      }
      if (c !== null) {
        c.run();
        return true;
      } else {
        if (Path.routes.rescue !== null) {
          Path.routes.rescue();
        }
      }
    }
  },
  listen: function () {
    var a = function () {
      Path.dispatch(location.hash);
    };
    if (location.hash === "") {
      if (Path.routes.root !== null) {
        location.hash = Path.routes.root;
      }
    }
    if (
      "onhashchange" in window &&
      (!document.documentMode || document.documentMode >= 8)
    ) {
      window.onhashchange = a;
    } else {
      setInterval(a, 50);
    }
    if (location.hash !== "") {
      Path.dispatch(location.hash);
    }
  },
  core: {
    route: function (a) {
      this.path = a;
      this.action = null;
      this.do_enter = [];
      this.do_exit = null;
      this.params = {};
      Path.routes.defined[a] = this;
    },
  },
  routes: {
    current: null,
    root: null,
    rescue: null,
    previous: null,
    defined: {},
  },
};
Path.core.route.prototype = {
  to: function (a) {
    this.action = a;
    return this;
  },
  enter: function (a) {
    if (a instanceof Array) {
      this.do_enter = this.do_enter.concat(a);
    } else {
      this.do_enter.push(a);
    }
    return this;
  },
  exit: function (a) {
    this.do_exit = a;
    return this;
  },
  partition: function () {
    var a = [],
      b = [],
      c = /\(([^}]+?)\)/g,
      d,
      e;
    while ((d = c.exec(this.path))) {
      a.push(d[1]);
    }
    b.push(this.path.split("(")[0]);
    for (e = 0; e < a.length; e++) {
      b.push(b[b.length - 1] + a[e]);
    }
    return b;
  },
  run: function () {
    var a = false,
      b,
      c,
      d;
    if (Path.routes.defined[this.path].hasOwnProperty("do_enter")) {
      if (Path.routes.defined[this.path].do_enter.length > 0) {
        for (b = 0; b < Path.routes.defined[this.path].do_enter.length; b++) {
          c = Path.routes.defined[this.path].do_enter[b]();
          if (c === false) {
            a = true;
            break;
          }
        }
      }
    }
    if (!a) {
      Path.routes.defined[this.path].action();
    }
  },
};
