# scan in direction

Scans from an origin locations in a given direction. If a rule is specified, the scan will stop once the rule evaluates to false. The origin location is always included first in the returned list of locations unless it doesn't match the given rule, in which case the list will be empty. The order of the returned locations is from the origin outwards, unless scanning in multiple directions in which case each direction is scanned fully before moving to the next direction.

```sig
tileScanner.scanInDirection(tiles.getTileLocation(0, 0), tileScanner.ScanDirection.Top)
```

## Parameters

* **origin**: The location to start scanning from
* **direction**: The direction to scan in
* **maxTileDistance**: The maximum number of locations to return. A value of <= 0 means no maximum
* **rule**: A rule to filter the locations by. If the rule evaluates to false, the scan will stop
* **map**: The map to scan for locations in

```package
arcade-tile-scanner=github:riknoll/arcade-tile-scanner
```
