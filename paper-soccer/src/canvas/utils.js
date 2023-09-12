export function clearColor(ctx, x, y, w, h, rgb) {
    const imageData = ctx.getImageData(x, y, w, h)
    const pixels = imageData.data
    const {r, g, b} = rgb

    for (let i = 0; i < imageData.data.length; i += 4) {
        if (pixels[i] === r && pixels[i + 1] === g && pixels[i + 2] === b) {
            pixels[i + 3] = 0
        }
    }

    ctx.putImageData(imageData, x, y)
}

export function hexToRgb(hex) {
    if(hex == "black") return { r: 0, g: 0, b: 0 }

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null
}

export function withinCircle(a, b, x, y, r) {
    return (a - x) * (a - x) + (b - y) * (b - y) < Math.pow(r, 2);
}

export function findNodeByGridLocation(nodes, strLocation) {
    const [x, y] = strLocation.split(",").map(strNum => parseInt(strNum))
    return nodes.find(node => node.gridLocation.x == x && node.gridLocation.y == y)
}

export function findNodeByPoint(nodes, point) {
    return nodes.find(node => node.point == point)
}