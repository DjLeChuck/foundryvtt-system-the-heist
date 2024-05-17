export class Tools {
  toggleMapArea({ tiles, drawings }) {
    if (tiles?.length) {
      tiles.forEach((id) => {
        const t = game.scenes.current.tiles.get(id);
        if (t) {
          t.update({ hidden: !t.hidden });
        }
      });
    }

    if (drawings?.length) {
      drawings.forEach((id) => {
        const d = game.scenes.current.drawings.get(id);
        if (d) {
          d.update({ hidden: !d.hidden });
        }
      });
    }
  }
}
