/* VLI PC Horse 23.2.1 - Atlas and SPR center recovery */
(function() {
  "use strict";

  if (window.VLI_PC_HORSE_PATCH_2321) return;

  const fix = window.VLI_PC_HORSE_PATCH_2321 = {
    version: "23.2.1",
    phase: "starting",
    error: null,

    status() {
      const m = window.VLI_PC_HORSE_SHEET_META || {};

      return {
        version: this.version,
        phase: this.phase,
        error: this.error,
        atlasEntries: Object.keys(m).length,
        centered:
          window.VLI_PC_HORSE_CENTER_V154_STATUS?.corrected || 0,
        K46Anchor:
          m["m/vli_pc_k46_hb_st"]?.slice(2, 4) || null,
        K46Valid:
          window.VLI_PC_HORSE_RECOVERY_232
            ?.validate?.(46)?.ok ?? false
      };
    }
  };

  function reload(path) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = path + "?v2321=" + Date.now();
      s.async = false;
      s.onload = () => resolve();
      s.onerror = () => reject(Error("Cannot load " + path));
      document.head.appendChild(s);
    });
  }

  (async () => {
    fix.phase = "waiting for renderer";

    for (let n = 0; n < 60; n++) {
      const j = window.JXLOOK;
      if (j?.tabs?.m && j?.tabs?.f && j?.sheets) break;

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const j = window.JXLOOK;
    if (!j?.tabs?.m || !j?.tabs?.f || !j?.sheets) {
      throw Error("JXLOOK not ready");
    }

    window.VLI_PC_HORSE_CENTER_V154_READY = false;

    fix.phase = "loading atlas";

    await reload("js/vli-pc-horse-atlas-v15.js");

    if (Object.keys(
      window.VLI_PC_HORSE_SHEET_META || {}
    ).length !== 1008) {
      throw Error("Atlas not registered");
    }

    fix.phase = "correcting centers";

    await reload("js/vli-pc-horse-centers-v15-4.js");

    if (!window.VLI_PC_HORSE_CENTER_V154_READY) {
      throw Error("SPR centers not applied");
    }

    const recovery = window.VLI_PC_HORSE_RECOVERY_232;

    if (!recovery?.validate(46).ok) {
      throw Error(
        "K46 rows missing: " +
        JSON.stringify(recovery?.validate(46))
      );
    }

    if (recovery.status().exactMapperInstalled === false &&
        typeof jxHorseRow === "function") {
      const old = jxHorseRow;

      jxHorseRow = function(item) {
        const k = Number(item?.k);
        const row = 300 + k;

        if (Number(item?.d) === 10 &&
            Number.isInteger(k) &&
            k >= 34 && k <= 75 &&
            recovery.validate(k).ok) {
          return row;
        }

        return old(item);
      };
    }

    recovery.forceRefresh();

    fix.phase = "ready";
    console.info(
      "[Horse 23.2.1] PC sprites restored",
      fix.status()
    );

  })().catch(e => {
    fix.phase = "error";
    fix.error = String(e);
    console.error("[Horse 23.2.1]", e);
  });
})();