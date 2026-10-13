(() => {
  "use strict";

  const api = window.VLI_PC_HORSE_FIX_233 = {
    version: "23.3.3",
    phase: "loading",
    error: null,
    registered: false,
    centered: 0,
    status() {
      const meta = window.VLI_PC_HORSE_SHEET_META || {};
      return {
        version: this.version,
        phase: this.phase,
        error: this.error,
        registered: this.registered,
        centered: this.centered,
        atlasEntries: Object.keys(meta).length,
        K46Anchor: meta["m/vli_pc_k46_hb_st"]?.slice(2, 4) || null
      };
    }
  };

  const layers = ["马后", "马中", "马前"];
  const stand = "骑马站立";

  function table(source, name) {
    const line = source.split(/\r?\n/)
      .map(s => s.trim())
      .find(s => s.startsWith("const " + name + "="));

    if (!line) throw Error("Missing table: " + name);

    return JSON.parse(
      line.slice(line.indexOf("=") + 1).replace(/;$/, "")
    );
  }

  async function read(path) {
    const url = new URL(path, document.baseURI);
    url.searchParams.set("fix233", Date.now());

    const response = await fetch(url.href, {cache: "no-store"});
    if (!response.ok) throw Error(path + ": HTTP " + response.status);
    return response.text();
  }

  function setSheet(target, key, values) {
    if (Array.isArray(target[key])) {
      target[key].splice(0, target[key].length, ...values);
    } else {
      target[key] = values.slice();
    }
  }

  async function install() {
    try {
      const [atlasText, centersText] = await Promise.all([
        read("js/vli-pc-horse-atlas-v15.js"),
        read("js/vli-pc-horse-centers-v15-4.js")
      ]);

      const mapping = table(atlasText, "mapping");
      const names = table(atlasText, "status");
      const sheets = table(atlasText, "sheets");
      const parts = table(atlasText, "parts");
      const offsets = table(centersText, "nativeOffsets");

      if (Object.keys(mapping).length !== 42 ||
          Object.keys(sheets).length !== 1008) {
        throw Error("Invalid horse atlas");
      }

      Object.assign(window.VLI_PC_HORSE_EXACT_ROWS ||= {}, mapping);
      Object.assign(window.VLI_PC_HORSE_STATUS ||= {}, names);
      Object.assign(window.VLI_PC_HORSE_PARTS ||= {}, parts);

      const meta = window.VLI_PC_HORSE_SHEET_META ||= {};
      const corrected = {};

      for (const [key, base] of Object.entries(sheets)) {
        const v = base.slice();
        const d = offsets[key];

        if (d) {
          v[2] = Math.round((base[2] + d[0]) * 10) / 10;
          v[3] = Math.round((base[3] + d[1]) * 10) / 10;
          api.centered++;
        }

        corrected[key] = v;
        setSheet(meta, key, v);
      }

      let renderers = [];

      for (let attempt = 0; attempt < 60; attempt++) {
        renderers = [...new Set([
          window.JXLOOK,
          window.JXL,
          typeof JXL !== "undefined" ? JXL : null
        ].filter(j => j?.tabs?.m && j?.tabs?.f && j?.sheets))];

        if (renderers.length) break;
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (!renderers.length) {
        throw Error("JX renderer not initialized");
      }

      if (!window.JXLOOK?.tabs) {
        window.JXLOOK = renderers[0];
      }

      for (const j of renderers) {
        for (const [key, v] of Object.entries(corrected)) {
          setSheet(j.sheets, key, v);
        }

        for (const sex of ["m", "f"]) {
          for (const layer of layers) {
            const dst = j.tabs[sex][layer] ||= {};

            for (const [row, actions] of Object.entries(parts[layer])) {
              const mapped = {};

              for (const [action, base] of Object.entries(actions)) {
                mapped[action] = sex === "m" ? base : "m:" + base;
              }

              dst[row] = mapped;
            }
          }
        }
      }

      if (typeof jxHorseRow === "function") {
        const original = jxHorseRow;

        jxHorseRow = function(item) {
          const k = Number(item?.k);
          const row = 300 + k;
          const sex =
            typeof S !== "undefined" && S?.sex ? "f" : "m";

          if (Number(item?.d) === 10 &&
              Number.isInteger(k) && k >= 34 && k <= 75 &&
              window.JXLOOK?.tabs?.[sex]?.[layers[1]]?.[row]?.[stand]) {
            return row;
          }

          return original(item);
        };
      }

      try {
        if (window.VLI_PC_HORSE_RECOVERY_232?.forceRefresh) {
          window.VLI_PC_HORSE_RECOVERY_232.forceRefresh();
        } else if (typeof R !== "undefined" &&
                   R?.mounted && typeof jxSetup === "function") {
          const next = jxSetup();
          if (next?.rows) {
            R.jx = next;
            if (typeof jxPreload === "function") jxPreload();
          }
        }
      } catch (e) {
        console.warn("[Horse V23.3] Refresh:", e);
      }

      api.registered = true;
      api.phase = "ready";
      console.log("[Horse V23.3] READY", api.status());

    } catch (e) {
      api.phase = "error";
      api.error = String(e);
      console.error("[Horse V23.3]", e);
    }
  }