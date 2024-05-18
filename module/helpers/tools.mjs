export class Tools {
  toggleMapArea({ tiles, drawings }) {
    if (tiles?.length) {
      tiles.forEach((id) => {
        const t = canvas.scene.tiles.get(id);
        if (t) {
          t.update({ hidden: !t.hidden });
        }
      });
    }

    if (drawings?.length) {
      drawings.forEach((id) => {
        const d = canvas.scene.drawings.get(id);
        if (d) {
          d.update({ hidden: !d.hidden });
        }
      });
    }
  }
}
