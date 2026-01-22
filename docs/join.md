# join

Joins two arrays of locations using a specified operation. All operations other than "Concatenate" will deduplicate the resulting array.

```sig
tileScanner.join(tileScanner.JoinOp.Union, [], [])
```

## Parameters

* **operation**: The join operation to perform
* **a**: First array of locations
* **b**: Second array of locations

## Supported operations:

Let's say we are joining two arrays of locations, **A** and **B**. Here is what each of the join operations will do:

* **concatenate** will return an array where all the locations from **A** are followed by all the locations from **B**.
* **union (or)** will return an array that contains all the *unique* locations that are in either **A** or **B** (no duplicates).
* **intersection (and)** will return an array that contains all the *unique* locations that are in both **A** and **B**. The location must be present in both input arrays to be in the result!
* **symmetric difference (xor)** will return an array that contains all of the *unique* locations that are either in **A** and not in **B** or in **B** and not in **A**.  In other words, it's the opposite of the intersection!

```package
arcade-tile-scanner=github:riknoll/arcade-tile-scanner
```
