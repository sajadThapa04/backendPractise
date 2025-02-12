class ApiResponse {
    constructor(statusCode, data, message = "success") {
        this.statusCode = statusCode
        this.message = message
        this.data = data
        this.success = this.statusCode < 400
    }
}


export { ApiResponse }