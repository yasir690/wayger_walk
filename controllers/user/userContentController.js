const prisma = require("../../config/prismaConfig");
const { NotFoundError, BadRequestError } = require("../../resHandler/CustomError");
const { handlerOk } = require("../../resHandler/responseHandler");

const userPrivacyPolicy = async (req, res, next) => {
      try {

    const privacypolicy = await prisma.privacyPolicy.findFirst();

    if (!privacypolicy) {
      throw new NotFoundError("privacy policy not found");
    }

    handlerOk(res, 200, privacypolicy, 'privacy policy found successfully')
  } catch (error) {
    next(error)
  }
}

const userTermsCondition = async (req, res, next) => {
     try {
    const termscondition = await prisma.termsCondition.findFirst();

    if (!termscondition) {
      throw new NotFoundError("terms condition not found");
    }

    handlerOk(res, 200, termscondition, 'terms condition found successfully')
  } catch (error) {
    next(error)
  }
}

const userAboutApp = async (req, res, next) => {
    try {
    const termscondition = await prisma.aboutApp.findFirst();

    if (!termscondition) {
      throw new NotFoundError("about app not found");
    }

    handlerOk(res, 200, termscondition, 'about app found successfully')
  } catch (error) {
    next(error)
  }
    
}

const userSubmitFeedBack = async (req, res, next) => {
    try {
        const {id}=req.user;
        const {subject,message}=req.body;
        const files = req.files;

        console.log(files,'files');
        

    const basePath = `http://${req.get("host")}/public/uploads/`;
    const imageUrls = files.map(file => `${basePath}${file.filename}`);

    const createfeedback=await prisma.feedBack.create({
        data:{
            subject,
            message,
            createdById:id,
            Images:imageUrls
        }
    });



    if (!createfeedback) {
      throw new NotFoundError("feed back not create");
    }

    handlerOk(res, 200, createfeedback, 'feed back created successfully')
  } catch (error) {
    next(error)
  }
    
}

module.exports={
    userPrivacyPolicy,
    userTermsCondition,
    userAboutApp,
    userSubmitFeedBack
}