const asynchandler=(requesthandler) =>{
    return (req,res,next) =>{
        Promise.resolve(requesthandler(req,res,next))
        .catch((err) => next(err))
    }
}

export default asynchandler

// const asyncHandler = (requestHandler) => {
//     return async (req, res, next) => {
//         try {
//             await requestHandler(req, res, next)
//         } catch (error) {
//             next(error)
//         }
//     }
// }

// export default asyncHandler