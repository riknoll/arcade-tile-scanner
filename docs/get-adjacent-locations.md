# get adjacent locations

Gets a list of all locations bordering a given location. These locations can be optionally filtered by a rule. This function will never return locations that are outside the given tilemap, even if the origin location is on the edge of the map.

```sig
tileScanner.getAdjacentLocations(tiles.getTileLocation(0, 0), tileScanner.BorderMode.Adjacent)
```

## Parameters

* **origin**: The location to get the bordering locations of
* **mode**: The types of bordering locations to be returned
* **rule**: A rule to filter the border locations by
* **map**: The map to get the locations in

```package
arcade-tile-scanner=github:riknoll/arcade-tile-scanner
```
