/* Preview map stub. No tiles are requested from outside this host. */
(function () {
  function marker() {
    return {
      addTo(target) { if (target && target.addLayer) target.addLayer(this); return this; },
      bindTooltip() { return this; }
    };
  }
  const layer = () => ({
    addTo() { return this; },
    addLayer() {},
    clearLayers() {}
  });
  window.L = {
    map(el) {
      el.setAttribute("data-preview-map", "1");
      return { invalidateSize() {}, fitBounds() {}, setView() { return this; } };
    },
    tileLayer() { return { addTo() { return this; } }; },
    control: { scale() { return { addTo() {} }; } },
    layerGroup: layer,
    circleMarker: marker,
    marker
  };
})();
