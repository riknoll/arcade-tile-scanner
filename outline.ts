namespace tileScanner {
    const TOP = 0b0001;
    const RIGHT = 0b0010;
    const BOTTOM = 0b0100;
    const LEFT = 0b1000;

    export class TileOutlineSprite extends sprites.ExtendableSprite {
        outlineData: Image;
        minColumn: number;
        minRow: number;
        tileScale: number;

        color = 2;
        thickness = 1;

        constructor(tiles: tiles.Location[], scale: number) {
            super(img`.`)

            this.updateTiles(tiles, scale);
        }


        draw(left: number, top: number) {
            const tileWidth = 1 << this.tileScale;
            for (let x = 0; x < this.outlineData.width; x++) {
                for (let y = 0; y < this.outlineData.height; y++) {
                    const current = this.outlineData.getPixel(x, y);
                    if (!current) continue;

                    const oLeft = left + (x << this.tileScale);
                    const oTop = top + (y << this.tileScale)

                    if (current & TOP) {
                        screen.fillRect(
                            oLeft,
                            oTop - this.thickness,
                            tileWidth,
                            this.thickness,
                            this.color
                        )
                        if (current & RIGHT) {
                            screen.fillRect(
                                oLeft + tileWidth,
                                oTop - this.thickness,
                                this.thickness,
                                this.thickness,
                                this.color
                            )
                        }
                        if (current & LEFT) {
                            screen.fillRect(
                                oLeft - this.thickness,
                                oTop - this.thickness,
                                this.thickness,
                                this.thickness,
                                this.color
                            )
                        }
                    }
                    if (current & RIGHT) {
                        screen.fillRect(
                            oLeft + tileWidth,
                            oTop,
                            this.thickness,
                            tileWidth,
                            this.color
                        )
                    }
                    if (current & BOTTOM) {
                        screen.fillRect(
                            oLeft,
                            oTop + tileWidth,
                            tileWidth,
                            this.thickness,
                            this.color
                        )
                        if (current & RIGHT) {
                            screen.fillRect(
                                oLeft + tileWidth,
                                oTop + tileWidth,
                                this.thickness,
                                this.thickness,
                                this.color
                            )
                        }
                        if (current & LEFT) {
                            screen.fillRect(
                                oLeft - this.thickness,
                                oTop + tileWidth,
                                this.thickness,
                                this.thickness,
                                this.color
                            )
                        }
                    }
                    if (current & LEFT) {
                        screen.fillRect(
                            oLeft - this.thickness,
                            oTop,
                            this.thickness,
                            tileWidth,
                            this.color
                        )
                    }
                }
            }
        }

        updateTiles(tiles: tiles.Location[], scale: number) {
            this.tileScale = scale;

            let minX = 0xffffffff;
            let maxX = 0;
            let minY = 0xffffffff;
            let maxY = 0;

            for (const tile of tiles) {
                minX = Math.min(tile.column, minX);
                maxX = Math.max(tile.column, maxX);
                minY = Math.min(tile.row, minY);
                maxY = Math.max(tile.row, maxY);
            }

            const out = image.create(maxX - minX + 1, maxY - minY + 1);
            const visited = image.create(out.width, out.height);

            for (const tile of tiles) {
                visited.setPixel(tile.column - minX, tile.row - minY, 1);
            }

            for (let x = 0; x < out.width; x++) {
                for (let y = 0; y < out.height; y++) {
                    if (visited.getPixel(x, y)) {
                        let data = 0;

                        if (y === 0 || !visited.getPixel(x, y - 1)) {
                            data |= TOP;
                        }
                        if (x === out.width - 1 || !visited.getPixel(x + 1, y)) {
                            data |= RIGHT;
                        }
                        if (y === out.height - 1 || !visited.getPixel(x, y + 1)) {
                            data |= BOTTOM;
                        }
                        if (x === 0 || !visited.getPixel(x - 1, y)) {
                            data |= LEFT;
                        }

                        out.setPixel(x, y, data);
                    }
                }
            }

            this.outlineData = out;
            this.minColumn = minX;
            this.minRow = minY;

            this.setDimensions(
                this.outlineData.width << scale,
                this.outlineData.height << scale
            );

            this.left = this.minColumn << scale;
            this.top = this.minRow << scale;
        }
    }
}