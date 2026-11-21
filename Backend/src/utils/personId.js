import ApiError from "./apierror.js"

const parsePersonId = (value) => {
    if (!/^\d+$/.test(String(value || ""))) {
        throw new ApiError(400, "Invalid person id")
    }

    const personId = Number(value)

    if (!Number.isSafeInteger(personId) || personId < 1) {
        throw new ApiError(400, "Invalid person id")
    }

    return personId
}

export default parsePersonId
