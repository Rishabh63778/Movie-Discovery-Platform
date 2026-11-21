import asynchandler from "../utils/asynchandler.js"
import apiresponse from "../utils/apiresponse.js"
import ApiError from "../utils/apierror.js"
import parsePage from "../utils/page.js"
import { searchMulti } from "../services/tmdb.service.js"

const searchmulti = asynchandler(async (req, res) => {
    const query = typeof req.query.query === "string" ? req.query.query.trim() : ""

    if (!query) {
        throw new ApiError(400, "Search query is required")
    }

    const results = await searchMulti(query, parsePage(req.query.page))

    return res.status(200).json(
        new apiresponse(200, results, "Search results fetched successfully")
    )
})

export { searchmulti }
