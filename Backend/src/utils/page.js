const MAX_PAGE = 500

const parsePage = (value) => {
    const page = Number.parseInt(value, 10)

    if (!Number.isFinite(page) || page < 1) return 1

    return Math.min(page, MAX_PAGE)
}

export default parsePage
