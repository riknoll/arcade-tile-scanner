# arcade-tile-scanner

The purpose of this extension is to automatically search for and find tiles in a tilemap that match a certain set of rules that you can customize. For example, you could use it to find all grass tiles in the map that are next to a wall tile, or how many tiles it is from a given location to the nearest wall, or

All the blocks in this extension have help pages that you can read inside the MakeCode editor. Just right-click on the block and select "Help" to find reference documentation!

## Scan methods

There are a number of different scan methods that are supported by this extension.

### Scan from location in direction

This block will start at the given location and move in the specified direction one tile at a time until it hits the edge of the map or the given rule stops being true.

This is super useful for things like motion-activated traps where you want to create a motion trigger for when the player passes in front of it.

For example, this project uses this block to create stalagtites that fall when the player goes underneath them

https://makecode.com/_YqjAyPLpH2LW

This project uses the block to create motion-activated arrow traps:

https://makecode.com/_39XKoUaFxDWu

### BFS from location

This block will perform a [breadth-first search](https://en.wikipedia.org/wiki/Breadth-first_search) from the given location and find all tiles that either have the same image as the start tile, or match a given rule. In other words, it will select all the tiles in a contiguous region that match the given rule.

This can be useful for selecting regions of your tilemap. For example, in this project BFS is used to select all tiles in a lava pool so that they can be cooled with an ice projectile:

https://makecode.com/_fMdXmoiHbbMA

### get all locations that match rule

This block will get all locations in a TileMap that match the specified rule.

In this project, we use this block to find all water blocks that border an ice block and use that to make our ice spread from tile to tile:

https://makecode.com/_LVhHi9Uzf0hw

### scan for lines that match rule

This block will look for either horizontal or vertical lines that match the given rule. Unlike the above scan rules, this block will return a double array of locations instead of a single array. Each inner array will represent a line that was matched and the line arrays are sorted from longest line to shortest.

This block is especially good for things like falling-block style puzzle games! See the clear matches function of this project for an example of how to use it:

https://makecode.com/_eYgUxDd5bgpk

### scan for groups that match rule

This block will find all contiguous groups of locations that match the given rule. You can think of this as performing a separate BFS (breadth-first searc) operation on every tile in the TileMap and returning all of the matched groups at once. Like the "scan for lines" block, this block returns a double array that is sorted from largest match to smallest match.

This is another useful block for falling-block style puzzle games! Use it to clear all matches of a certain number of tiles:

https://makecode.com/_hF66Yz365b4m

