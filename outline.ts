namespace tileScanner {
    export const _TOP = 0b0001;
    export const _RIGHT = 0b0010;
    export const _BOTTOM = 0b0100;
    export const _LEFT = 0b1000;

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

                    if (current & _TOP) {
                        screen.fillRect(
                            oLeft,
                            oTop - this.thickness,
                            tileWidth,
                            this.thickness,
                            this.color
                        )
                        if (current & _RIGHT) {
                            screen.fillRect(
                                oLeft + tileWidth,
                                oTop - this.thickness,
                                this.thickness,
                                this.thickness,
                                this.color
                            )
                        }
                        if (current & _LEFT) {
                            screen.fillRect(
                                oLeft - this.thickness,
                                oTop - this.thickness,
                                this.thickness,
                                this.thickness,
                                this.color
                            )
                        }
                    }
                    if (current & _RIGHT) {
                        screen.fillRect(
                            oLeft + tileWidth,
                            oTop,
                            this.thickness,
                            tileWidth,
                            this.color
                        )
                    }
                    if (current & _BOTTOM) {
                        screen.fillRect(
                            oLeft,
                            oTop + tileWidth,
                            tileWidth,
                            this.thickness,
                            this.color
                        )
                        if (current & _RIGHT) {
                            screen.fillRect(
                                oLeft + tileWidth,
                                oTop + tileWidth,
                                this.thickness,
                                this.thickness,
                                this.color
                            )
                        }
                        if (current & _LEFT) {
                            screen.fillRect(
                                oLeft - this.thickness,
                                oTop + tileWidth,
                                this.thickness,
                                this.thickness,
                                this.color
                            )
                        }
                    }
                    if (current & _LEFT) {
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

            const bounds = new LocationGroupBounds(tiles);

            const out = image.create(bounds.widthInTiles, bounds.heightInTiles);
            const visited = image.create(out.width, out.height);

            for (const tile of tiles) {
                visited.setPixel(tile.column - bounds.minColumn, tile.row - bounds.minRow, 1);
            }

            for (let x = 0; x < out.width; x++) {
                for (let y = 0; y < out.height; y++) {
                    if (visited.getPixel(x, y)) {
                        let data = 0;

                        if (y === 0 || !visited.getPixel(x, y - 1)) {
                            data |= _TOP;
                        }
                        if (x === out.width - 1 || !visited.getPixel(x + 1, y)) {
                            data |= _RIGHT;
                        }
                        if (y === out.height - 1 || !visited.getPixel(x, y + 1)) {
                            data |= _BOTTOM;
                        }
                        if (x === 0 || !visited.getPixel(x - 1, y)) {
                            data |= _LEFT;
                        }

                        out.setPixel(x, y, data);
                    }
                }
            }

            this.outlineData = out;
            this.minColumn = bounds.minColumn;
            this.minRow = bounds.minRow;

            this.setDimensions(
                this.outlineData.width << scale,
                this.outlineData.height << scale
            );

            this.left = this.minColumn << scale;
            this.top = this.minRow << scale;
        }
    }

    export class LocationGroupBounds {
        minColumn: number;
        minRow: number;
        maxColumn: number;
        maxRow: number;

        get widthInTiles() {
            return this.maxColumn - this.minColumn + 1;
        }

        get heightInTiles() {
            return this.maxRow - this.minRow + 1;
        }

        constructor(tiles: tiles.Location[]) {
            this.minColumn = 0xffffffff;
            this.maxColumn = 0;
            this.minRow = 0xffffffff;
            this.maxRow = 0;

            for (const tile of tiles) {
                this.minColumn = Math.min(tile.column, this.minColumn);
                this.maxColumn = Math.max(tile.column, this.maxColumn);
                this.minRow = Math.min(tile.row, this.minRow);
                this.maxRow = Math.max(tile.row, this.maxRow);
            }
        }
    }
}