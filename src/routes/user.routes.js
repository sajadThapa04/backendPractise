import { Router } from "express";
import { registerUser, loginUser, logOutUser,refreshAccessToken, changeUserCurrentPassword, getCurrentUser, updateCurrentUser, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";


const router = Router()

//registering users
router.route("/register").post(upload.fields(
    [
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser);

//login users
router.route("/login").post(loginUser)


//secured route
router.route("/logout").post(verifyJwt, logOutUser)
router.route("/refreshToken").post(refreshAccessToken)
router.route("/changePassword").post(verifyJwt,changeUserCurrentPassword);
router.route("/currentUser").post(verifyJwt,getCurrentUser);
router.route("/updateUser").post(verifyJwt,updateCurrentUser)
router.route("/updateAvatar").post(verifyJwt,upload.single("avatar"),updateUserAvatar)
router.route("/updateCoverImage").post(verifyJwt,upload.single("coverImage"),updateUserCoverImage);


export default router;