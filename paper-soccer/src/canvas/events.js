import { withinCircle } from "./utils";

const CLICK_EVENT = (nodeLocations, nodeRadius) => e => {
    const x = e.pageX - e.currentTarget.offsetLeft;
    const y = e.pageY - e.currentTarget.offsetTop;

    for (const node of nodeLocations) {
        if (withinCircle(x, y, node.absLocation.x, node.absLocation.y, nodeRadius)) {
            console.log("clicked node", node);
        }
    }
}

const HOVER_EVENT = (canvas, nodeLocations, nodeRadius) => e => {
    const x = e.pageX - e.currentTarget.offsetLeft;
    const y = e.pageY - e.currentTarget.offsetTop;

    let found = false;

    for (const node of nodeLocations) {
        if (withinCircle(x, y, node.absLocation.x, node.absLocation.y, nodeRadius)) {
            canvas.classList.add("cursor-pointer")
            found = true
            break
        }
    }

    if (!found) canvas.classList.remove("cursor-pointer")
}

let EVENTS = []

export function registerNodeEvents(canvas, nodeLocations, nodeRadius) {
    const clickEvent = CLICK_EVENT(nodeLocations, nodeRadius)
    const hoverEvent = HOVER_EVENT(canvas, nodeLocations, nodeRadius)

    canvas.addEventListener("click", clickEvent)
    canvas.addEventListener("mousemove", hoverEvent)

    EVENTS.push({ type: "click", value: clickEvent })
    EVENTS.push({ type: "mousemove", value: hoverEvent })
}

export function clearNodeEvents(canvas) {
    for(const event of EVENTS) {
        canvas.removeEventListener(event.type, event.value)
    }

    EVENTS = []
}