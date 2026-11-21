import { useCallback, useEffect, useRef, useState } from "react"
import "../styles/ImageCropper.css"

const OUTPUT_SIZE = 512
const MIN_ZOOM = 1
const MAX_ZOOM = 3

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

function ImageCropper({
    src,
    fileName = "avatar",
    busy = false,
    error = "",
    onCancel,
    onConfirm
}) {
    const viewportRef = useRef(null)
    const dialogRef = useRef(null)
    const dragRef = useRef(null)

    const [viewportSize, setViewportSize] = useState(0)
    const [image, setImage] = useState(null)
    const [loadError, setLoadError] = useState("")
    const [localError, setLocalError] = useState("")
    const [processing, setProcessing] = useState(false)
    const [transform, setTransform] = useState({ zoom: MIN_ZOOM, x: 0, y: 0 })

    const disabled = busy || processing

    useEffect(() => {
        dialogRef.current?.focus()
    }, [])

    useEffect(() => {
        const previousOverflow = document.body.style.overflow

        document.body.style.overflow = "hidden"

        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [])

    useEffect(() => {
        const node = viewportRef.current

        if (!node) return undefined

        const updateSize = () => {
            const size = node.clientWidth

            if (size > 0) {
                setViewportSize(size)
            }
        }

        updateSize()

        if (typeof ResizeObserver === "undefined") return undefined

        const observer = new ResizeObserver(updateSize)

        observer.observe(node)

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!src) return undefined

        let cancelled = false
        const element = new Image()

        element.decoding = "async"

        element.onload = () => {
            if (cancelled) return

            if (!element.naturalWidth || !element.naturalHeight) {
                setLoadError("This photo could not be read. Try a different image.")
                return
            }

            setImage({
                element,
                width: element.naturalWidth,
                height: element.naturalHeight
            })
        }

        element.onerror = () => {
            if (cancelled) return

            setLoadError("This photo could not be loaded. Try a different image.")
        }

        element.src = src

        return () => {
            cancelled = true
            element.onload = null
            element.onerror = null
        }
    }, [src])

    const clampTransform = useCallback((nextX, nextY, zoom) => {
        if (!image || !viewportSize) {
            return { zoom, x: 0, y: 0 }
        }

        const baseScale = Math.max(
            viewportSize / image.width,
            viewportSize / image.height
        )
        const scale = baseScale * zoom
        const maxX = Math.max(0, (image.width * scale - viewportSize) / 2)
        const maxY = Math.max(0, (image.height * scale - viewportSize) / 2)

        return {
            zoom,
            x: clamp(nextX, -maxX, maxX),
            y: clamp(nextY, -maxY, maxY)
        }
    }, [image, viewportSize])

    const applyZoom = useCallback((nextZoom) => {
        setTransform((previous) => {
            const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)

            return clampTransform(previous.x, previous.y, zoom)
        })
    }, [clampTransform])

    useEffect(() => {
        const node = viewportRef.current

        if (!node) return undefined

        const handleWheel = (event) => {
            event.preventDefault()

            setTransform((previous) => {
                const zoom = clamp(
                    previous.zoom - event.deltaY * 0.0015,
                    MIN_ZOOM,
                    MAX_ZOOM
                )

                return clampTransform(previous.x, previous.y, zoom)
            })
        }

        node.addEventListener("wheel", handleWheel, { passive: false })

        return () => node.removeEventListener("wheel", handleWheel)
    }, [clampTransform])

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape" && !disabled) {
                onCancel()
            }
        }

        window.addEventListener("keydown", handleKeyDown)

        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [disabled, onCancel])

    const handlePointerDown = (event) => {
        if (disabled || !image || event.button !== 0) return

        dragRef.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY
        }

        event.currentTarget.setPointerCapture(event.pointerId)
    }

    const handlePointerMove = (event) => {
        const drag = dragRef.current

        if (!drag || drag.pointerId !== event.pointerId) return

        const deltaX = event.clientX - drag.x
        const deltaY = event.clientY - drag.y

        drag.x = event.clientX
        drag.y = event.clientY

        setTransform((previous) => (
            clampTransform(previous.x + deltaX, previous.y + deltaY, previous.zoom)
        ))
    }

    const endDrag = (event) => {
        if (dragRef.current?.pointerId !== event.pointerId) return

        dragRef.current = null

        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
    }

    const handleViewportKeyDown = (event) => {
        if (disabled || !image) return

        const panStep = event.shiftKey ? 40 : 10

        if (event.key === "ArrowLeft" || event.key === "ArrowRight"
            || event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault()

            setTransform((previous) => {
                const deltaX = event.key === "ArrowLeft"
                    ? -panStep
                    : event.key === "ArrowRight" ? panStep : 0
                const deltaY = event.key === "ArrowUp"
                    ? -panStep
                    : event.key === "ArrowDown" ? panStep : 0

                return clampTransform(
                    previous.x + deltaX,
                    previous.y + deltaY,
                    previous.zoom
                )
            })
            return
        }

        if (event.key === "+" || event.key === "=") {
            event.preventDefault()
            applyZoom(transform.zoom + 0.1)
        } else if (event.key === "-" || event.key === "_") {
            event.preventDefault()
            applyZoom(transform.zoom - 0.1)
        }
    }

    const handleBackdropMouseDown = (event) => {
        if (event.target === event.currentTarget && !disabled) {
            onCancel()
        }
    }

    const handleConfirm = async () => {
        if (!image || !viewportSize || disabled) return

        setLocalError("")
        setProcessing(true)

        try {
            const baseScale = Math.max(
                viewportSize / image.width,
                viewportSize / image.height
            )
            const scale = baseScale * transform.zoom
            const cropSize = viewportSize / scale
            const centerX = image.width / 2 - transform.x / scale
            const centerY = image.height / 2 - transform.y / scale

            const sourceX = clamp(
                centerX - cropSize / 2,
                0,
                Math.max(0, image.width - cropSize)
            )
            const sourceY = clamp(
                centerY - cropSize / 2,
                0,
                Math.max(0, image.height - cropSize)
            )

            const canvas = document.createElement("canvas")
            const context = canvas.getContext("2d")

            if (!context) {
                throw new Error("Your browser could not crop this image.")
            }

            canvas.width = OUTPUT_SIZE
            canvas.height = OUTPUT_SIZE
            context.imageSmoothingEnabled = true
            context.imageSmoothingQuality = "high"
            context.drawImage(
                image.element,
                sourceX,
                sourceY,
                cropSize,
                cropSize,
                0,
                0,
                OUTPUT_SIZE,
                OUTPUT_SIZE
            )

            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob((result) => {
                    if (result) {
                        resolve(result)
                    } else {
                        reject(new Error("Your browser could not crop this image."))
                    }
                }, "image/webp", 0.92)
            })

            const extension = blob.type === "image/png"
                ? "png"
                : blob.type === "image/jpeg" ? "jpg" : "webp"
            const baseName = (fileName || "avatar")
                .replace(/\.[^.]+$/, "")
                .trim() || "avatar"
            const croppedFile = new File(
                [blob],
                `${baseName}-cropped.${extension}`,
                {
                    type: blob.type || "image/webp",
                    lastModified: Date.now()
                }
            )

            await onConfirm(croppedFile)
        } catch (cropError) {
            setLocalError(
                cropError?.message || "Could not crop the photo. Please try again."
            )
        } finally {
            setProcessing(false)
        }
    }

    const baseScale = image && viewportSize
        ? Math.max(viewportSize / image.width, viewportSize / image.height)
        : 0
    const scale = baseScale * transform.zoom
    const displayedWidth = image ? image.width * scale : 0
    const displayedHeight = image ? image.height * scale : 0
    const message = loadError || localError || error
    const isWorking = busy || processing

    return (
        <div
            className="Cropper-Overlay"
            role="presentation"
            onMouseDown={handleBackdropMouseDown}
        >
            <div
                ref={dialogRef}
                className="Cropper-Dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cropper-title"
                aria-describedby="cropper-description"
                tabIndex={-1}
            >
                <div className="Cropper-Header">
                    <div>
                        <h2 id="cropper-title">Crop your profile picture</h2>
                        <p id="cropper-description">
                            Drag the photo to position it, then zoom to choose the
                            part you want to show.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="Cropper-Close"
                        onClick={onCancel}
                        disabled={isWorking}
                        aria-label="Close cropper"
                    >
                        ×
                    </button>
                </div>

                <div className="Cropper-Stage">
                    <div
                        ref={viewportRef}
                        className="Cropper-Viewport"
                        role="application"
                        aria-label="Photo crop area. Drag to reposition. Use arrow keys to move and plus or minus to zoom."
                        tabIndex={0}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onKeyDown={handleViewportKeyDown}
                    >
                        {image && (
                            <img
                                src={src}
                                alt=""
                                className="Cropper-Image"
                                draggable={false}
                                style={{
                                    width: `${displayedWidth}px`,
                                    height: `${displayedHeight}px`,
                                    transform: `translate(-50%, -50%) translate(${transform.x}px, ${transform.y}px)`
                                }}
                            />
                        )}

                        {!image && !loadError && (
                            <span className="Cropper-Loading">Loading photo...</span>
                        )}

                        {image && (
                            <div className="Cropper-Mask" aria-hidden="true">
                                <div className="Cropper-Circle" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="Cropper-Controls">
                    <button
                        type="button"
                        className="Cropper-Zoom-Button"
                        onClick={() => applyZoom(transform.zoom - 0.1)}
                        disabled={!image || isWorking || transform.zoom <= MIN_ZOOM}
                        aria-label="Zoom out"
                    >
                        −
                    </button>

                    <input
                        type="range"
                        className="Cropper-Zoom-Range"
                        min={MIN_ZOOM}
                        max={MAX_ZOOM}
                        step={0.01}
                        value={transform.zoom}
                        onChange={(event) => applyZoom(Number(event.target.value))}
                        disabled={!image || isWorking}
                        aria-label="Zoom"
                    />

                    <button
                        type="button"
                        className="Cropper-Zoom-Button"
                        onClick={() => applyZoom(transform.zoom + 0.1)}
                        disabled={!image || isWorking || transform.zoom >= MAX_ZOOM}
                        aria-label="Zoom in"
                    >
                        +
                    </button>

                    <button
                        type="button"
                        className="Cropper-Reset"
                        onClick={() => setTransform({ zoom: MIN_ZOOM, x: 0, y: 0 })}
                        disabled={!image || isWorking}
                    >
                        Reset
                    </button>
                </div>

                {message && (
                    <p className="Cropper-Error" role="alert">
                        {message}
                    </p>
                )}

                <div className="Cropper-Footer">
                    <button
                        type="button"
                        className="Cropper-Button Cropper-Button--ghost"
                        onClick={onCancel}
                        disabled={isWorking}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="Cropper-Button Cropper-Button--primary"
                        onClick={handleConfirm}
                        disabled={!image || isWorking || Boolean(loadError)}
                    >
                        {isWorking ? "Uploading..." : "Use photo"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ImageCropper
