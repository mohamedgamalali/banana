

module.exports = (error, req, res, next) => {
    const status = error.statusCode || 500;
    const state = error.state;
    const message = error.message;
    res.status(status).json({ state: state, message: message });
}