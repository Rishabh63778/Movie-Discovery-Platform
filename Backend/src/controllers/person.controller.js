import asynchandler from "../utils/asynchandler.js"
import apiresponse from "../utils/apiresponse.js"
import parsePersonId from "../utils/personId.js"
import {
    getPersonDetails,
    getPersonAwards
} from "../services/tmdb.service.js"

const getperson = asynchandler(async (req, res) => {
    const personId = parsePersonId(req.params.personId)
    const person = await getPersonDetails(personId)

    return res.status(200).json(
        new apiresponse(200, person, "Person found successfully")
    )
})

const getpersonawards = asynchandler(async (req, res) => {
    const personId = parsePersonId(req.params.personId)
    const awards = await getPersonAwards(personId)

    return res.status(200).json(
        new apiresponse(200, awards, "Awards fetched successfully")
    )
})

export {
    getperson,
    getpersonawards
}
