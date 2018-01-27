
export default function(req, res, next) {
    res.jsonWithResponseTime = function(obj) {
        const elapse = new Date() - req._startTime;
        if (obj) {
            obj.response_time_ms = elapse;
        }
        res.json(obj)
    };

    next()
}
