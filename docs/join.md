# join

Joins two arrays of locations using a specified operation. All operations other than "Concatenate" will deduplicate the resulting array.

```sig
tileScanner.join(tileScanner.JoinOp.Union, [], [])
```

## Parameters

* **operation**: The join operation to perform
* **a**: First array of locations
* **b**: Second array of locations

```package
arcade-tile-scanner=github:riknoll/arcade-tile-scanner
```
