// Constants
const GRID_SIZE = 11;
const CELL_EFFECT_RADIUS = 4;
const MAX_SCALE = 4;

// State
let isInteracting = false;

// Cursor module
const Cursor = {
    setup() {
        $("<div>").addClass("cursor").appendTo("body");
        $(document).on("mousemove touchmove", this.updatePosition);
        $(document).on("mousedown touchstart", this.createRippleEffect.bind(this));
        $(document).on("mouseup touchend", () => this.scale(1));
        $(document).on("dragstart", (e) => e.preventDefault());
    },

    updatePosition(e) {
        const pos = Cursor.getEventPosition(e);
        $(".cursor, .ripple").css({
            left: `${pos.x}px`,
            top: `${pos.y}px`
        });
    },

    createRippleEffect(e) {
        this.scale(1.5);
        const pos = this.getEventPosition(e);
        const $ripple = $("<div>").addClass("ripple").appendTo("body");
        $ripple.css({
            left: `${pos.x}px`,
            top: `${pos.y}px`
        });

        gsap.to($ripple, {
            scale: 2.5,
            opacity: 0,
            duration: 0.75,
            onComplete: () => {
                $ripple.remove();
            }
        });
    },

    scale(scale) {
        gsap.to(".cursor", { scale, duration: 0.2 });
    },

    getEventPosition(e) {
        if ("touches" in e.originalEvent) {
            const touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
            return { x: touch.clientX, y: touch.clientY };
        } else {
            return {
                x: e.clientX,
                y: e.clientY
            };
        }
    }
};

// Grid module
const Grid = {
    create(size) {
        const $grid = $("#grid");
        const center = Math.floor(size / 2);

        $grid.css({
            "grid-template-columns": `repeat(${size}, 1fr)`,
            "grid-template-rows": `repeat(${size}, 1fr)`
        });

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const $cell = $("<div>")
                    .addClass("cell")
                    .data("pos", { x: j, y: i });
                if (i === center && j === center) {
                    $cell.addClass("center selected");
                } else if (i === center || j === center) {
                    $cell.css("opacity", "0.6");
                }
                $grid.append($cell);
            }
        }

        this.setupEvents();
    },

    setupEvents() {
        const $grid = $("#grid");
        $grid.on("mousedown touchstart", (event) => {
            isInteracting = true;
            this.handleInteractionEffect(event);
        }).on("mousemove touchmove", (event) => {
            if (isInteracting) {
                this.handleInteractionEffect(event);
            }
        });
        $(document).on("mouseup touchend", (event) => {
            if (isInteracting) {
                this.changeSelectedCell(event);
            }
            isInteracting = false;
            this.resetCells();
        }).on("mouseleave", () => {
            isInteracting = false;
            this.resetCells();
        });
    },

    handleInteractionEffect(e) {
        gsap.to(".selected", {
            opacity: 0.6,
            boxShadow: "0 0 5px 1px rgba(255, 255, 255, 0)",
            duration: 0.1
        });

        const gridRect = $("#grid")[0].getBoundingClientRect();
        const cellSize = gridRect.width / GRID_SIZE;
        const pos = Cursor.getEventPosition(e);
        const mouseX = pos.x - gridRect.left;
        const mouseY = pos.y - gridRect.top;

        $(".cell:not(.selected)").each((_, cell) => {
            const $cell = $(cell);
            const pos = $cell.data("pos");
            const cellCenterX = (pos.x + 0.5) * cellSize;
            const cellCenterY = (pos.y + 0.5) * cellSize;

            gsap.to($cell, { opacity: 0.2, duration: 0.2 });

            const distance = Math.sqrt(
                Math.pow(cellCenterX - mouseX, 2) +
                Math.pow(cellCenterY - mouseY, 2)
            );

            if (distance <= CELL_EFFECT_RADIUS * cellSize) {
                const scale =
                    1 + (MAX_SCALE - 1) * (1 - distance / (CELL_EFFECT_RADIUS * cellSize));
                gsap.to($cell, { scale, duration: 0.1 });
            } else {
                gsap.to($cell, { scale: 1, duration: 0.1 });
            }
        });
    },

    changeSelectedCell(event) {
        const gridRect = $("#grid")[0].getBoundingClientRect();
        const cellSize = gridRect.width / GRID_SIZE;
        const pos = Cursor.getEventPosition(event);
        const mouseX = pos.x - gridRect.left;
        const mouseY = pos.y - gridRect.top;

        let closestCell = null;
        let minDistance = Infinity;

        $(".cell").each((_, cell) => {
            const $cell = $(cell);
            const pos = $cell.data("pos");
            const cellCenterX = (pos.x + 0.5) * cellSize;
            const cellCenterY = (pos.y + 0.5) * cellSize;

            const distance = Math.sqrt(
                Math.pow(cellCenterX - mouseX, 2) +
                Math.pow(cellCenterY - mouseY, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestCell = $cell;
            }
        });

        if (closestCell) {
            $(".selected").removeClass("selected");
            $(closestCell).addClass("selected");
        }
    },

    resetCells() {
        gsap.to(".cell", { scale: 1, duration: 0.1 });

        gsap.to(".selected", {
            opacity: 0.8,
            boxShadow: "0 0 5px 1px rgb(255, 255, 255)",
            duration: 0.1
        });

        $(".cell:not(.selected)").each((_, cell) => {
            const $cell = $(cell);
            if (this.isAxis($cell)) {
                gsap.to($cell, { opacity: 0.6, duration: 0.2 });
            } else {
                gsap.to($cell, { opacity: 0.2, duration: 0.2 });
            }
        });
    },

    isAxis(cell) {
        const pos = cell.data("pos");
        const selectedPos = $(".selected").data("pos");
        return pos.x === selectedPos.x || pos.y === selectedPos.y;
    }
};

// Initialize
$(() => {
    Cursor.setup();
    Grid.create(GRID_SIZE);
});
