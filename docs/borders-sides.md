# borders sides

Returns a TileRule that checks if a location borders another location that matches a given TileRule only on specific sides (e.g. left or right).

```sig
tileScanner.bordersSides(tileScanner.tileIs(img`.`), tileScanner.sideGroups(CollisionDirection.Left))
```

## Parameters

* **rule**: The TileRule to check bordering locations for
* **sideGroups**: A group of numbers representing sides to check. Use sideGroups to generate this array.

```package
arcade-tile-scanner=github:riknoll/arcade-tile-scanner
```
