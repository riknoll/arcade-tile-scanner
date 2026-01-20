# scan for groups

Scans a tilemap for groups of contiguous tiles that match a given rule. Results are returned sorted by group size, largest first. The result of this function is a double array of locations, each inner array representing a group of locations.

```sig
tileScanner.scanForGroups(tileScanner.tileIs(img`.`))
```

## Parameters

* **rule**: The rule to match tiles against
* **minSize**: The minimum size of a group to include in the results
* **maxSize**: The maximum size of a group to include in the results
* **map**: The tilemap to scan

```package
arcade-tile-scanner=github:riknoll/arcade-tile-scanner
```
