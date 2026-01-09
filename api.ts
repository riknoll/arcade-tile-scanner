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

    export enum ScanDirection {
        //% block="top"
        Top,
        //% block="right"
        Right,
        //% block="bottom"
        Bottom,
        //% block="left"
        Left,
        //% block="top and bottom"
        TopAndBottom,
        //% block="left and right"
        LeftAndRight,
        //% block="all directions"
        AllDirections
    }

    export enum LineType {
        //% block="horizontal"
        Horizontal,
        //% block="vertical"
        Vertical,
        //% block="both"
        Both
    }

    export enum JoinOp {
        //% block="concatenate"
        Concatenate,
        //% block="union (or)"
        Union,
        //% block="intersection (and)"
        Intersection,
        //% block="symmetric difference (xor)"
        SymmetricDifference
    }

    /**
     * Scans from an origin locations in a given direction. If a rule is specified, the scan will
     * stop once the rule evaluates to false. The origin location is always included first in the
     * returned list of locations unless it doesn't match the given rule, in which case the list
     * will be empty. The order of the returned locations is from the origin outwards, unless scanning
     * in multiple directions in which case each direction is scanned fully before moving to the next
     * direction.
     *
     * @param origin The location to start scanning from
     * @param direction The direction to scan in
     * @param maxTileDistance The maximum number of locations to return. A value of <= 0 means no maximum
     * @param rule A rule to filter the locations by. If the rule evaluates to false, the scan will stop
     * @param map The map to scan for locations in
     * @returns The list of locations that are matched according to the parameters
     */
    //% blockId=tileScanner_scanInDirection
    //% block="scan from $origin in direction $direction||max distance $maxTileDistance while matches $rule in $map"
    //% inlineInputMode=inline
    //% origin.shadow=mapgettile
    //% rule.shadow=tileScanner_tileIs
    //% map.shadow=variables_get
    //% map.defl=myTilemap
    //% group=Scan
    //% weight=100
    export function scanInDirection(origin: tiles.Location, direction: ScanDirection, maxTileDistance?: number, rule?: TileRule, map?: tiles.TileMapData): tiles.Location[] {
        if (!map) map = game.currentScene().tileMap.data;
        if (!map) return [];
        if (maxTileDistance == undefined || maxTileDistance <= 0) {
            maxTileDistance = 0xffffffff;
        }

        const directions: CollisionDirection[] = [];

        if (direction === ScanDirection.AllDirections) {
            directions.push(CollisionDirection.Top);
            directions.push(CollisionDirection.Right);
            directions.push(CollisionDirection.Bottom);
            directions.push(CollisionDirection.Left);
        }
        else if (direction === ScanDirection.TopAndBottom) {
            directions.push(CollisionDirection.Top);
            directions.push(CollisionDirection.Bottom);
        }
        else if (direction === ScanDirection.LeftAndRight) {
            directions.push(CollisionDirection.Left);
            directions.push(CollisionDirection.Right);
        }
        else if (direction === ScanDirection.Top) {
            directions.push(CollisionDirection.Top);
        }
        else if (direction === ScanDirection.Right) {
            directions.push(CollisionDirection.Right);
        }
        else if (direction === ScanDirection.Bottom) {
            directions.push(CollisionDirection.Bottom);
        }
        else if (direction === ScanDirection.Left) {
            directions.push(CollisionDirection.Left);
        }

        const result: tiles.Location[] = [];
        for (const dir of directions) {
            for (const loc of scanCore(origin, dir, maxTileDistance, rule, map)) {
                result.push(loc);
            }
        }
        result.unshift(origin);
        return result;
    }

    function scanCore(
        origin: tiles.Location,
        direction: CollisionDirection,
        maxTileDistance: number,
        rule: TileRule | undefined,
        map: tiles.TileMapData
    ): tiles.Location[] {
        const result: tiles.Location[] = [];
        if (rule && !rule.acceptsLocation(origin.column, origin.row, map)) {
            return result;
        }

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

    /**
     * Scans for locations using a breadth-first search from a start location. If no rule is
     * specified, locations will be filtered by whatever the tile at the start location is.
     *
     * @param origin The location to start scanning from
     * @param maxTileDistance The maximum distance in tiles from the origin that will be scanned
     * @param rule A rule to match locations by while searching.
     *      If not specified, locations will be matched by whatever the tile image at the start location was
     * @param map The map to perform the search in
     * @returns The list of locations scanned by the breadth-first search
     */
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

    /**
     * Returns all locations in a tilemap that match a given rule.
     *
     * @param rule The rule to filter locations with
     * @param map The map to scan for locations in
     * @returns A list of all locations that match the given rule
     */
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

    /**
     * Gets a list of all locations bordering a given location. These locations
     * can be optionally filtered by a rule. This function will never return
     * locations that are outside the given tilemap, even if the origin location
     * is on the edge of the map.
     *
     * @param origin The location to get the bordering locations of
     * @param mode The types of bordering locations to be returned
     * @param rule A rule to filter the border locations by
     * @param map The map to get the locations in
     * @returns A list of locations bordering the given origin location
     */
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

        forEachAdjacentLocation(origin.column, origin.row, mode, map, false, (column, row) => {
            if (!rule || rule.acceptsLocation(column, row, map)) {
                result.push(new tiles.Location(column, row, game.currentScene().tileMap));
            }
        });

        return result;
    }

    /**
     * Scans a tilemap for contiguous lines of tiles that match a given rule. Results
     * are returned sorted by line length, longest first. The result of this function
     * is a double array of locations, each inner array representing a line of locations.
     *
     * @param lineType The type of lines to scan for (horizontal, vertical, or both)
     * @param rule The rule to match tiles against
     * @param minLength The minimum length of a line to be considered a match
     * @param maxLength The maximum length of a line to be considered a match
     * @param map The map to scan for lines in
     * @returns A list of lines, each represented as a list of locations
     */
    //% blockId=tileScanner_scanForLines
    //% block="scan for $lineType lines that match $rule||with min length $minLength max length $maxLength in $map"
    //% inlineInputMode=inline
    //% rule.shadow=tileScanner_tileIs
    //% map.shadow=variables_get
    //% map.defl=myTilemap
    //% group=Scan
    //% weight=60
    export function scanForLines(lineType: LineType, rule: TileRule, minLength?: number, maxLength?: number, map?: tiles.TileMapData): tiles.Location[][] {
        if (!map) map = game.currentScene().tileMap.data;
        if (!map) return [];
        const result: tiles.Location[][] = [];

        if (minLength == undefined || minLength < 1) {
            minLength = 1;
        }
        if (maxLength == undefined || maxLength < minLength) {
            maxLength = Math.max(map.width, map.height);
        }

        if (lineType !== LineType.Vertical) {
            for (let y = 0; y < map.height; y++) {
                let matchStart = -1;
                for (let x = 0; x < map.width; x++) {
                    if (rule.acceptsLocation(x, y, map)) {
                        if (matchStart === -1) {
                            matchStart = x;
                        }
                    }
                    else {
                        if (matchStart !== -1) {
                            const matchLength = x - matchStart;

                            if (matchLength >= minLength && matchLength <= maxLength) {
                                const line: tiles.Location[] = [];
                                for (let lx = matchStart; lx < x; lx++) {
                                    line.push(new tiles.Location(lx, y, game.currentScene().tileMap));
                                }
                                result.push(line);
                            }
                            matchStart = -1;
                        }
                    }
                }

                if (matchStart !== -1) {
                    const matchLength = map.width - matchStart;
                    if (matchLength >= minLength && matchLength <= maxLength) {
                        const line: tiles.Location[] = [];
                        for (let lx = matchStart; lx < map.width; lx++) {
                            line.push(new tiles.Location(lx, y, game.currentScene().tileMap));
                        }
                        result.push(line);
                    }
                }
            }
        }
        if (lineType !== LineType.Horizontal) {
            for (let x = 0; x < map.width; x++) {
                let matchStart = -1;
                for (let y = 0; y < map.height; y++) {
                    if (rule.acceptsLocation(x, y, map)) {
                        if (matchStart === -1) {
                            matchStart = y;
                        }
                    }
                    else {
                        if (matchStart !== -1) {
                            const matchLength = y - matchStart;
                            if (matchLength >= minLength && matchLength <= maxLength) {
                                const line: tiles.Location[] = [];
                                for (let ly = matchStart; ly < y; ly++) {
                                    line.push(new tiles.Location(x, ly, game.currentScene().tileMap));
                                }
                                result.push(line);
                            }
                            matchStart = -1;
                        }
                    }
                }

                if (matchStart !== -1) {
                    const matchLength = map.height - matchStart;
                    if (matchLength >= minLength && matchLength <= maxLength) {
                        const line: tiles.Location[] = [];
                        for (let ly = matchStart; ly < map.height; ly++) {
                            line.push(new tiles.Location(x, ly, game.currentScene().tileMap));
                        }
                        result.push(line);
                    }
                }
            }
        }

        result.sort((a, b) => b.length - a.length);

        return result;
    }

    /**
     * Checks a location in a Tilemap to see if it is matched by a given rule
     *
     * @param location The location to check
     * @param rule The rule to check the location against
     * @param map The map that the location is in
     * @returns True if the location matches the rule, false otherwise
     */
    //% blockId=tileScanner_matchesRule
    //% block="$location matches $rule||in $map"
    //% location.shadow=mapgettile
    //% rule.shadow=tileScanner_tileIs
    //% map.shadow=variables_get
    //% map.defl=myTilemap
    //% group=Scan
    //% weight=50
    export function matchesRule(location: tiles.Location, rule: TileRule, map?: tiles.TileMapData): boolean {
        if (!map) map = game.currentScene().tileMap.data;
        if (!map) return false;

        return rule.acceptsLocation(location.column, location.row, map);
    }

    /**
     * Returns a TileRule that checks if the tile image at a location is a specific tile.
     *
     * @param tile The tile image to check for
     * @returns A TileRule
     */
    //% blockId=tileScanner_tileIs
    //% block="tile is $tile"
    //% tile.shadow=tileset_tile_picker
    //% group=Rules
    //% weight=100
    //% blockGap=8
    export function tileIs(tile: Image): TileRule {
        return new TileIsRule(tile);
    }

    /**
     * Returns a TileRule that checks if a location is a wall or not.
     *
     * @returns A TileRule
     */
    //% blockId=tileScanner_isWall
    //% block="location is wall"
    //% group=Rules
    //% weight=90
    //% blockGap=8
    export function isWall(): TileRule {
        return new WallRule();
    }

    /**
     * Returns a TileRule that checks if a location is inside the tilemap
     * or not. This rule is only useful for the "borders" and "borders sides"
     * rules, which will evaluate on locations outside the tilemap.
     *
     * @returns A TileRule
     */
    //% blockId=tileScanner_isInsideMap
    //% block="location is inside map"
    //% group=Rules
    //% weight=80
    //% blockGap=8
    export function isInsideMap(): TileRule {
        return new IsInMapRule();
    }

    /**
     * Returns a TileRule that checks a property of a location against a given value.
     *
     * @param property The location property to check
     * @param op The comparison operation to use on the location property
     * @param value The value to compare the location property against
     * @returns A TileRule
     */
    //% blockId=tileScanner_comparison
    //% block="location $property $op $value"
    //% group=Rules
    //% weight=70
    export function comparison(property: TileProperty, op: ComparisonOp, value: number): TileRule {
        return new PropertyComparisonRule(op, property, value);
    }

    /**
     * Returns a TileRule that checks if a location borders another location that matches
     * a given TileRule.
     *
     * @param rule The TileRule to check bordering locations for
     * @param mode The type of bordering locations to be checked
     * @returns A TileRule
     */
    //% blockId=tileScanner_borders
    //% block="location borders $rule||$mode"
    //% rule.shadow=tileScanner_tileIs
    //% group=Rules
    //% weight=50
    export function borders(rule: TileRule, mode?: BorderMode): TileRule {
        return new BordersRule(rule, mode);
    }

    /**
     * Returns a TileRule that checks if a location borders another location that matches
     * a given TileRule only on specific sides (e.g. left or right).
     *
     * @param rule The TileRule to check bordering locations for
     * @param sideGroups A group of numbers representing sides to check. Use sideGroups to generate this array.
     * @returns A TileRule
     */
    //% blockId=tileScanner_bordersSides
    //% block="location borders $rule only on $sideGroups"
    //% sideGroups.shadow=tileScanner_sideGroups
    //% rule.shadow=tileScanner_tileIs
    //% group=Rules
    //% weight=45
    export function bordersSides(rule: TileRule, sideGroups: number[]): TileRule {
        return new BordersSidesRule(rule, sideGroups);
    }

    /**
     * Generates a list of sideGroups from a logical expression of adjacent sides. Used
     * with bordersSides.
     *
     * @returns An array of numbers representing sides to check with the bordersSides TileRule
     */
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

    /**
     * Returns a TileRule that matches the inverse of locations matched by the given TileRule.
     *
     * @param rule The TileRule to invert
     * @returns A TileRule
     */
    //% blockId=tileScanner_not
    //% block="not $rule"
    //% rule.shadow=tileScanner_tileIs
    //% group=Rules
    //% weight=30
    //% blockGap=8
    export function not(rule: TileRule): TileRule {
        return new NotRule(rule);
    }

    /**
     * Returns a TileRule that matches locations that are matched by all of the argument TileRules.
     * @returns
     */
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

    /**
     * Returns a TileRule that matches any location that matches at least one of the argument TileRules
     */
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

    /**
     * Sets the tiles at multiple locations in a Tilemap
     *
     * @param locations The locations to set
     * @param tile The Image of the tile to set at the specified locations
     * @param map The map to set the locations in
     */
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
    export function setTileAtLocations(locations: tiles.Location[], tile: Image, map?: tiles.TileMapData): void {
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

    /**
     * Joins two arrays of locations using a specified operation. All operations other
     * than "Concatenate" will deduplicate the resulting array.
     *
     * @param operation The join operation to perform
     * @param a First array of locations
     * @param b Second array of locations
     * @returns The resulting array of locations after the join operation
     */
    //% blockId=tileScanner_joinLocations
    //% block="$operation $a and $b"
    //% a.shadow=variables_get
    //% a.defl=myLocationsA
    //% b.shadow=variables_get
    //% b.defl=myLocationsB
    //% group=Operations
    //% weight=30
    export function join(operation: JoinOp, a: tiles.Location[], b: tiles.Location[]): tiles.Location[] {
        switch (operation) {
            case JoinOp.Concatenate:
                return a.concat(b);
            case JoinOp.Union:
                return deduplicate(a.concat(b));
            case JoinOp.Intersection:
                return deduplicate(a.filter(loc => containsLocation(b, loc)));
            case JoinOp.SymmetricDifference:
                return deduplicate(a.filter(loc => !containsLocation(b, loc)).concat(b.filter(loc => !containsLocation(a, loc))));
        }
    }

    /**
     * Deduplicates an array of locations, removing any duplicate entries.
     * @param locations The array of locations to deduplicate
     * @returns A new array of locations with duplicates removed
     */
    //% blockId=tileScanner_deduplicateLocations
    //% block="deduplicate $locations"
    //% locations.shadow=variables_get
    //% locations.defl=myLocations
    //% group=Operations
    //% weight=20
    export function deduplicate(locations: tiles.Location[]): tiles.Location[] {
        const result: tiles.Location[] = [];
        for (const loc of locations) {
            if (indexOfLocation(result, loc) === -1) {
                result.push(loc);
            }
        }
        return result;
    }

    /**
     * Sorts an array of locations by their distance from a given origin location.
     * @param locations The array of locations to sort
     * @param origin The origin location to sort by distance from
     * @returns A new array of locations sorted by distance from the origin
     */
    //% blockId=tileScanner_sortByDistance
    //% block="$locations sorted by distance from $origin"
    //% locations.shadow=variables_get
    //% locations.defl=myLocations
    //% origin.shadow=mapgettile
    //% group=Operations
    //% weight=10
    //% blockGap=8
    export function sortByDistance(locations: tiles.Location[], origin: tiles.Location): tiles.Location[] {
        const sorted = locations.slice(0);
        sorted.sort((a, b) => {
            const distA = (a.column - origin.column) * (a.column - origin.column) + (a.row - origin.row) * (a.row - origin.row);
            const distB = (b.column - origin.column) * (b.column - origin.column) + (b.row - origin.row) * (b.row - origin.row);
            return distA - distB;
        });
        return sorted;
    }

    /**
     * Sorts an array of locations by their column and then row.
     * @param locations The array of locations to sort
     * @returns A new array of locations sorted by column then row
     */
    //% blockId=tileScanner_sortByColumnRow
    //% block="$locations sorted by column then row"
    //% locations.shadow=variables_get
    //% locations.defl=myLocations
    //% group=Operations
    //% weight=5
    export function sortByColumnRow(locations: tiles.Location[]): tiles.Location[] {
        const sorted = locations.slice(0);
        sorted.sort((a, b) => {
            if (a.column !== b.column) {
                return a.column - b.column;
            }
            return a.row - b.row;
        });
        return sorted;
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