import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp') //this is where the file will be saved
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname) // this is how the file will be saved in its original name
    }
})

export const upload = multer({ storage })

