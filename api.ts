//% color="#4963ab"
//% icon="\uf002"
//% block="Tile Scanner"
namespace tileScanner {
    export enum BorderMode {
        //% block="adjacent"
        Adjacent,
        //% block="diagonal"
        Diagonal,
        //% block="adjacent or diagonal"
        AdjacentOrDiagonal
    }

    //% blockId=tileScanner_scanInDirection
    //% block="scan from $origin in direction $direction||max distance $distance while matches $rule in $map"
    //% inlineInputMode=inline
    //% origin.shadow=mapgettile
    //% rule.shadow=tileScanner_tileIs
    //% map.shadow=variables_get
    //% map.defl=myTilemap
    //% group=Scan
    //% weight=100
    export function scanInDirection(origin: tiles.Location, direction: CollisionDirection, maxTileDistance?: number, rule?: TileRule, map?: tiles.TileMapData): tiles.Location[] {
        if (!map) map = game.currentScene().tileMap.data;
        if (!map) return [];
        if (maxTileDistance == undefined || maxTileDistance <= 0) {
            maxTileDistance = 0xffffffff;
        }

        const result: tiles.Location[] = [];

        let current = origin.getNeighboringLocation(direction);
        let distance = 1;
        while (true) {
            if (distance > maxTileDistance) break;
            if (map.isOutsideMap(current.column, current.row)) {
                break;
            }

            if (rule && !rule.acceptsLocation(current.column, current.row, map)) {
                break;
            }

            result.push(current);
            current = current.getNeighboringLocation(direction);
            distance++;
        }

        return result;
    }

    class BFSNode {
        constructor(
            public column: number,
            public row: number,
            public distance: number
        ) { }
    }

    //% blockId=tileScanner_bfs
    //% block="BFS from $origin||max distance $distance while matches $rule in $map"
    //% inlineInputMode=inline
    //% origin.shadow=mapgettile
    //% rule.shadow=tileScanner_tileIs
    //% map.shadow=variables_get
    //% map.defl=myTilemap
    //% group=Scan
    //% weight=90
    export function bfs(origin: tiles.Location, maxTileDistance?: number, rule?: TileRule, map?: tiles.TileMapData): tiles.Location[] {
        if (!map) map = game.currentScene().tileMap.data;
        if (!map) return [];

        if (maxTileDistance == undefined || maxTileDistance <= 0) {
            maxTileDistance = 0xffffffff;
        }

        if (!rule) rule = new TileIsRule(map.getTileImage(map.getTile(origin.column, origin.row)));

        const queue: BFSNode[] = [];
        const visited = image.create(map.width, map.height);

        const pushLocation = (col: number, row: number, distance: number) => {
            if (visited.getPixel(col, row) || distance >= maxTileDistance || map.isOutsideMap(col, row)) return;
            visited.setPixel(col, row, 1);
            queue.push(new BFSNode(col, row, distance + 1));
        };

        pushLocation(origin.column, origin.row, -1);

        const result: tiles.Location[] = [];

        while (queue.length) {
            const current = queue.shift();

            if (rule.acceptsLocation(current.column, current.row, map)) {
                result.push(new tiles.Location(current.column, current.row, game.currentScene().tileMap));
                pushLocation(current.column + 1, current.row, current.distance);
                pushLocation(current.column - 1, current.row, current.distance);
                pushLocation(current.column, current.row + 1, current.distance);
                pushLocation(current.column, current.row - 1, current.distance);
            }
        }

        return result;
    }

    //% blockId=tileScanner_getAllMatchingLocations
    //% block="get all locations that match $rule||in $map"
    //% rule.shadow=tileScanner_tileIs
    //% map.shadow=variables_get
    //% map.defl=myTilemap
    //% group=Scan
    //% weight=80
    export function getAllMatchingLocations(rule: TileRule, map?: tiles.TileMapData): tiles.Location[] {
        if (!map) map = game.currentScene().tileMap.data;
        if (!map) return [];

        const result: tiles.Location[] = [];

        for (let x = 0; x < map.width; x++) {
            for (let y = 0; y < map.height; y++) {
                if (rule.acceptsLocation(x, y, map)) {
                    result.push(new tiles.Location(x, y, game.currentScene().tileMap))
                }
            }
        }

        return result;
    }

    //% blockId=tileScanner_getAdjacentLocations
    //% block="locations $mode to $origin||that match $rule in $map"
    //% inlineInputMode=inline
    //% origin.shadow=mapgettile
    //% rule.shadow=tileScanner_tileIs
    //% map.shadow=variables_get
    //% map.defl=myTilemap
    //% group=Scan
    //% weight=70
    export function getAdjacentLocations(origin: tiles.Location, mode: BorderMode, rule?: TileRule, map?: tiles.TileMapData): tiles.Location[] {
        if (!map) map = game.currentScene().tileMap.data;
        if (!map) return [];

        const result: tiles.Location[] = [];

        forEachAdjacentLocation(origin.column, origin.row, mode, map, (column, row) => {
            if (!rule || rule.acceptsLocation(column, row, map)) {
                result.push(new tiles.Location(column, row, game.currentScene().tileMap));
            }
        });

        return result;
    }

    //% blockId=tileScanner_matchesRule
    //% block="$location matches $rule||in $map"
    //% location.shadow=mapgettile
    //% rule.shadow=tileScanner_tileIs
    //% map.shadow=variables_get
    //% map.defl=myTilemap
    //% group=Scan
    //% weight=60
    export function matchesRule(location: tiles.Location, rule: TileRule, map?: tiles.TileMapData): boolean {
        if (!map) map = game.currentScene().tileMap.data;
        if (!map) return false;

        return rule.acceptsLocation(location.column, location.row, map);
    }

    //% blockId=tileScanner_tileIs
    //% block="tile is $tile"
    //% tile.shadow=tileset_tile_picker
    //% group=Rules
    //% weight=100
    //% blockGap=8
    export function tileIs(tile: Image): TileRule {
        return new TileIsRule(tile);
    }

    //% blockId=tileScanner_isWall
    //% block="location is wall"
    //% group=Rules
    //% weight=90
    //% blockGap=8
    export function isWall(): TileRule {
        return new WallRule();
    }

    //% blockId=tileScanner_isInsideMap
    //% block="location is inside map"
    //% group=Rules
    //% weight=80
    //% blockGap=8
    export function isInsideMap(): TileRule {
        return new IsInMapRule();
    }

    //% blockId=tileScanner_comparison
    //% block="location $property $op $value"
    //% group=Rules
    //% weight=70
    export function comparison(property: TileProperty, op: ComparisonOp, value: number) {
        return new PropertyComparisonRule(op, property, value);
    }

    //% blockId=tileScanner_borders
    //% block="location borders $rule||$mode"
    //% rule.shadow=tileScanner_tileIs
    //% group=Rules
    //% weight=50
    export function borders(rule: TileRule, mode?: BorderMode) {
        return new BordersRule(rule, mode);
    }

    //% blockId=tileScanner_not
    //% block="not $rule"
    //% rule.shadow=tileScanner_tileIs
    //% group=Rules
    //% weight=30
    //% blockGap=8
    export function not(rule: TileRule): TileRule {
        return new NotRule(rule);
    }

    //% blockId=tileScanner_and
    //% block="$arg1 and $arg2||and $arg3 and $arg4 and $arg5 and $arg6 and $arg7 and $arg8 and $arg9"
    //% inlineInputMode=inline
    //% group=Rules
    //% weight=20
    //% blockGap=8
    export function and(
        arg1: TileRule,
        arg2: TileRule,
        arg3?: TileRule,
        arg4?: TileRule,
        arg5?: TileRule,
        arg6?: TileRule,
        arg7?: TileRule,
        arg8?: TileRule,
        arg9?: TileRule
    ): TileRule {
        const args = [
            arg1,
            arg2,
            arg3,
            arg4,
            arg5,
            arg6,
            arg7,
            arg8,
            arg9,
        ].filter(a => !!a);

        return new AndRule(args);
    }

    //% blockId=tileScanner_or
    //% block="$arg1 or $arg2||or $arg3 or $arg4 or $arg5 or $arg6 or $arg7 or $arg8 or $arg9"
    //% inlineInputMode=inline
    //% group=Rules
    //% weight=10
    export function or(
        arg1: TileRule,
        arg2: TileRule,
        arg3?: TileRule,
        arg4?: TileRule,
        arg5?: TileRule,
        arg6?: TileRule,
        arg7?: TileRule,
        arg8?: TileRule,
        arg9?: TileRule
    ): TileRule {
        const args = [
            arg1,
            arg2,
            arg3,
            arg4,
            arg5,
            arg6,
            arg7,
            arg8,
            arg9,
        ].filter(a => !!a);

        return new OrRule(args);
    }

    //% blockId=tileScanner_createOutlineSprite
    //% block="create outline sprite for $locations||with color $color thickness $thickness"
    //% blockSetVariable=myOutlineSprite
    //% locations.shadow=variables_get
    //% locations.defl=myLocations
    //% thickness.defl=1
    //% color.defl=2
    //% color.shadow="colorindexpicker"
    //% group=Outline
    //% weight=100
    export function createOutlineSprite(locations: tiles.Location[], color?: number, thickness?: number): Sprite {
        const scale = game.currentScene().tileMap.scale;

        const result = new TileOutlineSprite(locations, scale);
        if (color) result.color = color;
        if (thickness >= 1) result.thickness = thickness | 0;

        return result;
    }

    //% blockId=tileScanner_updateTiles
    //% block="$outlineSprite update locations to $locations"
    //% outlineSprite.shadow=variables_get
    //% outlineSprite.defl=myOutlineSprite
    //% locations.shadow=variables_get
    //% locations.defl=myLocations
    //% group=Outline
    //% weight=90
    //% blockGap=8
    export function updateTiles(outlineSprite: Sprite, locations: tiles.Location[]) {
        assertOutlineSprite(outlineSprite);
        const scale = game.currentScene().tileMap.scale;

        (outlineSprite as TileOutlineSprite).updateTiles(locations, scale);
    }

    //% blockId=tileScanner_setOutlineColor
    //% block="$outlineSprite set outline color $color"
    //% outlineSprite.shadow=variables_get
    //% outlineSprite.defl=myOutlineSprite
    //% color.defl=2
    //% color.shadow="colorindexpicker"
    //% group=Outline
    //% weight=80
    //% blockGap=8
    export function setOutlineColor(outlineSprite: Sprite, color: number) {
        assertOutlineSprite(outlineSprite);

        (outlineSprite as TileOutlineSprite).color = color;
    }

    //% blockId=tileScanner_setOutlineThickness
    //% block="$outlineSprite set outline thickness $thickness"
    //% outlineSprite.shadow=variables_get
    //% outlineSprite.defl=myOutlineSprite
    //% thickness.defl=1
    //% group=Outline
    //% weight=70
    //% blockGap=8
    export function setOutlineThickness(outlineSprite: Sprite, thickness: number) {
        assertOutlineSprite(outlineSprite);

        (outlineSprite as TileOutlineSprite).thickness = thickness;
    }

    function assertOutlineSprite(sprite: Sprite) {
        if (!(sprite instanceof TileOutlineSprite)) {
            throw "Not a TileOutlineSprite"
        }
    }
}