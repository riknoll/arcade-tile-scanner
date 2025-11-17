namespace tileScanner {
    export class OverlapTesterSprite extends sprites.ExtendableSprite {
        constructor(left: number, top: number, right: number, bottom: number, kind: number) {
            super(img`.`, kind);

            this.setDimensions(right - left, bottom - top);
            this.left = left;
            this.top = top;

            this.flags |= sprites.Flag.HitboxOverlaps;
            this.flags |= sprites.Flag.Invisible;
            this.flags |= sprites.Flag.GhostThroughWalls;
        }

        draw(left: number, top: number) {
            screen.drawRect(left, top, this.width, this.height, 2);
        }
    }
}