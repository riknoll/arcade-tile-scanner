# scan for lines

Scans a tilemap for contiguous lines of tiles that match a given rule. Results are returned sorted by line length, longest first. The result of this function is a double array of locations, each inner array representing a line of locations.

```sig
tileScanner.scanForLines(tileScanner.LineType.Horizontal, tileScanner.tileIs(img`.`))
```

## Parameters

* **lineType**: The type of lines to scan for (horizontal, vertical, or both)
* **rule**: The rule to match tiles against
* **minLength**: The minimum length of a line to be considered a match
* **maxLength**: The maximum length of a line to be considered a match
* **map**: The map to scan for lines in

```package
arcade-tile-scanner=github:riknoll/arcade-tile-scanner
```
