# bfs

Scans for locations using a breadth-first search from a start location. If no rule is specified, locations will be filtered by whatever the tile at the start location is.

```sig
tileScanner.bfs(tiles.getTileLocation(0, 0))
```

## Parameters

* **origin**: The location to start scanning from
* **maxTileDistance**: The maximum distance in tiles from the origin that will be scanned
* **rule**: A rule to match locations by while searching. If not specified, locations will be matched by whatever the tile image at the start location was
* **map**: The map to perform the search in

```package
arcade-tile-scanner=github:riknoll/arcade-tile-scanner
```
