namespace tileScanner {
    export enum TileProperty {
        //% block="column"
        Column,
        //% block="row"
        Row,
        //% block="x"
        X,
        //% block="y"
        Y,
        //% block="left"
        Left,
        //% block="top"
        Top,
        //% block="right"
        Right,
        //% block="bottom"
        Bottom
    }

    export enum ComparisonOp {
        //% block="="
        Equals,
        //% block="≠"
        NotEquals,
        //% block=">"
        GreaterThan,
        //% block="<"
        LessThan,
        //% block="≥"
        GreaterThanEquals,
        //% block="≤"
        LessThanEquals
    }

    export class TileRule {
        constructor() { }

        acceptsLocation(col: number, row: number, map: tiles.TileMapData): boolean {
            // subclass
            return true;
        }
    }

    export class AndRule extends TileRule {
        constructor(protected args: TileRule[]) {
            super();
        }

        acceptsLocation(col: number, row: number, map: tiles.TileMapData): boolean {
            for (const rule of this.args) {
                if (!rule.acceptsLocation(col, row, map)) {
                    return false;
                }
            }

            return true;
        }
    }

    export class OrRule extends TileRule {
        constructor(protected args: TileRule[]) {
            super();
        }

        acceptsLocation(col: number, row: number, map: tiles.TileMapData): boolean {
            for (const rule of this.args) {
                if (rule.acceptsLocation(col, row, map)) {
                    return true;
                }
            }

            return false;
        }
    }

    export class NotRule extends TileRule {
        constructor(protected arg: TileRule) {
            super();
        }

        acceptsLocation(col: number, row: number, map: tiles.TileMapData): boolean {
            return !this.arg.acceptsLocation(col, row, map);
        }
    }

    export class TileIsRule extends TileRule {
        constructor(protected image: Image) {
            super();
        }

        acceptsLocation(col: number, row: number, map: tiles.TileMapData): boolean {
            const mapTile = map.getTileImage(map.getTile(col, row));

            return this.image === mapTile || this.image.equals(mapTile);
        }
    }

    export class WallRule extends TileRule {
        constructor() {
            super()
        }

        acceptsLocation(col: number, row: number, map: tiles.TileMapData): boolean {
            return map.isWall(col, row) || map.isOutsideMap(col, row);
        }
    }

    export class BordersRule extends TileRule {
        mode: BorderMode;

        constructor(protected arg: TileRule, mode?: BorderMode) {
            super();

            if (mode == undefined) {
                this.mode = BorderMode.Adjacent
            }
            else {
                this.mode = mode;
            }
        }

        acceptsLocation(col: number, row: number, map: tiles.TileMapData): boolean {
            let didPass = false;
            forEachAdjacentLocation(col, row, this.mode, map, (column, row) => {
                if (this.arg.acceptsLocation(column, row, map)) didPass = true;
            });

            return didPass;
        }
    }

    export class IsInMapRule extends TileRule {
        constructor() {
            super();
        }

        acceptsLocation(col: number, row: number, map: tiles.TileMapData): boolean {
            return !map.isOutsideMap(col, row);
        }
    }

    export class PropertyComparisonRule extends TileRule {
        constructor(
            protected op: ComparisonOp,
            protected prop: TileProperty,
            protected arg: number
        ) {
            super();
        }

        acceptsLocation(col: number, row: number, map: tiles.TileMapData): boolean {
            let value = col;

            if (this.prop === TileProperty.Row) {
                value = row;
            }
            else if (this.prop === TileProperty.X) {
                value = (col << map.scale) + ((1 << map.scale) / 2)
            }
            else if (this.prop === TileProperty.Y) {
                value = (row << map.scale) + ((1 << map.scale) / 2)
            }
            else if (this.prop === TileProperty.Left) {
                value = col << map.scale
            }
            else if (this.prop === TileProperty.Top) {
                value = row << map.scale
            }
            else if (this.prop === TileProperty.Right) {
                value = (col + 1) << map.scale
            }
            else if (this.prop === TileProperty.Bottom) {
                value = (row + 1) << map.scale
            }

            switch (this.op) {
                case ComparisonOp.Equals: return value === this.arg;
                case ComparisonOp.NotEquals: return value !== this.arg;
                case ComparisonOp.GreaterThan: return value > this.arg;
                case ComparisonOp.GreaterThanEquals: return value >= this.arg;
                case ComparisonOp.LessThan: return value < this.arg;
                case ComparisonOp.LessThanEquals: return value <= this.arg;
            }
        }
    }

    export function forEachAdjacentLocation(column: number, row: number, mode: BorderMode, map: tiles.TileMapData, cb: (column: number, row: number) => void) {
        if (mode === BorderMode.Adjacent || mode === BorderMode.AdjacentOrDiagonal) {
            if (column > 0) {
                cb(column - 1, row);
            }
            if (row > 0) {
                cb(column, row - 1);
            }
            if (column < map.width - 1) {
                cb(column + 1, row);
            }
            if (row < map.height - 1) {
                cb(column, row + 1)
            }
        }

        if (mode === BorderMode.Diagonal || mode === BorderMode.AdjacentOrDiagonal) {
            if (column > 0 && row > 0) {
                cb(column - 1, row - 1);
            }
            if (column < map.width - 1 && row > 0) {
                cb(column + 1, row - 1);
            }
            if (column > 0 && row < map.height - 1) {
                cb(column - 1, row + 1);
            }
            if (column < map.width - 1 && row < map.height - 1) {
                cb(column + 1, row + 1);
            }
        }
    }
}