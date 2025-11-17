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

    export enum LocationGroupMetric {
        //% block="min column"
        MinColumn,
        //% block="min row"
        MinRow,
        //% block="max column"
        MaxColumn,
        //% block="max row"
        MaxRow,
        //% block="left"
        Left,
        //% block="right"
        Right,
        //% block="top"
        Top,
        //% block="bottom"
        Bottom,
        //% block="width in pixels"
        PixelWidth,
        //% block="height in pixels"
        PixelHeight,
        //% block="width in tiles"
        TileWidth,
        //% block="height in tiles"
        TileHeight
    }

    export enum LogicOp {
        //% block="and"
        And,
        //% block="or"
        Or
    }

    //% blockId=tileScanner_scanInDirection
    //% block="scan from $origin in direction $direction||max distance $maxTileDistance while matches $rule in $map"
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
    //% block="BFS from $origin||max distance $maxTileDistance while matches $rule in $map"
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
    export function comparison(property: TileProperty, op: ComparisonOp, value: number): TileRule {
        return new PropertyComparisonRule(op, property, value);
    }

    //% blockId=tileScanner_borders
    //% block="location borders $rule||$mode"
    //% rule.shadow=tileScanner_tileIs
    //% group=Rules
    //% weight=50
    export function borders(rule: TileRule, mode?: BorderMode): TileRule {
        return new BordersRule(rule, mode);
    }

    //% blockId=tileScanner_bordersSides
    //% block="location borders $rule only on $sideGroups"
    //% sideGroups.shadow=tileScanner_sideGroups
    //% group=Rules
    //% weight=45
    export function bordersSides(rule: TileRule, sideGroups: number[]): TileRule {
        return new BordersSidesRule(rule, sideGroups);
    }

    //% blockId=tileScanner_sideGroups
    //% block="$side1||$op1 $side2 $op2 $side3 $op3 $side4 $op4 $side5 $op5 $side6 $op6 $side7 $op7 $side8 $op8 $side9 $op9 $side10 $op10 $side11 $op11 $side12"
    //% expandableArgumentBreaks="2,4,6,8,10,12,14,16,18,20,22,24"
    //% inlineInputMode=inline
    //% blockHidden=true
    export function sideGroups(
        side1: CollisionDirection,
        op1?: LogicOp,
        side2?: CollisionDirection,
        op2?: LogicOp,
        side3?: CollisionDirection,
        op3?: LogicOp,
        side4?: CollisionDirection,
        op4?: LogicOp,
        side5?: CollisionDirection,
        op5?: LogicOp,
        side6?: CollisionDirection,
        op6?: LogicOp,
        side7?: CollisionDirection,
        op7?: LogicOp,
        side8?: CollisionDirection,
        op8?: LogicOp,
        side9?: CollisionDirection,
        op9?: LogicOp,
        side10?: CollisionDirection,
        op10?: LogicOp,
        side11?: CollisionDirection,
        op11?: LogicOp,
        side12?: CollisionDirection,
    ): number[] {
        const rawSides = [
            side1,
            side2,
            side3,
            side4,
            side5,
            side6,
            side7,
            side8,
            side9,
            side10,
            side11,
            side12
        ];

        const rawOps = [
            op1,
            op2,
            op3,
            op4,
            op5,
            op6,
            op7,
            op8,
            op9,
            op10,
            op11,
        ];

        const sides: CollisionDirection[] = [];
        const ops: LogicOp[] = [];

        for (let i = 0; i < rawSides.length; i++) {
            const side = rawSides[i];
            if (side == undefined) {
                break;
            }
            sides.push(side);

            const op = rawOps[i];
            if (op != undefined) {
                ops.push(op);
            }
            else {
                ops.push(LogicOp.And);
            }
        }

        return _getSideGroups(sides, ops);
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

    //% blockId=tileScanner_setTileAtLocations
    //% block="set $tile at $locations||in $map"
    //% tile.shadow=tileset_tile_picker
    //% locations.shadow=variables_get
    //% locations.defl=myLocations
    //% map.shadow=variables_get
    //% map.defl=myTilemap
    //% group=Operations
    //% weight=100
    //% blockGap=8
    export function setTileAtLocations(locations: tiles.Location[], tile: Image, map?: tiles.TileMapData) {
        if (!map) map = game.currentScene().tileMap.data;
        if (!map) return;

        const tileset = map.getTileset();

        let tileIndex = tileset.indexOf(tile);

        if (tileIndex === -1) {
            for (let i = 0; i < tileset.length; i++) {
                if (tileset[i].equals(tile)) {
                    tileIndex = i;
                    break;
                }
            }

            if (tileIndex === -1) {
                tileset.push(tile);
                tileIndex = tileset.length - 1;
            }
        }

        for (const location of locations) {
            map.setTile(location.column, location.row, tileIndex)
        }
    }

    //% blockId=tileScanner_setWallAtLocations
    //% block="set wall $isWall at $locations||in $map"
    //% locations.shadow=variables_get
    //% locations.defl=myLocations
    //% map.shadow=variables_get
    //% map.defl=myTilemap
    //% group=Operations
    //% weight=90
    export function setWallAtLocations(locations: tiles.Location[], isWall: boolean, map?: tiles.TileMapData) {
        if (!map) map = game.currentScene().tileMap.data;
        if (!map) return;

        for (const location of locations) {
            map.setWall(location.column, location.row, isWall);
        }
    }

    //% blockId=tileScanner_filterLocations
    //% block="filter $locations by $rule||in $map"
    //% locations.shadow=variables_get
    //% locations.defl=myLocations
    //% rule.shadow=tileScanner_tileIs
    //% map.shadow=variables_get
    //% map.defl=myTilemap
    //% group=Operations
    //% weight=80
    export function filterLocations(locations: tiles.Location[], rule: TileRule, map?: tiles.TileMapData): tiles.Location[] {
        if (!map) map = game.currentScene().tileMap.data;
        if (!map) return locations;

        return locations.filter(l => rule.acceptsLocation(l.column, l.row, map));
    }

    //% blockId=tileScanner_overlapsSprite
    //% block="$sprite overlaps $locations||in $map"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% locations.shadow=variables_get
    //% locations.defl=myLocations
    //% map.shadow=variables_get
    //% map.defl=myTilemap
    //% group=Operations
    //% weight=70
    export function overlapsSprite(locations: tiles.Location[], sprite: Sprite, map?: tiles.TileMapData): boolean {
        if (!map) map = game.currentScene().tileMap.data;
        if (!map) return false;

        const scale = map.scale;

        for (const location of locations) {
            if (
                !(
                    (location.column << scale) > sprite.right ||
                    ((location.column + 1) << scale) < sprite.left ||
                    (location.row << scale) > sprite.bottom ||
                    ((location.row + 1) << scale) < sprite.top
                )
            ) {
                return true;
            }
        }

        return false;
    }

    //% blockId=tileScanner_indexOfLocation
    //% block="$locations index of $toFind"
    //% locations.shadow=variables_get
    //% locations.defl=myLocations
    //% toFind.shadow=mapgettile
    //% group=Operations
    //% weight=60
    //% blockGap=8
    export function indexOfLocation(locations: tiles.Location[], toFind: tiles.Location): number {
        for (let i = 0; i < locations.length; i++) {
            if (locations[i].column === toFind.column && locations[i].row === toFind.row) {
                return i;
            }
        }
        return -1;
    }

    //% blockId=tileScanner_containsLocation
    //% block="$locations contains $toFind"
    //% locations.shadow=variables_get
    //% locations.defl=myLocations
    //% toFind.shadow=mapgettile
    //% group=Operations
    //% weight=50
    export function containsLocation(locations: tiles.Location[], toFind: tiles.Location): boolean {
        return indexOfLocation(locations, toFind) !== -1;
    }

    //% blockId=tileScanner_calculateMetric
    //% block="$locations calculate $metric||in $map"
    //% locations.shadow=variables_get
    //% locations.defl=myLocations
    //% map.shadow=variables_get
    //% map.defl=myTilemap
    //% group=Operations
    //% weight=40
    export function calculateMetric(locations: tiles.Location[], metric: LocationGroupMetric, map?: tiles.TileMapData): number {
        if (!map) map = game.currentScene().tileMap.data;
        if (!map) return -1;

        const scale = map.scale;
        const bounds = new LocationGroupBounds(locations);

        switch (metric) {
            case LocationGroupMetric.MinColumn: return bounds.minColumn;
            case LocationGroupMetric.MinRow: return bounds.minRow;
            case LocationGroupMetric.MaxColumn: return bounds.maxColumn;
            case LocationGroupMetric.MaxRow: return bounds.maxRow;
            case LocationGroupMetric.Left: return bounds.minColumn << scale;
            case LocationGroupMetric.Right: return (bounds.maxColumn + 1) << scale;
            case LocationGroupMetric.Top: return bounds.minRow << scale;
            case LocationGroupMetric.Bottom: return (bounds.maxRow + 1) << scale;
            case LocationGroupMetric.PixelWidth: return bounds.widthInTiles << scale;
            case LocationGroupMetric.PixelHeight: return bounds.heightInTiles << scale;
            case LocationGroupMetric.TileWidth: return bounds.widthInTiles;
            case LocationGroupMetric.TileHeight: return bounds.heightInTiles;
        }
    }

    //% blockId=tileScanner_createOverlapTester
    //% block="create bbox sprite for $locations with kind $kind||in map $map"
    //% locations.shadow=variables_get
    //% locations.defl=myLocations
    //% kind.shadow=spritekind
    //% map.shadow=variables_get
    //% map.defl="myTilemap"
    //% group=Sprites
    //% weight=0
    export function createOverlapTester(locations: tiles.Location[], kind: number, map?: tiles.TileMapData): Sprite {
        let scale = 4;
        if (!map) map = game.currentScene().tileMap.data;
        if (map) scale = map.scale;

        const bounds = new LocationGroupBounds(locations);

        return new OverlapTesterSprite(
            bounds.minColumn << scale,
            bounds.minRow << scale,
            (bounds.maxColumn + 1) << scale,
            (bounds.maxRow + 1) << scale,
            kind
        );
    }

    //% blockId=tileScanner_createOutlineSprite
    //% block="create outline sprite for $locations||with color $color thickness $thickness"
    //% blockSetVariable=myOutlineSprite
    //% locations.shadow=variables_get
    //% locations.defl=myLocations
    //% thickness.defl=1
    //% color.defl=2
    //% color.shadow="colorindexpicker"
    //% group=Sprites
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
    //% group=Sprites
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
    //% group=Sprites
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
    //% group=Sprites
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