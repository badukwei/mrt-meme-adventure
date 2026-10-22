# legs-wojak-poses-v1

Generated with built-in imagegen; transparent background.

Production 2D game sprite sheet, transparent background, EXACTLY three equal horizontal slots in one wide 1536x1024 canvas. Same fictional adult Taiwanese young man seated facing forward in all three slots, same size and centered baseline, same unmistakable Wojak face with heavy eyelids, eye bags, uneven hand-drawn black lines, small smug mouth, short black undercut, black t-shirt, thin gold chain, blue jeans, gray sneakers. Frame 1 legs spread wide taking two seats; frame 2 knees half-closed; frame 3 knees and shoes together. Hands rest on own thighs. Character is seated but NO chair, no background or props. Entire body and shoes visible in each slot, no cropping, generous padding between figures, identical head height and torso pose. Flat muted colors, minimal shading, crude classic internet Wojak meme, not glossy, not anime, not 3D. No text, no labels, no frame borders.

## Runtime frame normalization

The generated sheet is 1536×1024. Its three figures do not occupy equal-width slots, so runtime frames use crops x=0,width=620; x=620,width=404; x=1024,width=512. Frames 2 and 3 are centered with transparent padding to 620×1024. No per-frame rescaling; the common vertical baseline is preserved. The original sheet is retained.
