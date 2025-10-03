const prisma = require("../../config/prismaConfig");
const { otpConstants, userConstants } = require("../../constants/constants");
const {
  ConflictError,
  NotFoundError,
  ValidationError,
  BadRequestError,
} = require("../../resHandler/CustomError");
const { generateOtp } = require("../../utils/generateOtp");
const sendEmails = require("../../utils/sendEmail");
const { handlerOk } = require("../../resHandler/responseHandler");
const generateOtpExpiry = require("../../utils/verifyOtp");
const emailTemplates = require("../../utils/emailTemplate");
const { genToken } = require("../../utils/generateToken");
const { hashPassword, comparePassword } = require("../../utils/passwordHashed");

const { v4: uuidv4 } = require('uuid');
const path = require("path");
const uploadFileWithFolder = require("../../utils/s3Upload");

const userRegister = async (req, res, next) => {
  try {
    const { userEmail } = req.body;

    const finduser = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
    });

    if (finduser) {
      throw new ConflictError("User already exist");
    }

    console.log(finduser, "finduser");

    const otp = generateOtp();
    const expiretime = generateOtpExpiry(2);
    console.log(expiretime);

    console.log(otp, "otp");
    console.log(expiretime, "expiretime");

    const saveotp = await prisma.otp.create({
      data: {
        email: userEmail,
        otp: otp,
        otpReason: otpConstants.REGISTER,
        otpUsed: false,
        expiresAt: expiretime,
      },
    });

    const emailData = {
      subject: "Wayger Walk - Account Verification",
      html: emailTemplates.register(otp),
    };

    await sendEmails(userEmail, emailData.subject, emailData.html);

    handlerOk(res, 201, otp, "OTP sent successfully");
  } catch (error) {
    next(error);
  }
};

const userLogin = async (req, res, next) => {
  try {
    const { userEmail } = req.body;

    const finduser = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
    });

    if (!finduser) {
      throw new NotFoundError("User not found.");
    }

    const otp = generateOtp();
    const expiretime = generateOtpExpiry(2);
    console.log(expiretime);

    console.log(otp, "otp");
    console.log(expiretime, "expiretime");

    const saveotp = await prisma.otp.create({
      data: {
        email: userEmail,
        otp: otp,
        otpReason: otpConstants.LOGIN,
        otpUsed: false,
        expiresAt: expiretime,
      },
    });

    const emailData = {
      subject: "Wayger Walk - Account Login Verification",
      html: emailTemplates.register(otp),
    };

    await sendEmails(userEmail, emailData.subject, emailData.html);

    handlerOk(res, 200, otp, "OTP sent successfully");
  } catch (error) {
    next(error);
  }
};

const userVerifyOtp = async (req, res, next) => {
  try {
    const {
      userEmail,
      // userName,
      otp,
      userPassword,
      userDeviceToken,
      userDeviceType,
    } = req.body;

    // ✅ Find OTP
    const findotp = await prisma.otp.findFirst({
      where: {
        otp: otp,
      },
    });

    if (!findotp) {
      throw new NotFoundError("OTP not found");
    }

    // ✅ Check if OTP is expired
    const now = new Date();
    if (findotp.expiresAt < now) {
      throw new ConflictError("OTP has expired");
    }

    if (findotp.otpReason === "REGISTER") {
      // const hashedPassword = await hashPassword(userPassword);

      if (findotp.otpUsed) {
        throw new ConflictError("OTP already used");
      }

      // ✅ Create the user
      const saveuser = await prisma.user.create({
        data: {
          email: userEmail,
          // password: hashedPassword,
          // userName: userName,
          deviceToken: userDeviceToken,
          deviceType: userDeviceType,
          userType: userConstants.USER,
        },
      });

      // ✅ Mark OTP as used
      await prisma.otp.update({
        where: {
          id: findotp.id,
        },
        data: {
          otpUsed: true,
        },
      });

      await prisma.coins.create({
        data: {
          userId: saveuser.id
        }
      })

      // Generate token
      const token = genToken({
        id: saveuser.id,
        userType: userConstants.USER,
      });

      return handlerOk(
        res,
        201,
        { ...saveuser, userToken: token },
        "User registered successfully"
      );
    }

    if (findotp.otpReason === "FORGETPASSWORD") {
      const finduser = await prisma.user.findUnique({
        where: {
          email: userEmail,
        },
      });

      if (!finduser) {
        throw new NotFoundError("Email not found");
      }

      if (findotp.otpUsed) {
        throw new ConflictError("OTP already used");
      }

      // ✅ Mark OTP as used
      await prisma.otp.update({
        where: {
          id: findotp.id,
        },
        data: {
          otpUsed: true,
          // userId: finduser.id,
        },
      });

      // ✅ Generate token
      const token = genToken({
        id: finduser.id,
        userType: userConstants.USER,
      });

      return handlerOk(res, 201, { userToken: token }, "Now set your password");
    }

    if (findotp.otpReason === "LOGIN") {
      const finduser = await prisma.user.findUnique({
        where: {
          email: userEmail,
        },
      });

      if (!finduser) {
        throw new NotFoundError("Email not found");
      }

      if (findotp.otpUsed) {
        throw new ConflictError("OTP already used");
      }

      // ✅ Mark OTP as used
      await prisma.otp.update({
        where: {
          id: findotp.id,
        },
        data: {
          otpUsed: true,
        },
      });

      // ✅ Generate token
      const token = genToken({
        id: finduser.id,
        userType: userConstants.USER,
      });

      return handlerOk(
        res,
        201,
        { userToken: token, isCreatedProfile: finduser.isCreatedProfile },
        "User login Successfully"
      );
    }
  } catch (error) {
    next(error);
  }
};

const userForgetPassword = async (req, res, next) => {
  try {
    const { userEmail } = req.body;

    const finduser = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
    });

    if (!finduser) {
      throw new NotFoundError("Email not found.");
    }

    const otp = generateOtp();
    const expiretime = generateOtpExpiry(2);

    const saveotp = await prisma.otp.create({
      data: {
        email: userEmail,
        otp: otp,
        otpReason: otpConstants.FORGETPASSWORD,
        otpUsed: false,
        expiresAt: expiretime,
      },
    });

    const emailData = {
      subject: "Wayger Walk - Reset Your Password",
      html: emailTemplates.forgetPassword(otp),
    };

    await sendEmails(userEmail, emailData.subject, emailData.html);

    handlerOk(res, 200, otp, "OTP sent successfully");
  } catch (error) {
    next(error);
  }
};

const userResetPassword = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { userPassword } = req.body;

    const hashedPassword = await hashPassword(userPassword);

    const updatePassword = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        password: hashedPassword,
      },
    });

    if (!updatePassword) {
      throw new ValidationError("Password not update");
    }

    handlerOk(res, 200, null, "Password updated successfully");
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { userEmail } = req.body;

    // Find existing OTP record by email (not user)
    const existingOtp = await prisma.otp.findFirst({
      where: {
        email: userEmail,
        otpUsed: false,
      },
    });

    if (!existingOtp) {
      throw new NotFoundError("OTP record not found.");
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await prisma.otp.update({
      where: { id: existingOtp.id },
      data: {
        otp,
        otpUsed: false,
        expiresAt,
      },
    });

    const emailData = {
      subject: "Wayger Walk - Account Verification",
      html: emailTemplates.resendOTP(otp),
    };

    await sendEmails(userEmail, emailData.subject, emailData.html);

    handlerOk(res, 201, otp, "OTP sent successfully. Please verify your OTP.");
  } catch (error) {
    next(error);
  }
};

const createProfile = async (req, res, next) => {
  try {
    const { email, id } = req.user;
    const file = req.file;
    const {
      userPhoneNumber,
      userAddress,
      userHeight,
      userWeight,
      userStates,
      userCountry,
      userCity,
      userGender,
      userName
    } = req.body;

    let s3ImageUrl = null;

    if (file) {
      const fileBuffer = file.buffer;
      const folder = 'uploads';
      const filename = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      const contentType = file.mimetype || 'application/octet-stream';

      s3ImageUrl = await uploadFileWithFolder(fileBuffer, filename, contentType, folder);
    }

    const existprofile = await prisma.user.findFirst({
      where: {
        id,
        isCreatedProfile: true,
      },
    });

    if (existprofile) {
      throw new ConflictError("User profile already exists.");
    }

    const findnumber = await prisma.user.findFirst({
      where: {
        phoneNumber: userPhoneNumber,
      }
    });

    if (findnumber) {
      throw new ConflictError("Phone number already exists.");
    }

    // Build data object dynamically, only include image if uploaded
    const updateData = {
      phoneNumber: userPhoneNumber,
      states: userStates,
      country: userCountry,
      address: userAddress,
      height: userHeight,
      weight: userWeight,
      isCreatedProfile: true,
      city: userCity,
      gender: userGender,
      userName: userName
    };

    if (s3ImageUrl) {
      updateData.image = s3ImageUrl;
    }

    const saveuser = await prisma.user.update({
      where: { email },
      data: updateData,
    });

    // Mark OTP as used
    const otpRecord = await prisma.otp.findFirst({ where: { email } });
    if (!otpRecord) throw new NotFoundError("OTP not found");

    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { otpUsed: true },
    });

    // Create wallet
    await prisma.wallet.create({
      data: { userId: saveuser.id, balance: 0.0 },
    });

    // Generate token
    const token = genToken({ id: saveuser.id, userType: userConstants.USER });

    return handlerOk(res, 201, { ...saveuser, userToken: token }, "Profile created successfully");
  } catch (error) {
    next(error);
  }
};


const userEditProfile = async (req, res, next) => {
  try {
    const {
      userName,
      userGender,
      userCity,
      userCountry,
      userStates,
      userAddress,
      userHeight,
      userWeight

    } = req.body;

    const { id } = req.user;
    const file = req.file;

    console.log(file, "file");

    const currentPrifile = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!currentPrifile) {
      throw new NotFoundError("User not found");
    }

    const updateObj = {};

    if (userName) {
      updateObj.userName = userName;
    }

    if (userCity) {
      updateObj.city = userCity;
    }

    if (userCountry) {
      updateObj.country = userCountry;
    }

    if (userStates) {
      updateObj.states = userStates;
    }

    if (userGender) {
      updateObj.gender = userGender;
    }

    if (userAddress) {
      updateObj.address = userAddress
    }
    if (userHeight) {
      updateObj.height = userHeight
    }

    if (userWeight) {
      updateObj.weight = userWeight
    }

    if (file) {
      // const filePath = file.filename; // use filename instead of path
      // const basePath = `http://${req.get("host")}/public/uploads/`;
      // const image = `${basePath}${filePath}`;
      // updateObj.image = image;

      const fileBuffer = file.buffer;
      const folder = 'uploads';
      const filename = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      const contentType = file.mimetype || 'application/octet-stream';

      const s3ImageUrl = await uploadFileWithFolder(fileBuffer, filename, contentType, folder);
      updateObj.image = s3ImageUrl;
    }

    const updateuser = await prisma.user.update({
      where: {
        id: id,
      },
      data: updateObj,
    });

    if (!updateuser) {
      throw new ValidationError("User not update");
    }

    handlerOk(res, 200, updateuser, "User updated successfully");
  } catch (error) {
    next(error);
  }
};

const userLogOut = async (req, res, next) => {
  try {
    const { id } = req.user;


    const logout = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        deviceToken: null,
      },
    });

    if (!logout) {
      throw new ValidationError("User not logout");
    }

    handlerOk(res, 200, null, "User logout successfully");
  } catch (error) {
    next(error);
  }
};

const userDeleteAccount = async (req, res, next) => {
  try {
    const { id: userId } = req.user;

    await prisma.$transaction(async (tx) => {
      // A) Detach from many-to-many relations (joined/invited)
      const gamesWithUser = await tx.game.findMany({
        where: {
          OR: [
            { totalPlayers: { some: { id: userId } } },
            { invitedFriends: { some: { id: userId } } }
          ]
        },
        select: { id: true }
      });

      for (const g of gamesWithUser) {
        await tx.game.update({
          where: { id: g.id },
          data: {
            totalPlayers: { disconnect: { id: userId } },
            invitedFriends: { disconnect: { id: userId } },
          }
        });
      }

      // B) If this user is a winner anywhere, null it
      await tx.game.updateMany({
        where: { winnerId: userId },
        data: { winnerId: null }
      });

      // C) Delete dependents of games CREATED by this user, then delete those games
      const createdGameIds = (
        await tx.game.findMany({ where: { createdById: userId }, select: { id: true } })
      ).map(g => g.id);

      if (createdGameIds.length) {
        await tx.notification.updateMany({
          where: { gameId: { in: createdGameIds } },
          data: { gameId: null }
        });

        await tx.adminWalletTransaction.deleteMany({
          where: { gameId: { in: createdGameIds } }
        });

        await tx.gamePlayerStatus.deleteMany({
          where: { gameId: { in: createdGameIds } }
        });

        await tx.game.deleteMany({
          where: { id: { in: createdGameIds } }
        });
      }

      // D) Delete GamePlayerStatus rows for THIS user in other people’s games
      await tx.gamePlayerStatus.deleteMany({ where: { userId } });

      // E) Delete user-owned records
      await tx.notification.deleteMany({ where: { userId } });
      await tx.feedBack.deleteMany({ where: { createdById: userId } });
      await tx.coins.deleteMany({ where: { userId } });
      await tx.coinPurchase.deleteMany({ where: { userId } });
      await tx.userStep.deleteMany({ where: { userId } });

      // F) Wallet: delete its transactions first, then the wallet
      const wallet = await tx.wallet.findUnique({
        where: { userId },
        select: { id: true }
      });

      if (wallet) {
        await tx.walletTransaction.deleteMany({ where: { walletId: wallet.id } });
        await tx.wallet.deleteMany({ where: { userId } });
      } else {
        await tx.wallet.deleteMany({ where: { userId } });
      }

      // G) Finally delete the user
      await tx.user.delete({ where: { id: userId } });
    });

    handlerOk(res, 200, null, "User account deleted successfully");
  } catch (error) {
    next(error);
  }
};



const getMe = async (req, res, next) => {
  try {
    const { id } = req.user;

    const finduser = await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        // Wallet: true,
        Coins: true,
        UserStep: true
      },
    });

    const obj = {
      id: finduser.id,
      email: finduser.email,
      password: finduser.password,
      phoneNumber: finduser.phoneNumber,
      userName: finduser.userName,
      height: finduser.height,
      weight: finduser.weight,
      address: finduser.address,
      country: finduser.country,
      states: finduser.states,
      city: finduser.city,
      gender: finduser.gender,
      deviceType: finduser.deviceToken,
      deviceType: finduser.deviceType,
      isCreatedProfile: finduser.isCreatedProfile,
      image: finduser.image,
      userType: finduser.userType,
      notificationOnAndOff: finduser.notificationOnAndOff,
      createdAt: finduser.createdAt,
      updatedAt: finduser.updatedAt,
      coins: finduser.Coins[0]?.coins || 0,
      steps: finduser.UserStep[0]?.steps || 0
    }



    const token = genToken({
      id: finduser.id,
      userType: userConstants.USER,
    });

    const response = {
      userToken: token,
    };

    handlerOk(
      res,
      200,
      { ...obj, ...response },
      "User found successfully"
    );
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { id, password } = req.user;
    const { currentpassword, newpassword } = req.body;

    const comparePass = await comparePassword(currentpassword, password);

    if (!comparePass) {
      throw new BadRequestError("Password not correct");
    }

    const hashedPassword = await hashPassword(newpassword, 10);

    const updatepass = await prisma.user.update({
      where: {
        id: id
      },
      data: {
        password: hashedPassword
      }
    });

    if (!updatepass) {
      throw new ValidationError("Password not change");
    }

    handlerOk(res, 200, updatepass, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

const socialLogin = async (req, res, next) => {
  try {
    const { accessToken, socialType, deviceType, deviceToken } = req.body;


    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(accessToken);

    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      throw new BadRequestError("Email is required");
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, register them
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          firstName: name?.split(" ")[0] || null,
          lastName: name?.split(" ")[1] || null,
          accessToken: uid,
          socialType: socialType,
          image: picture || null,
          deviceType,
          deviceToken,
        },
      });
    } else {
      // Optional: Update device info on login
      await prisma.user.update({
        where: { email },
        data: {
          deviceType,
          deviceToken,
        },
      });
    }

    // Generate your own app token (e.g., JWT)

    const token = genToken({
      id: user.id,
      userType: userConstants.USER
    });

    handlerOk(res, 200, { user, token }, "Login successful");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  userRegister,
  userLogin,
  userForgetPassword,
  userVerifyOtp,
  userResetPassword,
  userEditProfile,
  userLogOut,
  userDeleteAccount,
  resendOtp,
  createProfile,
  getMe,
  socialLogin,
  changePassword,
};
